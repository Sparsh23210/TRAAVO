import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BackgroundAnimation from '../components/BackgroundAnimation';
import MetaTags from '../components/MetaTags';
import SEOContentSections from '../components/SEOContentSections';
import { SEO_CONTENT } from '../data/seoContent';
import './Explore.css';

// Remove hardcoded DESTINATION_TYPES and fetch from API
const TRIP_DAYS = [
    { value: '1', label: '1 Day' },
    { value: '2', label: '2 Days' },
    { value: '3', label: '3 Days' },
    { value: '4', label: '4 Days' },
    { value: '5', label: '5 Days' }
];

const BUDGET_TYPES = [
    { value: 'standard', label: 'Standard' },
    { value: 'student', label: 'Student' }
];

const Explore = () => {
    const { currentUser } = useAuth();

    // Form State
    const [userLocation, setUserLocation] = useState('');
    const [type, setType] = useState('');
    const [state, setState] = useState(''); // New State Filter
    const [city, setCity] = useState('');
    const [tripDays, setTripDays] = useState('1');
    const [budgetType, setBudgetType] = useState('standard');
    const [budget, setBudget] = useState('');

    // Data State
    const [citiesList, setCitiesList] = useState([]);
    const [statesList, setStatesList] = useState([]); // New States List
    const [categoriesList, setCategoriesList] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [error, setError] = useState(null);

    // Fetch cities, states, and categories for dropdown on mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                const [cityRes, catRes, stateRes] = await Promise.all([
                    fetch(`${baseURL}/api/explore/cities`),
                    fetch(`${baseURL}/api/explore/categories`),
                    fetch(`${baseURL}/api/explore/states`)
                ]);

                const cityData = await cityRes.json();
                const catData = await catRes.json();
                const stateData = await stateRes.json();

                if (cityData.success) {
                    setCitiesList(cityData.cities);
                }
                if (catData.success) {
                    setCategoriesList(catData.categories);
                    // Set default type if available
                    if (catData.categories.length > 0) setType(catData.categories[0]);
                }
                if (stateData.success) {
                    setStatesList(stateData.states);
                }
            } catch (e) {
                console.error("Failed to load filters", e);
            }
        };
        fetchFilters();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        if (currentUser.credits <= 0) {
            alert("Insufficient credits! Please upgrade.");
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/explore/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type,
                    state, // Included in search
                    city,
                    tripDays,
                    budgetType,
                    budget
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.code === 'NO_CREDITS') {
                    alert("You have run out of credits!");
                }
                throw new Error(data.error || "Search failed");
            }

            setResults(data.results);
            setSearchPerformed(true);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="explore-container">
            <MetaTags 
                title={SEO_CONTENT['explore'].title}
                description={SEO_CONTENT['explore'].description}
                canonical="/explore"
                faqSchema={SEO_CONTENT['explore'].faqSchema}
            />
            <BackgroundAnimation />
            <div className="explore-header">
                <h1>Explore & Plan</h1>
                <p>Discover places according your preferences.</p>
            </div>

            <div className="explore-search-card">
                <form className="search-form" onSubmit={handleSearch}>

                    <div className="form-group">
                        <label>Your Location (Optional)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Delhi"
                            value={userLocation}
                            onChange={e => setUserLocation(e.target.value)}
                        />
                        <small style={{ fontSize: '0.75rem', color: '#64748b' }}>Required for "Show Map"</small>
                    </div>

                    {/* 2. Type (Required - Dynamic) */}
                    <div className="form-group">
                        <label>Destination Type *</label>
                        <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                            {categoriesList.length === 0 && <option>Loading...</option>}
                            {categoriesList.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* 2.5 State (Optional - Dynamic) */}
                    <div className="form-group">
                        <label>State (Optional)</label>
                        <select className="form-select" value={state} onChange={e => setState(e.target.value)}>
                            <option value="">All States</option>
                            {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* 3. City (Optional - Dynamic) */}
                    <div className="form-group">
                        <label>City (Optional)</label>
                        <select className="form-select" value={city} onChange={e => setCity(e.target.value)}>
                            <option value="">All Cities</option>
                            {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* 4. Trip Days (Required) */}
                    <div className="form-group">
                        <label>Trip Duration *</label>
                        <select className="form-select" value={tripDays} onChange={e => setTripDays(e.target.value)}>
                            {TRIP_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                    </div>

                    {/* 5. Budget Type (Required) */}
                    <div className="form-group">
                        <label>Budget Type *</label>
                        <select className="form-select" value={budgetType} onChange={e => setBudgetType(e.target.value)}>
                            {BUDGET_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                    </div>

                    {/* 6. Budget Amount (Optional) */}
                    <div className="form-group">
                        <label>Max Budget (₹) (Optional)</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="e.g. 5000"
                            value={budget}
                            onChange={e => setBudget(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>&nbsp;</label>
                        <button type="submit" className="explore-btn" disabled={loading}>
                            {loading ? 'Searching...' : 'Find Places 🔎'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Results */}
            {error && <div className="error-msg">{error}</div>}

            <div className="results-grid">
                {results.map(place => (
                    <PlaceCard
                        key={place._id}
                        place={place}
                        userLocation={userLocation}
                        currentUser={currentUser}
                        selectedDays={tripDays}
                    />
                ))}
            </div>

            {searchPerformed && results.length === 0 && !loading && (
                <div className="empty-msg">No places found matching your criteria.</div>
            )}

            <div style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                <SEOContentSections data={SEO_CONTENT['explore']} />
            </div>
        </div>
    );
};

// import LeafletMap from '../components/LeafletMap';

// ... (imports remain)

// ... (Explore component logic remains same)

// Sub-component for Place Card to handle Lazy Map
const PlaceCard = ({ place, userLocation, currentUser, selectedDays }) => {
    // Redirection to Google Maps directly
    const handleOpenMap = () => {
        if (!userLocation) return;

        const origin = encodeURIComponent(userLocation);
        const destination = encodeURIComponent(`${place.name}, ${place.city}`);
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

        window.open(url, '_blank');
    };

    const infoLink = `https://www.google.com/search?q=${encodeURIComponent(place.name + ' ' + place.city + ' tourism')}`;

    return (
        <div className="place-card">
            <div className="place-content">
                <span className="place-tag">{place.category[0]}</span>
                <h3 className="place-title">{place.name}</h3>
                <div className="place-meta">{place.city}, {place.state}</div>

                <div className="place-rating">
                    <span>⭐</span> {place.google_rating}
                </div>

                <div className="info-grid">
                    <div>
                        <span className="label">Entry Fee</span>
                        <div className="value">₹{place.entry_fee_inr}</div>
                    </div>
                    <div>
                        <span className="label">Budget ({selectedDays} Day{selectedDays > 1 ? 's' : ''})</span>
                        <div className="value" style={{ color: '#15803d' }}>₹{place.estimated_budget}</div>
                    </div>
                    <div>
                        <span className="label">Weekly Off</span>
                        <div className="value">{place.weekly_off}</div>
                    </div>
                    <div>
                        <span className="label">Best Time</span>
                        <div className="value">{place.best_time}</div>
                    </div>
                </div>

                <a href={infoLink} target="_blank" rel="noreferrer" className="wiki-link">
                    📖 Read More
                </a>

                {/* Map Section */}
                <div style={{ marginTop: '1rem' }}>
                    <button
                        className={`map-btn ${!userLocation ? 'disabled' : ''}`}
                        onClick={handleOpenMap}
                        disabled={!userLocation}
                        title={!userLocation ? "Enter location above to view route" : "Open in Google Maps"}
                    >
                        View Route on Google Maps 🗺️
                    </button>
                    {!userLocation && <div className="helper-text">Please add your location to view the route on map</div>}
                </div>
            </div>
        </div>
    );
};

export default Explore;
