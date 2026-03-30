import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="footer-container">
                <div className="footer-brand-section">
                    <div className="footer-logo">
                        <img src="/logo-full.png" alt="Traavo" className="footer-logo-img" />
                    </div>
                    <p className="footer-tagline">
                        Your intelligent travel companion for finding reliable routes when direct paths fail.
                    </p>
                    <div className="footer-social-links">
                        <a href="https://instagram.com/traavo2026" target="_blank" rel="noopener noreferrer" className="social-link instagram" title="Instagram">
                            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        <a href="https://www.facebook.com/share/1H1YSW8YxF/" target="_blank" rel="noopener noreferrer" className="social-link facebook" title="Facebook">
                            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </a>
                    </div>
                </div>

                <div className="footer-links-grid">
                    <div className="footer-link-column">
                        <h4>Company</h4>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/explore">Explore India</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/contact">Support</Link></li>
                        </ul>
                    </div>

                    <div className="footer-link-column">
                        <h4>Emergency Help</h4>
                        <ul>
                            <li><Link to="/missed-train-what-to-do">Missed Train?</Link></li>
                            <li><Link to="/backup-routes-cancelled-train-bus">Cancelled Train</Link></li>
                            <li><Link to="/no-train-ticket-guide-2026">No Ticket? (2026)</Link></li>
                            <li><Link to="/urgent-travel-medical-emergencies">Medical Emergencies</Link></li>
                            <li><Link to="/irctc-new-cancellation-rules-2026">New Cancellation Rules</Link></li>
                            <li><Link to="/pnr-waitlist-status-guide">PNR Status Guide</Link></li>
                            <li><Link to="/waitlisted-ticket-cant-board">Waitlist Rules 2026</Link></li>
                        </ul>
                    </div>

                    <div className="footer-link-column">
                        <h4>Smart Routing</h4>
                        <ul>
                            <li><Link to="/seat-chain-booking-trick">Seat Chain Trick</Link></li>
                            <li><Link to="/nearby-station-availability-trick">Nearby Station Trick</Link></li>
                            <li><Link to="/vande-bharat-alternatives">VB Alternatives</Link></li>
                            <li><Link to="/best-transit-hubs-switch-train-bus">Top Transit Hubs</Link></li>
                            <li><Link to="/how-to-travel-from-city-a-to-city-b">Smart Pathfinding</Link></li>
                            <li><Link to="/railone-app-guide-india">RailOne App Guide</Link></li>
                            <li><Link to="/tier-2-tier-3-planner">Tier-2/3 Planner</Link></li>
                        </ul>
                    </div>

                    <div className="footer-link-column">
                        <h4>Route Guides</h4>
                        <ul>
                            <li><Link to="/mumbai-pune-status-2026">Mumbai-Pune</Link></li>
                            <li><Link to="/delhi-mumbai-guide-2026">Delhi-Mumbai</Link></li>
                            <li><Link to="/delhi-varanasi-backup">Delhi-Varanasi</Link></li>
                            <li><Link to="/delhi-to-patna-plan-b-travel-guide">Delhi-Patna</Link></li>
                            <li><Link to="/vande-bharat-sleeper-routes-2026">VB Sleeper Routes</Link></li>
                            <li><Link to="/msrtc-ksrtc-bus-train-combo">MSRTC/KSRTC</Link></li>
                            <li><Link to="/train-routes">All Rail Routes</Link></li>
                        </ul>
                    </div>

                    <div className="footer-link-column">
                        <h4>Adventure & Planning</h4>
                        <ul>
                            <li><Link to="/long-weekend-2026-guide">Long Weekends</Link></li>
                            <li><Link to="/exam-travel-last-minute">Exam Travel</Link></li>
                            <li><Link to="/diwali-holi-emergency-travel">Festival Rush</Link></li>
                            <li><Link to="/explore-state-under-budget">Budget Trips</Link></li>
                            <li><Link to="/hidden-adventure-spots-accessible-by-bus">Hidden Gems</Link></li>
                            <li><Link to="/weekend-getaways-students-pune">Pune Specials</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {currentYear} Traavo Technologies. All rights reserved.</p>
                <div className="footer-bottom-links">
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/terms">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
