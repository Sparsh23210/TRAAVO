import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import MobileRouteCard from '../components/MobileRouteCard';
// import MapComponent from '../components/MapComponent'; // Unused now
import LeafletRouteMap from '../components/LeafletRouteMap'; // New Component
import { filterRoutesByHops, sortRoutes, groupRoutes, groupRoutesByVia } from '../utils/ResultUtils';
import SubscriptionModal from '../components/SubscriptionModal';
import { useAuth } from '../context/AuthContext';

const Results = () => {
    const location = useLocation();
    // Expecting fromData/toData { lat, lon, name }
    const { from, to, day, time, maxHops: initialMaxHops, mode: initialMode, fromData, toData } = location.state || {};
    const { currentUser } = useAuth();
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

    const handleUpgrade = () => {
        setIsSubscriptionOpen(true);
    };

    // --- STATE ---
    // Raw Data from API
    const [rawCategories, setRawCategories] = useState({
        mixed: { best: [], all: [] },
        bus_train: { best: [], all: [] },
        train_bus: { best: [], all: [] },
        only_bus: { best: [], all: [] },
        only_train: { best: [], all: [] }
    });

    // UI State
    const [activeTab, setActiveTab] = useState('mixed'); // Keep for categories, but we have global string 'mode' now
    const [maxHops, setMaxHops] = useState(initialMaxHops || 1);
    const [filterDay, setFilterDay] = useState(day || 'ALL');
    const [filterTime, setFilterTime] = useState(time || 'All Time');
    const [filterMode, setFilterMode] = useState(initialMode || 'All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleCount, setVisibleCount] = useState(10);

    // Sync Tabs with Mode Filter
    useEffect(() => {
        const modeMap = {
            'All': 'mixed',
            'Only Bus': 'only_bus',
            'Only Train': 'only_train',
            'Bus + Train': 'bus_train',
            'Train + Bus': 'train_bus'
        };
        if (modeMap[filterMode] && activeTab !== modeMap[filterMode]) {
            setActiveTab(modeMap[filterMode]);
        }
    }, [filterMode]);
    
    useEffect(() => {
        const tabMap = {
            'mixed': 'All',
            'only_bus': 'Only Bus',
            'only_train': 'Only Train',
            'bus_train': 'Bus + Train',
            'train_bus': 'Train + Bus'
        };
        if (tabMap[activeTab] && filterMode !== tabMap[activeTab]) {
            setFilterMode(tabMap[activeTab]);
        }
    }, [activeTab]);

    // Map Modal State
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [selectedMapRoute, setSelectedMapRoute] = useState(null);

    // --- FETCH DATA ---
    useEffect(() => {
        if (!from || !to) return;

        const fetchRoutes = async () => {
            try {
                setLoading(true);
                setError(null);

                // We request maxHops based on user selection to save data, and pass mode/day/time
                const requestBody = {
                    from: from,
                    to: to,
                    time: filterTime,
                    day: filterDay,
                    mode: filterMode,
                    hops: maxHops
                };

                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/routes/find`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(currentUser && { 'Authorization': `Bearer ${await currentUser.getIdToken()}` })
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to fetch routes.');
                }
                const data = await response.json();
                setRawCategories(data.routes);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRoutes();
    }, [from, to, filterTime, filterDay, maxHops, filterMode]);

    // --- FILTER & PROCESS ---
    const processedData = useMemo(() => {
        let targetList = [];
        if (rawCategories[activeTab]) {
            targetList = [...rawCategories[activeTab].best, ...rawCategories[activeTab].all];
        }

        // 1. Strict Hop Filter
        // Let backend handle max hops, but ensure filter locally just in case
        let filtered = filterRoutesByHops(targetList, maxHops);

        // 2. Strict Mode Filtering applied locally (if backend doesn't fully prune)
        if (filterMode && filterMode !== 'All') {
            filtered = filtered.filter(route => {
                const type = route.type; // e.g., 'Bus', 'Train', 'Bus + Train'
                if (filterMode === 'Only Bus') return type === 'Bus' || type === 'Bus + Transfer' || type === 'Transfer + Bus' || type.indexOf('Train') === -1;
                if (filterMode === 'Only Train') return type === 'Train' || type === 'Train + Transfer' || type === 'Transfer + Train' || type.indexOf('Bus') === -1;
                if (filterMode === 'Train + Bus') return route.steps.some((s, idx) => s.mode === 'Train' && route.steps.slice(idx+1).some(n => n.mode === 'Bus'));
                if (filterMode === 'Bus + Train') return route.steps.some((s, idx) => s.mode === 'Bus' && route.steps.slice(idx+1).some(n => n.mode === 'Train'));
                return true;
            });
        }

        // 3. Grouping
        let grouped = groupRoutes(filtered);

        // 4. Sorting
        let sorted = sortRoutes(grouped, 'DISTANCE_THEN_ARRIVAL');

        // 5. Final Visual Grouping (Via City)
        return groupRoutesByVia(sorted);
    }, [rawCategories, activeTab, maxHops, filterMode]);

    // --- HANDLERS ---
    const handleLoadMore = () => setVisibleCount(prev => prev + 10);

    const handleShowMap = (route) => {
        // Prepare route data for map
        setSelectedMapRoute(route);
        setIsMapOpen(true);
    };

    // --- RENDER HELPERS ---
    if (!from || !to) return <NoSearchState />;

    const tabs = [
        { id: 'mixed', label: 'Mixed', icon: '🔀' },
        { id: 'bus_train', label: 'Bus→Train', icon: '🚍🚆' },
        { id: 'train_bus', label: 'Train→Bus', icon: '🚆🚍' },
        { id: 'only_bus', label: 'Bus Only', icon: '🚌' },
        { id: 'only_train', label: 'Train Only', icon: '🚆' }
    ];

    // Recursive render for groups or items
    const renderRouteItem = (item, index) => {
        if (item.type === 'via_group' && item.via !== 'DIRECT') {
            return (
                <ViaGroupCard
                    key={item.id || index}
                    group={item}
                    onShowMap={handleShowMap}
                    onUpgrade={handleUpgrade}
                />
            );
        }
        // Direct routes or individual items (fallback)
        // If it's a "DIRECT" group, just render its routes flat
        if (item.type === 'via_group' && item.via === 'DIRECT') {
            return item.routes.map((r, i) => (
                <MobileRouteCard
                    key={r.id || `${index}-${i}`}
                    route={r}
                    onShowMap={handleShowMap}
                    onUpgrade={handleUpgrade}
                />
            ));
        }

        // Fallback for standard routes if logic changes
        return <MobileRouteCard
            key={item.id || index}
            route={item}
            onShowMap={handleShowMap}
            onUpgrade={handleUpgrade}
        />;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', overflow: 'hidden' }}>

            {/* HEADER AREA */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', zIndex: 50 }}>
                {/* Top Row: Back + Search Context */}
                <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to="/" style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        ←
                    </Link>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>
                            {from} <span style={{ color: '#94a3b8' }}>→</span> {to}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                            {time} • {maxHops} Hop{maxHops > 1 && 's'} Strict
                        </div>
                    </div>
                    <div style={{ width: '24px' }}></div> {/* Spacer */}
                </div>


                {/* Main Navbar Top Filter */}
                <div style={{ padding: '0.5rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                        <select value={filterDay} onChange={e => setFilterDay(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                            <option value="ALL">All Days</option>
                            <option value="MON">Mon</option>
                            <option value="TUE">Tue</option>
                            <option value="WED">Wed</option>
                            <option value="THU">Thu</option>
                            <option value="FRI">Fri</option>
                            <option value="SAT">Sat</option>
                            <option value="SUN">Sun</option>
                        </select>
                        <select value={filterTime} onChange={e => setFilterTime(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                            <option value="All Time">All Time</option>
                            {Array.from({length: 24}).flatMap((_, i) => {
                                const h = i % 12 || 12;
                                const ampm = i < 12 ? 'AM' : 'PM';
                                return [
                                    <option key={`${i}-00`} value={`${String(i).padStart(2, '0')}:00`}>{`${String(h).padStart(2, '0')}:00 ${ampm}`}</option>,
                                    <option key={`${i}-30`} value={`${String(i).padStart(2, '0')}:30`}>{`${String(h).padStart(2, '0')}:30 ${ampm}`}</option>
                                ];
                            })}
                        </select>
                        <select value={maxHops} onChange={e => setMaxHops(Number(e.target.value))} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                            <option value={1}>1 Hop</option>
                            <option value={2}>2 Hops</option>
                            <option value={3}>3 Hops</option>
                            <option value={4}>4 Hops</option>
                        </select>
                        <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                            <option value="All">All Modes</option>
                            <option value="Only Bus">Only Bus</option>
                            <option value="Only Train">Only Train</option>
                            <option value="Bus + Train">Bus + Train</option>
                            <option value="Train + Bus">Train + Bus</option>
                        </select>
                    </div>
                </div>

                {/* Category Sub-Tabs */}
                <div style={{
                    overflowX: 'auto', whiteSpace: 'nowrap', padding: '0 1rem 0.5rem',
                    scrollbarWidth: 'none', display: 'flex', gap: '1.5rem',
                    borderBottom: '1px solid #f1f5f9'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'none', border: 'none', padding: '0.75rem 0',
                                color: activeTab === tab.id ? '#0f172a' : '#94a3b8',
                                fontWeight: activeTab === tab.id ? '800' : '600',
                                fontSize: '0.9rem', borderBottom: activeTab === tab.id ? '3px solid #0f172a' : '3px solid transparent',
                                transition: 'all 0.2s', flexShrink: 0
                            }}
                        >
                            <span style={{ marginRight: '6px' }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', paddingBottom: '5rem' }}>
                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState error={error} />
                ) : processedData.length > 0 ? (
                    <>
                        <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#64748b', textAlign: 'center', fontWeight: '500' }}>
                            Found {processedData.reduce((acc, g) => acc + (g.type === 'via_group' ? g.routes.length : 1), 0)} option{processedData.length !== 1 && 's'}
                            for  {activeTab.replace('_', ' ')}  ({maxHops} Hop{maxHops !== 1 && 's'})
                        </div>

                        {processedData.slice(0, visibleCount).map((item, i) => renderRouteItem(item, i))}

                        {processedData.length > visibleCount && (
                            <button
                                onClick={handleLoadMore}
                                style={{ width: '100%', padding: '1rem', background: '#e2e8f0', border: 'none', borderRadius: '12px', fontWeight: 'bold', color: '#475569' }}
                            >
                                Load More Routes
                            </button>
                        )}
                    </>
                ) : (
                    <EmptyState hop={maxHops} />
                )}
            </div>

            <SubscriptionModal
                isOpen={isSubscriptionOpen}
                onClose={() => setIsSubscriptionOpen(false)}
            />

            {/* LEAFLET MAP MODAL */}
            {isMapOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000,
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ background: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🗺️</span> Route Map
                        </h3>
                        <button onClick={() => setIsMapOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <LeafletRouteMap
                            fromLocation={{ ...fromData, name: from }}
                            toLocation={{ ...toData, name: to }}
                            route={selectedMapRoute}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB COMPONENTS ---

const NoSearchState = () => (
    <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
        <h2>No Search Query</h2>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', width: 'auto', marginTop: '1rem' }}>Go Home</Link>
    </div>
);

const LoadingState = () => (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1.5rem', color: '#64748b', fontWeight: '600' }}>Finding best routes...</p>
    </div>
);

const ErrorState = ({ error }) => (
    <div style={{ background: '#fef2f2', padding: '2rem', borderRadius: '16px', textAlign: 'center', margin: '2rem 0' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <h3 style={{ color: '#991b1b', margin: 0 }}>Connection Error</h3>
        <p style={{ color: '#ef4444' }}>{error}</p>
    </div>
);

const EmptyState = ({ hop }) => (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
        <h3 style={{ color: '#1e293b', fontWeight: '800', marginBottom: '0.5rem' }}>
            {hop === 1 ? 'No direct routes found (1 hop)' : `No routes found for ${hop} hops`}
        </h3>
        <p style={{ color: '#64748b', maxWidth: '280px', margin: '0 auto' }}>
            {hop < 4
                ? 'Try increasing the hop filter to see more connections.'
                : 'We couldn\'t find a route even with maximum connections.'}
        </p>
    </div>
);


const ViaGroupCard = ({ group, onShowMap, onUpgrade }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div style={{ marginBottom: '1.5rem', background: '#fff', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            {/* Header / Toggle */}
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    padding: '1rem', background: '#f1f5f9', borderBottom: expanded ? '1px solid #e2e8f0' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                }}
            >
                <div style={{ fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>VIA</span>
                    {group.via}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {group.routes.length} Route{group.routes.length !== 1 && 's'}
                    <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                </div>
            </div>

            {/* Content */}
            {expanded && (
                <div style={{ padding: '1rem', background: '#f8fafc' }}>
                    {group.routes.map((route, idx) => (
                        <div key={route.id || idx} style={{ marginBottom: idx < group.routes.length - 1 ? '1rem' : '0' }}>
                            <MobileRouteCard route={route} onShowMap={onShowMap} onUpgrade={onUpgrade} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Results;
