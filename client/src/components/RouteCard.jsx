import React from 'react';

import MapComponent from './MapComponent';

const RouteCard = ({ route, onShowMap }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
        <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {route.totalDistanceKm} km • {route.totalTime} ({route.hops} Hops)
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{
                        fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px',
                        background: route.confidence === 'High' ? '#dcfce7' : '#fef9c3',
                        color: route.confidence === 'High' ? '#166534' : '#854d0e',
                        whiteSpace: 'nowrap'
                    }}>
                        {route.confidence}
                    </span>
                    <button
                        onClick={() => onShowMap(route)}
                        style={{
                            background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px',
                            padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >
                        Show in Map
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            background: 'none', border: '1px solid #ddd', borderRadius: '4px',
                            padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer'
                        }}
                    >
                        {isExpanded ? 'Less' : 'More'}
                    </button>
                </div>
            </div>

            <div className="steps-summary" style={{ fontSize: '0.85rem' }}>
                {route.steps[0].from} ➝ {route.steps[route.steps.length - 1].to}
            </div>

            {isExpanded && (
                <>
                    <hr style={{ margin: '0.75rem 0', border: '0', borderTop: '1px solid #eee' }} />
                    <div className="steps-container">
                        {route.steps.map((step, idx) => (
                            <div key={idx} className="step-row" style={{ padding: '0.5rem 0' }}>
                                <div className="step-icon">
                                    {step.mode === 'Bus' && '🚌'}
                                    {step.mode === 'Train' && '🚆'}
                                    {step.mode === 'Walk' && '🚶'}
                                </div>
                                <div className="step-details">
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{step.from} ➝ {step.to}</div>
                                    <div className="step-operator">{step.operator}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#555' }}>
                                        {step.depTime} - {step.arrTime}
                                    </div>
                                    <a href={step.mapLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#3b82f6' }}>View Map</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default RouteCard;
