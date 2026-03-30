import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import RouteCard from '../components/RouteCard';
import MapComponent from '../components/MapComponent';
import MetaTags from '../components/MetaTags';
import SEOContentSections from '../components/SEOContentSections';
import { SEO_CONTENT } from '../data/seoContent';

const TrainRoutes = () => {
    const location = useLocation();
    const { from, to, time } = location.state || {};
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!from || !to) return;

        setLoading(true);
        setError(null);

        fetch('/api/routes/find', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, time, filter: 'train' })
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch train routes. Is the server running?');
                }
                return res.json();
            })
            .then(data => setRoutes(data.routes))
            .catch(err => {
                console.error(err);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, [from, to, time]);

    if (!from || !to) return <div className="container">Please search from home.</div>;

    return (
        <div className="container">
            <MetaTags 
                title="Train Routes & Rail Connectivity" 
                description="Find the best train-only routes and rail connectivity options across India with Traavo." 
                canonical="/train-routes" 
            />
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Back</Link>
            <h1 style={{ color: 'orange', fontSize: '2rem', marginBottom: '1rem' }}>Train Only Routes 🚆</h1>

            {loading && <div>Loading...</div>}

            {error && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
                    <h3>Error: {error}</h3>
                </div>
            )}

            {!loading && !error && routes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
                    <h3>No Direct Or Indirect Route Available</h3>
                </div>
            )}

            {routes.length > 0 && (
                <>
                    <MapComponent steps={routes[0].steps} mode="train" />
                    {routes.map(r => (
                        <RouteCard
                            key={r.id}
                            route={r}
                            onShowMap={() => {
                                const origin = encodeURIComponent(from);
                                const destination = encodeURIComponent(to);
                                window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=transit`, '_blank');
                            }}
                        />
                    ))}
                </>
            )}

            <div style={{ marginTop: '4rem' }}>
                <SEOContentSections data={SEO_CONTENT['train-routes']} />
            </div>
        </div>
    );
};

export default TrainRoutes;
