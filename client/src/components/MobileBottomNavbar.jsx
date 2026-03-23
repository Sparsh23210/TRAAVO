import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Info, HandHeart } from 'lucide-react';
import './Navbar.css';

const MobileBottomNavbar = () => {
    return (
        <nav className="mobile-bottom-navbar">
            <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end>
                <Home size={24} className="bottom-nav-icon" />
                <span>Home</span>
            </NavLink>
            <NavLink to="/explore" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <Compass size={24} className="bottom-nav-icon" />
                <span>Explore</span>
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <Info size={24} className="bottom-nav-icon" />
                <span>About</span>
            </NavLink>
            <NavLink to="/contact" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <HandHeart size={24} className="bottom-nav-icon" />
                <span>Support</span>
            </NavLink>
        </nav>
    );
};

export default MobileBottomNavbar;
