import React from 'react';
import './SEOPage.css';
import BackgroundAnimation from '../components/BackgroundAnimation';

const SEO_CONTENT = {
    'missed-train-what-to-do': {
        title: "Missed Your Train? Here is Your Emergency Plan B",
        subtitle: "Don't panic. Traavo helps you find the fastest alternative routes when primary transit fails.",
        content: (
            <>
                <p>Missing a train can be stressful, especially during emergencies or peak festival seasons. But it's not the end of your journey. Here’s exactly what you should do:</p>
                <h3>1. File a TDR (Ticket Deposit Receipt)</h3>
                <p>If you missed your train, you can file a TDR within 1-2 hours to claim a partial refund, depending on the circumstances.</p>
                <h3>2. Look for Alternative "Plan B" Routes</h3>
                <p>This is where Traavo shines. Instead of waiting for the next day's train (which might be waitlisted), use our search to find a combination of buses and connecting trains.</p>
                <h3>3. Check for Inter-City Bus Services</h3>
                <p>Often, a bus can take you to a nearby major hub where you can catch another train or a direct bus to your destination.</p>
            </>
        )
    },
    'how-to-travel-from-city-a-to-city-b': {
        title: "Smart Travel Guide: Reaching Your Destination Efficiently",
        subtitle: "Maximize your travel experience with Traavo's smart routing and alternative pathfinding.",
        content: (
            <>
                <p>Planning a trip between two cities in India requires understanding all available options—not just the direct ones.</p>
                <h3>Direct vs. Indirect Paths</h3>
                <p>While direct trains are convenient, they are often booked months in advance. Traavo helps you find "hidden" routes that combine different modes of transport to save you time and money.</p>
            </>
        )
    }
};

const SEOPage = ({ slug }) => {
    const data = SEO_CONTENT[slug] || {
        title: "Travel Guide",
        subtitle: "Explore smart ways to travel with Traavo.",
        content: <p>Our guide is being updated with the latest transit secrets. Stay tuned!</p>
    };

    return (
        <div className="seo-page-container">
            <BackgroundAnimation />
            <div className="seo-header">
                <h1>{data.title}</h1>
                <p className="seo-subtitle">{data.subtitle}</p>
            </div>
            <div className="seo-content-card">
                {data.content}
                <div className="seo-cta">
                    <h3>Ready to find your route?</h3>
                    <p>Use Traavo's Smart Search to discover all possible paths right now.</p>
                    <button onClick={() => window.location.href = '/'} className="search-now-btn">
                        Go to Home & Search 🔎
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SEOPage;
