import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MobileRouteCard = ({ route, onShowMap, onUpgrade }) => {
    const { currentUser } = useAuth();
    // If it's a grouped route, we handle state slightly differently, 
    // but the main expand toggle is similar.
    const [expanded, setExpanded] = useState(false);

    const isGrouped = route.type === 'grouped';

    const [optionsExpanded, setOptionsExpanded] = useState(false);
    const [visibleOptions, setVisibleOptions] = useState(5);

    // Derived values for display
    const firstLeg = isGrouped ? route.commonLeg : route.steps[0];
    // const lastLeg = isGrouped ? null : route.steps[route.steps.length - 1]; // Unused

    const representativeRoute = isGrouped ? route.options[0] : route;
    
    // Formatting helper for duration
    const formatDuration = (mins) => {
        if (!mins) return null;
        const d = Math.floor(mins / 1440);
        const h = Math.floor((mins % 1440) / 60);
        const m = Math.round(mins % 60);
        return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m}m`;
    };

    const totalDist = representativeRoute.live_distance 
        ? Math.round(representativeRoute.live_distance) 
        : representativeRoute.totalDistanceKm;
        
    const totalTime = representativeRoute.live_duration 
        ? formatDuration(representativeRoute.live_duration)
        : representativeRoute.totalTime;

    const hops = representativeRoute.hops;
    const isEnriched = !!representativeRoute.live_distance;

    // Grouped Label
    const subOptionCount = isGrouped ? route.options.length : 0;

    // Helper to clean names for display (removes "Bus Stand", "Railway Station")
    const cleanName = (name) => name ? name.replace(/( Bus Stand| Railway Station)$/i, '') : '';

    // --- ACTIONS ---
    const handleSave = async (e, routeData) => {
        e.stopPropagation();
        if (!currentUser?.features?.canSave) {
            if (onUpgrade) onUpgrade();
            else alert("Upgrade required");
            return;
        }

        // Generate PDF
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/routes/generate-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ route: routeData })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to generate PDF");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `route_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            console.error(e);
            alert("Failed to download PDF: " + e.message);
        }
    };

    const handleShare = (e, routeData) => {
        e.stopPropagation();
        if (!currentUser?.features?.canShare) {
            if (onUpgrade) onUpgrade();
            else alert("Upgrade required");
            return;
        }

        // Build detailed summary
        let summary = `*🚀 Traavo Trip Summary*\n`;
        summary += `From: ${cleanName(routeData.steps[0].from)}\n`;
        summary += `To: ${cleanName(routeData.steps[routeData.steps.length - 1].to)}\n`;
        summary += `Total Time: ${routeData.totalTime}\n`;
        summary += `Total Distance: ${routeData.totalDistanceKm} km\n\n`;

        routeData.steps.forEach((step, index) => {
            summary += `*Step ${index + 1}: ${step.mode}* ${step.operator ? `(${step.operator})` : ''}\n`;
            summary += `📍 ${cleanName(step.from)} ➝ ${cleanName(step.to)}\n`;
            summary += `🕒 ${step.depTime} - ${step.arrTime}\n`;
            if (step.distanceKm) summary += `📏 ${Math.round(step.distanceKm)} km\n`;
            if (step.mapLink) summary += `🔗 Map: ${step.mapLink}\n`;
            summary += `\n`;
        });

        summary += `------------------\n`;
        summary += `Book now on Traavo!`;

        window.open(`https://wa.me/?text=${encodeURIComponent(summary)}`, '_blank');
    };

    const renderActionButtons = (routeData) => (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onShowMap(routeData);
                }}
                style={{
                    flex: 1,
                    background: '#1e293b', color: '#fff', border: 'none',
                    padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600',
                    cursor: 'pointer'
                }}
            >
                Map 🌍
            </button>

            <button
                onClick={(e) => handleSave(e, routeData)}
                style={{
                    flex: 1,
                    background: currentUser?.features?.canSave ? '#ecfdf5' : '#f1f5f9',
                    color: currentUser?.features?.canSave ? '#059669' : '#94a3b8',
                    border: '1px solid',
                    borderColor: currentUser?.features?.canSave ? '#10b981' : '#cbd5e1',
                    padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                }}
            >
                {!currentUser?.features?.canSave && <span>🔒</span>} Save PDF
            </button>

            <button
                onClick={(e) => handleShare(e, routeData)}
                style={{
                    flex: 1,
                    background: currentUser?.features?.canShare ? '#ecfccb' : '#f1f5f9',
                    color: currentUser?.features?.canShare ? '#65a30d' : '#94a3b8',
                    border: '1px solid',
                    borderColor: currentUser?.features?.canShare ? '#84cc16' : '#cbd5e1',
                    padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                }}
            >
                {!currentUser?.features?.canShare && <span>🔒</span>} Share
            </button>
        </div>
    );


    return (
        <div
            onClick={() => setExpanded(!expanded)}
            style={{
                background: '#fff',
                borderRadius: '16px',
                marginBottom: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }}
        >
            {/* COLLAPSED HEADER (Always Visible) */}
            <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Mode Icons - Always show actual sequence */}
                        <div style={{ display: 'flex', gap: '2px', fontSize: '1.2rem' }}>
                            {representativeRoute.steps.map((s, i) => (
                                <span key={i}>{s.mode === 'Bus' ? '🚌' : s.mode === 'Train' ? '🚆' : s.mode === 'Transfer' ? '🛺' : '🚶'}</span>
                            ))}
                        </div>
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>• {totalDist} km</span>
                        {isEnriched && (
                            <span style={{ 
                                background: '#f0fdf4', color: '#166534', 
                                padding: '2px 6px', borderRadius: '4px', 
                                fontSize: '0.65rem', fontWeight: '800',
                                border: '1px solid #bbf7d0',
                                marginLeft: '4px'
                            }}>
                                LIVE 🌐
                            </span>
                        )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: '#3b82f6', fontSize: '0.9rem' }}>
                            Depart at: {representativeRoute.steps[0].depTime}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                           {hops} Hop{hops !== 1 && 's'} {totalTime ? `(${totalTime})` : ''}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>
                        {cleanName(representativeRoute.steps[0].from)} <span style={{ color: '#94a3b8' }}>→</span> {cleanName(representativeRoute.steps[representativeRoute.steps.length - 1].to)}
                    </div>

                    <div style={{
                        background: '#f1f5f9', color: '#475569',
                        padding: '4px 8px', borderRadius: '8px',
                        fontSize: '0.75rem', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                        {expanded ? 'Hide' : 'Show'}
                        <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
                    </div>
                </div>
            </div>

            {/* EXPANDED CONTENT */}
            {expanded && (
                <div style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>

                    {/* If Grouped: Show Common Leg(s) FIRST, then Options */}
                    {isGrouped ? (
                        <div style={{ padding: '1rem 0' }}>
                            {/* Common Legs Loop (Leg 1, Leg 2...) */}
                            <div style={{ padding: '0 1rem 1rem 1rem', borderBottom: '1px dashed #e2e8f0' }}>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700', marginBottom: '0.5rem' }}>
                                    Shared Trip Segment
                                </div>
                                {(route.commonLegs || [route.commonLeg]).map((step, idx) => (
                                    <div key={idx} style={{ marginBottom: idx < (route.commonLegs?.length || 1) - 1 ? '1rem' : '0' }}>
                                        <StepRow step={step} />
                                        {/* Optional Glue between common legs */}
                                    </div>
                                ))}
                            </div>

                            {/* Divider Arrow with Dropdown Toggle */}
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOptionsExpanded(!optionsExpanded);
                                }}
                                style={{
                                    padding: '0.75rem 1rem', background: '#f0f9ff', color: '#0369a1',
                                    fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    borderTop: '1px solid #bae6fd', borderBottom: '1px solid #bae6fd', cursor: 'pointer'
                                }}
                            >
                                <span>➡️</span> Continue from {cleanName((route.commonLegs ? route.commonLegs[route.commonLegs.length - 1] : route.commonLeg).to)}
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ background: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #bae6fd' }}>
                                        {subOptionCount} Options
                                    </span>
                                    <span style={{ fontSize: '1.1rem', transform: optionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                        ▾
                                    </span>
                                </div>
                            </div>

                            {/* Children Options (Conditional Render) */}
                            {optionsExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease' }}>
                                    {route.options.slice(0, visibleOptions).map((opt, idx) => {
                                        // Variable Leg is the one AFTER the common legs
                                        // If commonLegs has 1 item, variable is index 1.
                                        // If commonLegs has 2 items, variable is index 2.
                                        const variableIndex = route.commonLegs ? route.commonLegs.length : 1;
                                        const variableLeg = opt.steps[variableIndex];

                                        return (
                                            <div key={idx} style={{
                                                padding: '1rem',
                                                borderBottom: idx !== route.options.slice(0, visibleOptions).length - 1 ? '1px solid #e2e8f0' : 'none',
                                                background: '#fff'
                                            }}>
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    <StepRow step={variableLeg} />
                                                </div>

                                                {/* Actions for this Option */}
                                                {renderActionButtons(opt)}
                                            </div>
                                        );
                                    })}

                                    {route.options.length > visibleOptions && (
                                        <div style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setVisibleOptions(prev => prev + 5);
                                                }}
                                                style={{
                                                    background: 'none', border: '1px solid #cbd5e1', padding: '6px 16px',
                                                    borderRadius: '20px', color: '#475569', fontSize: '0.8rem', fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Load More Options ({route.options.length - visibleOptions} remaining)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Standard Linear Route */
                        <div style={{ padding: '1rem' }}>
                            {route.steps.map((step, idx) => (
                                <div key={idx} style={{ marginBottom: idx !== route.steps.length - 1 ? '1.5rem' : '0' }}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700', marginBottom: '0.5rem' }}>
                                        Step {idx + 1}
                                    </div>
                                    <StepRow step={step} />
                                    {/* Transfer Indicator if not last */}
                                    {idx !== route.steps.length - 1 && (
                                        <div style={{
                                            margin: '0.75rem 0 0.75rem 0.6rem', paddingLeft: '1rem',
                                            borderLeft: '2px dashed #cbd5e1', color: '#64748b', fontSize: '0.8rem',
                                            paddingTop: '0.5rem', paddingBottom: '0.5rem'
                                        }}>
                                            Change at <strong>{step.to}</strong>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Actions for Standard Route */}
                            <div style={{ marginTop: '1.5rem' }}>
                                {renderActionButtons(route)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Sub-component for a single leg visual
const StepRow = ({ step }) => (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: step.mode === 'Bus' ? '#fee2e2' : step.mode === 'Train' ? '#dbeafe' : step.mode === 'Transfer' ? '#fef9c3' : '#f1f5f9',
            color: step.mode === 'Bus' ? '#991b1b' : step.mode === 'Train' ? '#1e40af' : step.mode === 'Transfer' ? '#854d0e' : '#64748b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0
        }}>
            {step.mode === 'Bus' ? '🚌' : step.mode === 'Train' ? '🚆' : step.mode === 'Transfer' ? '🛺' : '🚶'}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                        background: step.mode === 'Bus' ? '#ef4444' : step.mode === 'Train' ? '#3b82f6' : '#64748b',
                        color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800'
                    }}>
                        {step.mode?.toUpperCase()}
                    </span>
                    {step.operator || (step.mode === 'Transfer' ? 'Auto/Taxi Connection' : 'Standard Service')}
                    {step.serviceType && step.mode === 'Bus' && <span style={{fontSize: '0.75rem', fontWeight: '500', color: '#64748b', marginLeft: '6px'}}>• {step.serviceType}</span>}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0f172a' }}>
                    {step.depTime} → {step.arrTime}
                </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{step.from} to {step.to}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {step.durationMins && (
                        <span style={{ fontWeight: '500', color: '#94a3b8' }}>
                            {Math.round(step.durationMins)}m
                        </span>
                    )}
                    {step.distanceKm && (
                        <span style={{ fontWeight: '600', color: '#334155' }}>
                            | {Math.round(step.distanceKm)} km
                        </span>
                    )}
                </div>
            </div>
            {step.allTimings && step.allTimings.length > 0 && (
                <div style={{ marginTop: '8px', padding: '6px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>AVAILABLE TIMINGS FOR THIS ROUTE:</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {step.allTimings.map((t, idx) => (
                            <span key={idx} style={{ fontSize: '0.75rem', background: '#fff', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', color: '#334155', fontWeight: '500' }}>
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {step.platform && (
                <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px', fontWeight: '500' }}>
                    Platform {step.platform}
                </div>
            )}
        </div>
    </div>
);

export default MobileRouteCard;
