const axios = require('axios');
require('dotenv').config();

// Fallback speed heuristics (km/h) across India
const SPEEDS = {
    walking: 5,
    driving: 60, // Conservative city/highway mix
    transit: 90
};

// Haversine Distance
const getCrowFlyDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// --- GOOGLE MAPS IMPLEMENTATION ---

const getDuration = async (origin, destination, mode = 'driving') => {
    const apiKey = process.env.MAP_API_KEY;

    // Map internal modes to Google Maps API modes
    const modeMap = {
        driving: 'driving',
        walking: 'walking',
        transit: 'transit', // Note: requires arrival_time or departure_time usually, but defaults to 'now'
        train: 'transit'
    };

    const googleMode = modeMap[mode] || 'driving';

    // If no API key, fallback to heuristic
    if (!apiKey) {
        console.warn("Google Maps API Key missing. Using fallback.");
        return estimateDurationOffline(origin, destination, mode);
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${googleMode}&key=${apiKey}`;

        const response = await axios.get(url);
        const data = response.data;

        if (data.status === 'OK' && data.routes.length > 0) {
            const leg = data.routes[0].legs[0];
            const durationValue = leg.duration.value; // seconds
            const durationText = leg.duration.text;
            const distanceText = leg.distance.text;

            return {
                value: durationValue,
                text: durationText,
                distance: distanceText,
                // Optional: Geometry (poly) could be returned here if needed for server-side processing,
                // but usually client handles drawing via DirectionsService. 
                // We return null geometry here as client will fetch it directly or we rely on basic info.
                geometry: null
            };
        } else {
            console.warn(`Google Maps API Error or No Route [${data.status}]:`, data.error_message);
            throw new Error(data.error_message || 'No route found');
        }

    } catch (error) {
        console.error(`Google Maps Error [${origin} -> ${destination}]:`, error.message);
        return estimateDurationOffline(origin, destination, mode);
    }
};

// Heuristic Fallback
const estimateDurationOffline = (origin, destination, mode) => {
    const isCoord = (str) => /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(str);

    if (isCoord(origin) && isCoord(destination)) {
        const [lat1, lon1] = origin.split(',').map(Number);
        const [lat2, lon2] = destination.split(',').map(Number);
        const distKm = getCrowFlyDistance(lat1, lon1, lat2, lon2);

        const roadDist = distKm * 1.3;
        const speed = SPEEDS[mode] || SPEEDS.driving;
        const hours = roadDist / speed;
        const seconds = Math.round(hours * 3600);

        return {
            value: seconds,
            text: `${Math.round(hours)} hours ${Math.round((hours % 1) * 60)} mins`,
            distance: `${Math.round(roadDist)} km`,
            geometry: null
        };
    }

    return {
        value: 7200,
        text: "~2 hours (Est)",
        distance: "Unknown",
        geometry: null
    };
};

module.exports = {
    getDuration,
    getCrowFlyDistance,
    estimateDurationOffline
};
