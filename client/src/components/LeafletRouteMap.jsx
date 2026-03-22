import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet default icon not showing
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to fit bounds to ALL markers
const MapBounds = ({ markers }) => {
    const map = useMap();
    useEffect(() => {
        if (markers && markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lon]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [markers, map]);
    return null;
};

const getStepColor = (mode) => {
    switch (mode) {
        case 'Bus': return '#ef4444'; // Red-ish
        case 'Train': return '#3b82f6'; // Blue-ish
        case 'Transfer': return '#eab308'; // Yellow-ish
        case 'Walking': return '#22c55e'; // Green-ish
        default: return '#64748b'; // Grey
    }
};

const LeafletRouteMap = ({ fromLocation, toLocation, route }) => {
    // Default center (India) if no props
    const defaultCenter = [20.5937, 78.9629];

    // Collect all points to plot
    let markers = [];
    let segments = [];

    // 1. From Props (Start/End) - Always try to use these as base
    if (fromLocation?.lat && fromLocation?.lon) {
        markers.push({ lat: parseFloat(fromLocation.lat), lon: parseFloat(fromLocation.lon), name: "Start: " + fromLocation.name, type: 'start' });
    }
    if (toLocation?.lat && toLocation?.lon) {
        markers.push({ lat: parseFloat(toLocation.lat), lon: parseFloat(toLocation.lon), name: "End: " + toLocation.name, type: 'end' });
    }

    // 2. From Route Steps (Intermediate) - If available
    if (route && route.steps) {
        route.steps.forEach((step, index) => {
            // Helper to get coords safely
            const getLat = (c) => c ? parseFloat(c.lat) : null;
            const getLon = (c) => c ? parseFloat(c.lon || c.lng) : null; // Support both

            const fromLat = getLat(step.fromCoords);
            const fromLon = getLon(step.fromCoords);
            const toLat = getLat(step.toCoords);
            const toLon = getLon(step.toCoords);

            // Add Markers
            if (fromLat && fromLon) {
                markers.push({
                    lat: fromLat,
                    lon: fromLon,
                    name: `${step.from} (${step.mode})`,
                    type: 'step_start'
                });
            }
            if (toLat && toLon) {
                markers.push({
                    lat: toLat,
                    lon: toLon,
                    name: `${step.to} (${step.mode})`,
                    type: 'step_end'
                });
            }

            // Add Segment Line
            if (fromLat && fromLon && toLat && toLon) {
                segments.push({
                    positions: [[fromLat, fromLon], [toLat, toLon]],
                    color: getStepColor(step.mode),
                    mode: step.mode
                });
            }
        });
    }

    // Deduplicate markers by lat/lon to avoid stacking
    const uniqueMarkers = [];
    const seenLocs = new Set();
    markers.forEach(m => {
        const key = `${m.lat.toFixed(4)},${m.lon.toFixed(4)}`;
        if (!seenLocs.has(key)) {
            seenLocs.add(key);
            uniqueMarkers.push(m);
        }
    });

    const hasMarkers = uniqueMarkers.length > 0;
    const center = hasMarkers ? [uniqueMarkers[0].lat, uniqueMarkers[0].lon] : defaultCenter;

    return (
        <MapContainer
            center={center}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapBounds markers={uniqueMarkers} />

            {/* Render Lines */}
            {segments.map((seg, idx) => (
                <Polyline
                    key={`line-${idx}`}
                    positions={seg.positions}
                    pathOptions={{ color: seg.color, weight: 4, opacity: 0.8 }}
                />
            ))}

            {/* Render Markers */}
            {uniqueMarkers.map((marker, idx) => (
                <Marker key={`marker-${idx}`} position={[marker.lat, marker.lon]}>
                    <Popup>
                        <strong>{marker.name}</strong>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default LeafletRouteMap;
