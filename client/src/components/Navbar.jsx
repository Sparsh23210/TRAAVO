import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';
import SubscriptionModal from './SubscriptionModal';
import MobileBottomNavbar from './MobileBottomNavbar';
import './Navbar.css';
import logoImage from '../newimage.png';

export const DesktopNavbar = ({ 
    logoImage, currentUser, dropdownRef, isDropdownOpen, setIsDropdownOpen, 
    isRecentOpen, setIsRecentOpen, recentSearches, handleLogoutClick, setIsSubscriptionOpen
}) => {
    return (
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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <div 
                                    className={`credit-pill ${currentUser.credits <= 0 ? 'red' : currentUser.credits <= 3 ? 'yellow' : ''}`}
                                    onClick={() => setIsSubscriptionOpen(true)}
                                    style={{ cursor: 'pointer', marginRight: 0 }}
                                >
                                    <span>🪙</span> Credits: {currentUser.credits}
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>
                                    {currentUser.plan === 'ultra_premium' ? 'Ultra Premium' 
                                     : currentUser.plan === 'pro_premium' ? 'Pro Premium' 
                                     : currentUser.plan === 'premium' ? 'Premium' 
                                     : 'Free Trial'}
                                </div>
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

                        {isDropdownOpen && <ProfileDropdown 
                            isRecentOpen={isRecentOpen} 
                            setIsRecentOpen={setIsRecentOpen} 
                            recentSearches={recentSearches} 
                            handleLogoutClick={handleLogoutClick} 
                            setIsDropdownOpen={setIsDropdownOpen}
                        />}
                    </div>
                )}
            </div>
        </nav>
    );
};

export const MobileTopNavbar = ({ 
    logoImage, currentUser, dropdownRef, isDropdownOpen, setIsDropdownOpen, 
    isRecentOpen, setIsRecentOpen, recentSearches, handleLogoutClick, setIsSubscriptionOpen
}) => {
    return (
        <nav className="mobile-top-navbar">
            <div className="navbar-container mobile-top-container">
                <Link to="/" className="brand-logo mobile-logo">
                    <img src={logoImage} alt="Traavo" className="mobile-logo-img" />
                </Link>

                {currentUser && (
                    <div className="navbar-right mobile-navbar-right" ref={dropdownRef}>
                        {currentUser.credits !== undefined && currentUser.credits !== null && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <div 
                                    className={`credit-pill ${currentUser.credits <= 0 ? 'red' : currentUser.credits <= 3 ? 'yellow' : ''}`}
                                    onClick={() => setIsSubscriptionOpen(true)}
                                    style={{ cursor: 'pointer', marginRight: 0 }}
                                >
                                    <span>🪙</span> {currentUser.credits}
                                </div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>
                                    {currentUser.plan === 'ultra_premium' ? 'Ultra Premium' 
                                     : currentUser.plan === 'pro_premium' ? 'Pro Premium' 
                                     : currentUser.plan === 'premium' ? 'Premium' 
                                     : 'Free Trial'}
                                </div>
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
                        </div>

                        {isDropdownOpen && <ProfileDropdown 
                            isRecentOpen={isRecentOpen} 
                            setIsRecentOpen={setIsRecentOpen} 
                            recentSearches={recentSearches} 
                            handleLogoutClick={handleLogoutClick} 
                            setIsDropdownOpen={setIsDropdownOpen}
                        />}
                    </div>
                )}
            </div>
        </nav>
    );
};

const ProfileDropdown = ({ isRecentOpen, setIsRecentOpen, recentSearches, handleLogoutClick, setIsDropdownOpen }) => (
    <div className="profile-dropdown">
        <div className="dropdown-section">
            <div className="section-header togglable" onClick={() => setIsRecentOpen(!isRecentOpen)}>
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
            <Link to="/about" className="about-link-btn" onClick={() => setIsDropdownOpen(false)}>
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
);

const DevBanner = () => (
    <div className="dev-banner-wrapper">
        <div className="dev-banner-box">
            <span className="dev-banner-icon">⚠️</span>
            <span className="dev-banner-text">Distance and Map may not be correct, under development!!</span>
        </div>
    </div>
);

const Navbar = () => {
    const { currentUser } = useAuth();
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isRecentOpen, setIsRecentOpen] = useState(true);
    const desktopDropdownRef = useRef(null);
    const mobileDropdownRef = useRef(null);

    useEffect(() => {
        if (isDropdownOpen && currentUser?.uid) {
            try {
                const fromKey = `recent_from_locations_${currentUser.uid}`;
                const toKey = `recent_to_locations_${currentUser.uid}`;
                const fromLocs = JSON.parse(localStorage.getItem(fromKey) || '[]');
                const toLocs = JSON.parse(localStorage.getItem(toKey) || '[]');
                const getName = (item) => typeof item === 'object' && item !== null ? item.name : item;
                const allNames = [...fromLocs, ...toLocs].map(getName).filter(Boolean);
                const uniqueNames = [...new Set(allNames)].slice(0, 5);
                setRecentSearches(uniqueNames);
            } catch (err) {
                console.error("Failed to load recent searches in Navbar", err);
                setRecentSearches([]);
            }
        }
    }, [isDropdownOpen, currentUser]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedOutsideDesktop = desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target);
            const clickedOutsideMobile = mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target);
            
            if (clickedOutsideDesktop && clickedOutsideMobile) {
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

    const sharedProps = {
        logoImage, currentUser, isDropdownOpen, setIsDropdownOpen,
        isRecentOpen, setIsRecentOpen, recentSearches, handleLogoutClick, setIsSubscriptionOpen
    };

    return (
        <>
            <div className="desktop-only">
                <DesktopNavbar {...sharedProps} dropdownRef={desktopDropdownRef} />
            </div>

            <div className="mobile-only">
                <MobileTopNavbar {...sharedProps} dropdownRef={mobileDropdownRef} />
                <MobileBottomNavbar />
            </div>

            {/* Spacer to prevent content from hiding behind fixed navbars */}
            <div className="navbar-spacer desktop-only"></div>
            <div className="mobile-navbar-spacer mobile-only"></div>

            <LogoutModal
                isOpen={isLogoutOpen}
                onClose={() => setIsLogoutOpen(false)}
                onLogoutSuccess={() => { }}
            />
            <SubscriptionModal
                isOpen={isSubscriptionOpen}
                onClose={() => setIsSubscriptionOpen(false)}
            />
        </>
    );
};

export default Navbar;
