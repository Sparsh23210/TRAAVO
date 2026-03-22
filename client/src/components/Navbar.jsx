import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';
import './Navbar.css';
import logoImage from '../newimage.png';

const Navbar = () => {
    const { currentUser } = useAuth();
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isRecentOpen, setIsRecentOpen] = useState(true);
    const dropdownRef = useRef(null);

    // Load recent searches when dropdown opens
    // Load recent searches when dropdown opens
    // Load recent searches when dropdown opens
    useEffect(() => {
        if (isDropdownOpen && currentUser?.uid) {
            try {
                // User-specific keys ONLY
                const fromKey = `recent_from_locations_${currentUser.uid}`;
                const toKey = `recent_to_locations_${currentUser.uid}`;

                const fromLocs = JSON.parse(localStorage.getItem(fromKey) || '[]');
                const toLocs = JSON.parse(localStorage.getItem(toKey) || '[]');

                // Helper to get name string
                const getName = (item) => typeof item === 'object' && item !== null ? item.name : item;

                // Extract names, filter truthy, and deduplicate
                const allNames = [...fromLocs, ...toLocs].map(getName).filter(Boolean);
                const uniqueNames = [...new Set(allNames)].slice(0, 5);

                setRecentSearches(uniqueNames);
            } catch (err) {
                console.error("Failed to load recent searches in Navbar", err);
                setRecentSearches([]);
            }
        }
    }, [isDropdownOpen, currentUser]); // Add currentUser dependency

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogoutClick = () => {
        setIsDropdownOpen(false);
        setIsLogoutOpen(true);
    };

    return (
        <>
            <nav className="fixed-navbar">
                <div className="navbar-container">
                    <Link to="/" className="brand-logo">
                        <img src={logoImage} alt="Traavo" style={{ height: '145px' }} />
                    </Link>

                    <div className="nav-links">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/explore" className="nav-link">Explore</Link>
                        <Link to="/about" className="nav-link">About</Link>
                        <Link to="/contact" className="nav-link">Support</Link>
                    </div>

                    {currentUser && (
                        <div className="navbar-right" ref={dropdownRef}>
                            {currentUser.credits !== undefined && currentUser.credits !== null && (
                                <div className={`credit-pill ${currentUser.credits <= 0 ? 'red' : currentUser.credits <= 3 ? 'yellow' : ''}`}>
                                    <span>🪙</span> Credits: {currentUser.credits}
                                </div>
                            )}
                            <div className="profile-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                {currentUser.photoURL ? (
                                    <img src={currentUser.photoURL} alt="Profile" className="profile-avatar" />
                                ) : (
                                    <div className="profile-initial">
                                        {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                            </div>

                            {isDropdownOpen && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-section">
                                        <div
                                            className="section-header togglable"
                                            onClick={() => setIsRecentOpen(!isRecentOpen)}
                                        >
                                            <span>Recent Searches</span>
                                            <span className={`accordion-arrow ${isRecentOpen ? 'open' : ''}`}>▾</span>
                                        </div>
                                        {isRecentOpen && (
                                            <div className="section-content">
                                                {recentSearches.length > 0 ? (
                                                    <ul className="recent-list">
                                                        {recentSearches.map((item, index) => (
                                                            <li key={index} className="recent-item">
                                                                <span className="history-icon">🕒</span> {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="empty-state">No recent searches</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="dropdown-section">
                                        <Link
                                            to="/about"
                                            className="about-link-btn"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <span>About Traavo</span>
                                            <span className="arrow-right">→</span>
                                        </Link>
                                    </div>

                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-logout-btn" onClick={handleLogoutClick}>
                                        <span>Logout</span>
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>
            {/* Spacer to prevent content from hiding behind fixed navbar */}
            <div className="navbar-spacer"></div>

            <LogoutModal
                isOpen={isLogoutOpen}
                onClose={() => setIsLogoutOpen(false)}
                onLogoutSuccess={() => { }}
            />
        </>
    );
};

export default Navbar;
