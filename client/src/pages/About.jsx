import React from 'react';
import './About.css';

const About = () => {
    return (
        <div className="about-container">
            <div className="about-hero">
                <h1>About Traavo</h1>
                <p className="hero-subtitle">Redefining Travel in India</p>
            </div>

            <div className="about-mission problem-section">
                <h2>The Problem</h2>
                <div className="problem-content">
                    <p className="intro-text">
                        In urgent situations, travel becomes stressful and uncertain. Train tickets are often
                        unavailable, flights are expensive, and popular routes get overcrowded—especially during
                        festivals, holidays, or medical emergencies.
                    </p>

                    <div className="problem-points">
                        <div className="point-item">
                            <span className="point-icon">📉</span>
                            <div className="point-text">
                                <strong>Scattered Information</strong>
                                <p>Train tickets often show waitlists, leaving travelers in limbo during critical times.</p>
                            </div>
                        </div>
                        <div className="point-item">
                            <span className="point-icon">🚧</span>
                            <div className="point-text">
                                <strong>Fragmented Connectivity</strong>
                                <p>Buses don’t always run directly, and alternative connection points are often unclear.</p>
                            </div>
                        </div>
                        <div className="point-item">
                            <span className="point-icon">❓</span>
                            <div className="point-text">
                                <strong>The "Emergency" Gap</strong>
                                <p>People don’t know where to change or how to continue when primary paths fail.</p>
                            </div>
                        </div>
                    </div>

                    <p className="impact-text">
                        Guessing routes or relying on word-of-mouth wastes critical time and increases anxiety when you can least afford it.
                    </p>
                </div>
            </div>

            <div className="about-mission solution-section">
                <h2>The Solution</h2>
                <div className="solution-content">
                    <p className="intro-text">
                        Traavo is built to solve this exact problem. Instead of showing only direct routes,
                        we help you discover all possible ways to reach your destination.
                    </p>

                    <div className="solution-points">
                        <div className="point-item solution-point">
                            <span className="point-icon">🛰️</span>
                            <div className="point-text">
                                <strong>Discover Alternatives</strong>
                                <p>Find practical path combinations when direct tickets are "Waitlisted" or "Not Available".</p>
                            </div>
                        </div>
                        <div className="point-item solution-point">
                            <span className="point-icon">📍</span>
                            <div className="point-text">
                                <strong>Smart Transitions</strong>
                                <p>Understand exactly where to change and how to break a long journey into manageable steps.</p>
                            </div>
                        </div>
                        <div className="point-item solution-point">
                            <span className="point-icon">✨</span>
                            <div className="point-text">
                                <strong>Total Clarity</strong>
                                <p>Traavo turns travel uncertainty into a clear, actionable plan so you can focus on what matters.</p>
                            </div>
                        </div>
                    </div>

                    <p className="impact-text solution-impact">
                        Traavo ensures you reach where you need to be, when it matters most—turning confusion into confidence.
                    </p>
                </div>
            </div>

            <div className="about-grid">
                <div className="about-card">
                    <div className="card-icon">🌍</div>
                    <h3>10,000+ Places</h3>
                    <p>Comprehensive coverage across India, from bustling metros to the quietest corners.</p>
                </div>
                <div className="about-card">
                    <div className="card-icon">🚑</div>
                    <h3>Emergency Ready</h3>
                    <p>Designed for when time is critical and direct routes are unavailable.</p>
                </div>
                <div className="about-card">
                    <div className="card-icon">⚡</div>
                    <h3>Smart Routing</h3>
                    <p>Advanced algorithms to find indirect but effective paths for your journey.</p>
                </div>
            </div>

            <div className="about-mission">
                <h2>Our Mission</h2>
                <div className="mission-content">
                    <p>
                        In an emergency, every second counts. Traavo was built to bridge the gap in India's transport network,
                        providing redundant, reliable pathfinding when primary options fail. Our goal is to ensure that
                        no one is ever stuck without a way to reach their destination when it matters most.
                    </p>
                </div>
            </div>

            <div className="about-footer">
                <p>Version 1.2.0 • Made for India </p>

            </div>
        </div>
    );
};

export default About;
