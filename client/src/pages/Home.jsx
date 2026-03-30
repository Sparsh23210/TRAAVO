import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LocationInput from '../components/LocationInput';
import SwapButton from '../components/SwapButton';
import LoginModal from '../components/LoginModal';
import SubscriptionModal from '../components/SubscriptionModal';
import { useAuth } from '../context/AuthContext';
import MetaTags from '../components/MetaTags';
import SEOContentSections from '../components/SEOContentSections';
import { SEO_CONTENT } from '../data/seoContent';


import img1 from '../1.jpeg';
import img2 from '../2.jpeg';
import img3 from '../3.jpeg';
import img4 from '../4.jpeg';
import img5 from '../5.jpeg';

const Home = () => {
    const images = [img1, img2, img3, img4, img5];
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();

    const [from, setFrom] = useState(location.state?.from || '');
    const [to, setTo] = useState(location.state?.to || '');
    const [fromData, setFromData] = useState(location.state?.fromData || null); // { lat, lon, name }
    const [toData, setToData] = useState(location.state?.toData || null);     // { lat, lon, name }

    // New Filters
    const [day, setDay] = useState(location.state?.day || 'ALL');
    const [time, setTime] = useState(location.state?.time || 'All Time');
    const [maxHops, setMaxHops] = useState(location.state?.maxHops || 1);

    const [error, setError] = useState('');
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    // Carousel auto-slide logic (1s interval)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImgIndex((prev) => (prev + 1) % images.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [images.length]);

    const validate = (f, t) => {
        if (f && t && f.toLowerCase() === t.toLowerCase()) {
            setError('From and To cannot be the same');
            return false;
        }
        setError('');
        return true;
    };

    const handleFromSelect = (place) => {
        // place is the full object from LocationInput
        setFrom(place.name);
        setFromData(place);
        validate(place.name, to);
    };

    const handleToSelect = (place) => {
        setTo(place.name);
        setToData(place);
        validate(from, place.name);
    };

    const handleSwap = () => {
        const temp = from;
        const tempData = fromData;
        setFrom(to);
        setFromData(toData);
        setTo(temp);
        setToData(tempData);
        validate(to, temp);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!currentUser) {
            setIsLoginOpen(true);
            return;
        }

        // CREDIT CHECK
        if (currentUser.credits !== undefined && currentUser.credits <= 0) {
            setIsSubscriptionOpen(true);
            return;
        }

        if (validate(from, to) && from && to) {
            navigate('/results', {
                state: {
                    from,
                    to,
                    day,
                    time,
                    maxHops,
                    mode: 'All',
                    fromData, // Pass coordinates
                    toData,    // Pass coordinates
                    costCredit: true // Deduct on first valid search
                }
            });
        }
    };

    const handleLoginSuccess = () => {
        // Post-login check logic
        if (currentUser && currentUser.credits !== undefined && currentUser.credits <= 0) {
            setIsSubscriptionOpen(true);
            return;
        }
        if (validate(from, to) && from && to) {
            navigate('/results', {
                state: {
                    from,
                    to,
                    day,
                    time,
                    maxHops,
                    mode: 'All',
                    fromData,
                    toData,
                    costCredit: true
                }
            });
        }
    };

    return (
        <>
            <MetaTags
                title={SEO_CONTENT['home'].title}
                description={SEO_CONTENT['home'].description}
                canonical="/"
                faqSchema={SEO_CONTENT['home'].faqSchema}
            />
            <div className="home-split-container">
            {/* Left Side: Image Carousel */}
            <div className="carousel-side">
                {images.map((img, index) => (
                    <div
                        key={index}
                        className={`carousel-slide ${index === currentImgIndex ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${img})` }}
                    >
                        <div className="carousel-overlay">
                            <h2>Safe Travels, Smart Routes</h2>
                            <p>Connecting you when direct paths are unavailable.</p>
                        </div>
                    </div>
                ))}
            </div>


            <div className="form-side">
                    <div className="form-container-inner">
                        <h1 className="home-title">Reach 11000+ places in India</h1>

                        <form onSubmit={handleSubmit} className="home-card">
                            <div className="form-group">
                                <LocationInput
                                    label="From City / Location"
                                    type="from"
                                    value={from}
                                    onSelect={handleFromSelect}
                                    error={error && error.includes('From') ? error : null}
                                    placeholder="e.g. Kurukshetra"
                                />
                            </div>

                            <div className="swap-wrapper">
                                <SwapButton onSwap={handleSwap} />
                            </div>

                            <div className="form-group">
                                <LocationInput
                                    label="To City / Location"
                                    type="to"
                                    value={to}
                                    onSelect={handleToSelect}
                                    error={error ? error : null}
                                    placeholder="e.g. Panipat"
                                />
                            </div>

                            <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Day</label>
                                    <select value={day} onChange={e => setDay(e.target.value)}>
                                        <option value="ALL">All Days</option>
                                        <option value="MON">Monday</option>
                                        <option value="TUE">Tuesday</option>
                                        <option value="WED">Wednesday</option>
                                        <option value="THU">Thursday</option>
                                        <option value="FRI">Friday</option>
                                        <option value="SAT">Saturday</option>
                                        <option value="SUN">Sunday</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Departure Time</label>
                                    <select value={time} onChange={e => setTime(e.target.value)}>
                                        <option value="All Time">All Time</option>
                                        {Array.from({ length: 24 }).flatMap((_, i) => {
                                            const h = i % 12 || 12;
                                            const ampm = i < 12 ? 'AM' : 'PM';
                                            return [
                                                <option key={`${i}-00`} value={`${String(i).padStart(2, '0')}:00`}>{`${String(h).padStart(2, '0')}:00 ${ampm}`}</option>,
                                                <option key={`${i}-30`} value={`${String(i).padStart(2, '0')}:30`}>{`${String(h).padStart(2, '0')}:30 ${ampm}`}</option>
                                            ];
                                        })}
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Max Hops</label>
                                    <select value={maxHops} onChange={e => {
                                        const val = Number(e.target.value);
                                        if (val === 3 && currentUser?.plan !== 'premium' && currentUser?.plan !== 'pro_premium' && currentUser?.plan !== 'ultra_premium') {
                                            setIsSubscriptionOpen(true);
                                        } else {
                                            setMaxHops(val);
                                        }
                                    }}>
                                        <option value={1}>1 Hop</option>
                                        <option value={2}>2 Hops</option>
                                        <option value={3} style={{ color: '#b8860b', textShadow: '0px 0px 5px rgba(218, 165, 32, 0.8)', fontWeight: 'bold' }}>3 Hops ⭐ Premium</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary-home"
                                disabled={!!error}
                                style={{ opacity: error ? 0.7 : 1 }}
                            >
                                {currentUser ? 'Search' : 'Login to Search'}
                            </button>
                        </form>

                        <div className="home-tagline">
                            <p>Finding a way when direct options fail.</p>
                        </div>
                    </div>
                </div>

                <LoginModal
                    isOpen={isLoginOpen}
                    onClose={() => setIsLoginOpen(false)}
                    onSuccess={handleLoginSuccess}
                />

                <SubscriptionModal
                    isOpen={isSubscriptionOpen}
                    onClose={() => setIsSubscriptionOpen(false)}
                />
            </div>
        </>
    );
};

export default Home;
