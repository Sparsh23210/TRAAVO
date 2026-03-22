import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext'; // Import Auth
import './LocationInput.css';

const LocationInput = ({ label, type, value, onSelect, error, placeholder }) => {
    const { currentUser } = useAuth(); // Get user
    const [inputValue, setInputValue] = useState(value || '');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const wrapperRef = useRef(null);

    // Sync internal state with prop value
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Load recent searches on mount or when user/key changes
    useEffect(() => {
        // STRICT AUTH: If not logged in, do not show or load any recent searches
        if (!currentUser) {
            setRecentSearches([]);
            return;
        }

        // 1. Determine Keys for User-Specific History (Guaranteed authed here)
        const fromKey = `recent_from_locations_${currentUser.uid}`;
        const toKey = `recent_to_locations_${currentUser.uid}`;

        // 2. Setup Helper functions
        const normalize = (item) => {
            if (typeof item === 'string') return { name: item }; // Accept string-only legacy
            if (typeof item === 'object' && item !== null && item.name) return item; // Accept objects with at least a name
            return null;
        };

        // 4. Read & Parse
        try {
            const rawFrom = JSON.parse(localStorage.getItem(fromKey) || '[]');
            const rawTo = JSON.parse(localStorage.getItem(toKey) || '[]');

            // Combine both lists (From + To)
            const combined = [...rawFrom, ...rawTo]
                .map(normalize)
                .filter(Boolean);

            // Deduplicate by Name (Case Insensitive)
            const unique = [];
            const seen = new Set();
            combined.forEach(item => {
                const cleanName = item.name.trim().toLowerCase();
                if (!seen.has(cleanName)) {
                    seen.add(cleanName);
                    unique.push(item); // Keep original casing
                }
            });

            console.log(`[LocationInput] Loaded ${unique.length} shared recent items`);

            // Limit to top 5
            setRecentSearches(unique.slice(0, 5));

        } catch (e) {
            console.error("Failed to load recent searches", e);
            // Don't wipe keys to be safe, just show nothing
            setRecentSearches([]);
        }
    }, [currentUser, showDropdown]); // Reload when dropdown opens or user changes

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchPlaces = async (query) => {
        if (!query || query.length < 2) return;
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/places/search?query=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success) {
                setResults(data.results);
                setShowDropdown(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Debounce logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (inputValue.length >= 2 && document.activeElement === wrapperRef.current?.querySelector('input')) {
                fetchPlaces(inputValue);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [inputValue]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        if (e.target.value.length === 0) {
            setResults([]);
            setShowDropdown(true); // Show recent on clear? Prompt says "When input is focused and empty: Show recent searches"
        }
    };

    const handleFocus = () => {
        setShowDropdown(true);
    };

    const handleSelection = (place) => {
        // place is the full object { name, lat, lon, ... }
        setInputValue(place.name);
        setShowDropdown(false);
        onSelect(place); // Pass full object!
        addToRecent(place);
    };

    const addToRecent = (place) => {
        if (!currentUser) return; // Only save if logged in

        console.log(`[LocationInput] Adding to recent: ${place.name}`);
        // Create clean object to avoid saving unnecessary API data or circular refs
        const cleanPlace = {
            name: place.name,
            lat: place.lat,
            lon: place.lon || place.lng, // Handle both
            state: place.state
        };

        const STORAGE_KEY = type === 'from' ? `recent_from_locations_${currentUser.uid}` : `recent_to_locations_${currentUser.uid}`;

        let current = [...recentSearches];
        // Remove duplicate if exists (by name)
        current = current.filter(item => item.name !== place.name);
        // Add to front
        current.unshift(cleanPlace);
        // Limit to 5
        if (current.length > 5) current.pop();

        setRecentSearches(current);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    };

    const showRecent = inputValue.length < 2;
    const itemsToShow = showRecent ? recentSearches : results;

    // Enrich items for rendering
    const displayList = itemsToShow.map(item => ({
        ...item,
        isRecent: showRecent,
        _id: item._id || item.place_id || (item.name + Math.random())
    }));

    return (
        <div className="location-input-wrapper" ref={wrapperRef}>
            <label className="input-label">{label}</label>
            <input
                type="text"
                className={`location-input ${error ? 'input-error' : ''}`}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onClick={handleFocus}
                placeholder={placeholder}
            />
            {loading && <span className="loading-spinner-input"></span>}
            {error && <span className="error-message">{error}</span>}

            {showDropdown && (
                <ul className="places-dropdown">
                    {showRecent && displayList.length > 0 && (
                        <li className="dropdown-header">RECENT SEARCHES</li>
                    )}

                    {loading && <li className="dropdown-item disabled">Searching...</li>}

                    {!loading && displayList.length === 0 && (
                        <li className="dropdown-item disabled">
                            {inputValue.length < 2 ? "No recent searches" : "No matching locations found"}
                        </li>
                    )}

                    {!loading && displayList.map((item) => (
                        <li
                            key={item._id}
                            className="dropdown-item"
                            onClick={() => handleSelection(item)}
                        >
                            {/* Icon for Recent vs Search Result */}
                            <span className="location-icon">
                                {item.isRecent ? '🕒' : '📍'}
                            </span>

                            <div className="location-info">
                                <span className="location-name">{item.name}</span>
                                {item.state && <span className="location-state">{item.state}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LocationInput;
