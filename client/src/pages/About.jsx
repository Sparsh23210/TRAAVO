import React, { useEffect } from 'react';
import MetaTags from '../components/MetaTags';
import SEOContentSections from '../components/SEOContentSections';
import { SEO_CONTENT } from '../data/seoContent';
import './About.css';

const About = () => {
    const data = SEO_CONTENT['about'];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="about-page-wrapper">
            {/* Ambient Background Accents */}
            <div className="about-bg-glow-1"></div>
            <div className="about-bg-glow-2"></div>
            <div className="about-bg-glow-3"></div>

            <div className="about-container">
                <MetaTags 
                    title={data.title}
                    description={data.description}
                    canonical="/about"
                    faqSchema={data.faqSchema}
                />

                <div className="about-hero">
                    <span className="hero-badge">Welcome to Traavo</span>
                    <h1 className="about-title">Redefining <span>Travel</span> in India</h1>
                    <p className="about-subtitle">
                        Navigating the uncertain. We're on a mission to ensure no one is ever stuck without a way to reach their destination when it matters most.
                    </p>
                </div>

                <div className="about-content-wrapper">
                    
                    {/* The Problem Section */}
                    <div className="about-section">
                        <div className="about-section-header">
                            <h2>The Problem</h2>
                            <p className="about-section-intro">
                                In urgent situations, travel becomes stressful and uncertain. Train tickets are often unavailable, flights (future scope) are expensive, and popular routes get overcrowded—especially during festivals, holidays, or medical emergencies.
                            </p>
                        </div>

                        <div className="feature-grid">
                            <div className="feature-card">
                                <div className="feature-icon-box color-red">📉</div>
                                <h3>Scattered Information</h3>
                                <p>Train tickets often show waitlists or sold-out statuses, leaving travelers completely in limbo during critical decision times.</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon-box color-orange">🚧</div>
                                <h3>Fragmented Connectivity</h3>
                                <p>Intercity buses and intermediate trains don't always connect efficiently, and viable alternative connection points remain completely unclear.</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon-box color-purple">❓</div>
                                <h3>The "Emergency" Gap</h3>
                                <p>Without proper geographic understanding, passengers simply don't know where to logically change when direct, primary paths fail.</p>
                            </div>
                        </div>

                        <div className="impact-box negative">
                            Guessing routes or relying on word-of-mouth wastes critical time and massive energy, drastically increasing anxiety when you can least afford it.
                        </div>
                    </div>

                    {/* The Solution Section */}
                    <div className="about-section">
                        <div className="about-section-header">
                            <h2>The Solution</h2>
                            <p className="about-section-intro">
                                Traavo is engineered to systematically solve this exact crisis. Instead of rigidly showing only direct routes, we computationally help you discover all verified ways to reach your final destination.
                            </p>
                        </div>

                        <div className="feature-grid">
                            <div className="feature-card">
                                <div className="feature-icon-box color-blue">🛰️</div>
                                <h3>Discover Alternatives</h3>
                                <p>Find practical, robust path combinations intelligently connecting trains, buses, and flights (future scope) when direct tickets are hopelessly Waitlisted.</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon-box color-green">📍</div>
                                <h3>Smart Transitions</h3>
                                <p>Understand precisely exactly where to safely change modes and logically how to break a gruesome long journey into manageable, guaranteed steps.</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon-box color-indigo">✨</div>
                                <h3>Total Clarity</h3>
                                <p>Traavo dynamically transforms pure travel uncertainty into a beautifully clear, actionable transit plan so you can focus strictly on what matters.</p>
                            </div>
                        </div>

                        <div className="impact-box positive">
                            Traavo accurately ensures you successfully reach where you need to physically be, exactly when it deeply matters most.
                        </div>
                    </div>

                    {/* Stats/Highlights */}
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value">10k+</div>
                            <div className="stat-label">Destinations Indexed</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">24/7</div>
                            <div className="stat-label">Emergency Ready</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">0%</div>
                            <div className="stat-label">Waitlist Anxiety</div>
                        </div>
                    </div>

                    {/* SEO & Extra Content Sections */}
                    {data && (
                        <div className="about-seo-sections">
                            <SEOContentSections data={data} hideStats={true} />
                        </div>
                    )}

                    {/* Our Mission Box */}
                    <div className="mission-box">
                        <h2>Our Mission</h2>
                        <p>
                            In an emergency, every second truly counts. Traavo was intentionally built to aggressively bridge the massive gap in India's complex transport network, providing redundant, structurally reliable pathfinding when vital primary options mathematically fail.
                        </p>
                    </div>

                    <div className="about-footer">
                        <p>Version 1.2.0 • Proudly Made for India 🇮🇳</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default About;
