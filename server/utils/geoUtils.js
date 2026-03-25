const axios = require('axios');
const { CITY_COORDS, getCityCoords } = require('./cityCoords');

// In-memory cache to save API calls during runtime
const GEO_CACHE = { ...CITY_COORDS };

const getBaseName = (name) => {
    if (!name) return '';
    return name.split(/[\(\[-]/)[0]
        .replace(/\b(JN|JUNCTION|CANTT|CENTRAL|TERMINAL|STAND|ISBT|NEW|OLD|STATION|RLY|CITY)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim().toUpperCase();
};

const fetchCoordinates = async (locations) => {
    const uniqueLocs = [...new Set(locations.map(l => getBaseName(l)))];
    const results = {};
    const toFetch = [];

    // 1. Check Cache
    uniqueLocs.forEach(loc => {
        if (GEO_CACHE[loc]) {
            results[loc] = GEO_CACHE[loc];
        } else {
            toFetch.push(loc);
        }
    });

    if (toFetch.length === 0) return results;

    // 2. IMMEDIATELY resolve from static fallback instead of blocking the thread for 60 seconds hitting an external API limit
    toFetch.forEach(loc => {
        const fallback = getCityCoords(loc);
        GEO_CACHE[loc] = fallback;
        results[loc] = fallback;
    });

    // Merge cache hits back
    uniqueLocs.forEach(loc => {
        if (!results[loc] && GEO_CACHE[loc]) {
            results[loc] = GEO_CACHE[loc];
        }
    });

    return results;
};

module.exports = { fetchCoordinates, getBaseName };
