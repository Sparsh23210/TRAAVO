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
    },
    'diwali-holi-emergency-travel': {
        title: "Diwali & Holi Emergency Travel Guide",
        subtitle: "Find hidden routes to your hometown when all direct tickets are sold out.",
        content: (
            <>
                <p>Festival seasons in India mean overcrowded trains and skyrocketing flight prices. If you haven't booked months in advance, you're not alone.</p>
                <h3>How to Find "Hidden" Routes</h3>
                <p>Instead of searching for a direct train to your home city, try searching for major hubs nearby. Traavo can help you find a train to a hub and a local bus for the last leg of your journey.</p>
            </>
        )
    },
    'best-transit-hubs-switch-train-bus': {
        title: "Top Transit Hubs for Smart Transitions",
        subtitle: "The best places in India to switch between trains and buses for a seamless journey.",
        content: (
            <>
                <p>A smart traveler knows that sometimes the best route isn't a straight line. Switching at the right transit hub can save you hours of wait-time.</p>
                <h3>Major Connectivity Hubs</h3>
                <p>Cities like Nagpur, Itarsi, and Vijayawada are critical junctions where you can easily find alternative bus services if your connecting train is delayed.</p>
            </>
        )
    },
    'delhi-to-patna-plan-b-travel-guide': {
        title: "Delhi to Patna: The Ultimate Plan B Guide",
        subtitle: "Stuck with a waitlisted ticket? Here are 3 alternative ways to reach Patna.",
        content: (
            <>
                <p>The Delhi-Patna route is one of the busiest in India. When the Rajdhani is full, don't lose hope.</p>
                <h3>Option A: The Hub-and-Spoke Method</h3>
                <p>Take a train to Varanasi or Mughalsarai and use a state transport bus for the remaining distance. Traavo identifies these connections automatically.</p>
            </>
        )
    },
    'urgent-travel-medical-emergencies': {
        title: "Medical Emergency Travel: Reaching Care Faster",
        subtitle: "Reliable pathfinding when time is critical and direct routes are unavailable.",
        content: (
            <>
                <p>In a medical emergency, every second counts. If you need to reach a specialist hospital in another city and direct tickets are unavailable, Traavo provides the redundancy you need.</p>
                <h3>Emergency Route Finder</h3>
                <p>Our algorithm prioritizes speed and reliability, showing you the fastest possible way to reach major medical hubs like Delhi, Mumbai, or Chennai using any available mode of transport.</p>
            </>
        )
    },
    'explore-state-under-budget': {
        title: "Explore India on a Budget: State-wise Guides",
        subtitle: "Discover heritage sites and spiritual centers without breaking the bank.",
        content: (
            <>
                <p>You don't need a fortune to see the beauty of India. With Traavo's budget explorer, you can filter destinations by your maximum spend.</p>
                <h3>Traveling Smart</h3>
                <p>Use our state-wise filters to find affordable gems in Rajasthan, Kerala, or Himachal Pradesh. Our tool calculates estimated budgets for 1 to 5-day trips automatically.</p>
            </>
        )
    },
    'why-indirect-route-is-faster': {
        title: "The Logic of Indirect Routes: Why 'Plan B' is Better",
        subtitle: "Understanding why a connecting path is often faster than a waitlisted direct train.",
        content: (
            <>
                <p>It sounds counter-intuitive: why would taking two buses and a train be better than one direct train? The answer is availability.</p>
                <h3>Beating the Waitlist</h3>
                <p>A "Confirmed" indirect seat is always better than a "Waitlisted" direct one. Traavo helps you bypass the uncertainty of Indian Railways during peak times.</p>
            </>
        )
    },
    'hidden-adventure-spots-accessible-by-bus': {
        title: "Adrenaline on a Bus: Hidden Adventure Spots",
        subtitle: "Trekking, rafting, and camping sites you can reach via state transport.",
        content: (
            <>
                <p>You don't need a private cab to reach the best adventure spots. Many of India's most stunning treks and rafting sites are well-connected by local buses.</p>
                <h3>Eco-friendly Adventure</h3>
                <p>Discover spots in Uttarakhand and Himachal that are accessible via affordable public transit, helping you save money for the actual adventure.</p>
            </>
        )
    },
    'weekend-getaways-students-pune': {
        title: "Student Weekend Getaways from Pune",
        subtitle: "Affordable, high-energy trips for your next break from college.",
        content: (
            <>
                <p>Being a student in Pune means you're surrounded by amazing getaways. From the forts of the Sahyadris to the beaches of Konkan, there's always a bus ready to take you there.</p>
                <h3>Travel on a Student Budget</h3>
                <p>Use Traavo's 'Student' budget toggle to find trips that fit your allowance. We prioritize low-cost transit and entry-free destinations.</p>
            </>
        )
    },
    'backup-routes-cancelled-train-bus': {
        title: "Train Cancelled? Your Backup Route Directory",
        subtitle: "What to do when weather or technical issues disrupt your primary travel plan.",
        content: (
            <>
                <p>Cancellations due to fog or maintenance are common. Don't get stuck at the station.</p>
                <h3>Real-time Redundancy</h3>
                <p>Traavo acts as your backup planner. If your train is cancelled, immediately search for the next available bus connection or an alternative rail route via a different junction.</p>
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
