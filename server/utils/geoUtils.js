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

    console.log(`[GEO] Fetching coordinates for ${toFetch.length} locations:`, toFetch);

    // 2. Fetch from Geoapify (Batch if possible, but free tier simpler with loop)
    // Geoapify doesn't support batch well in free tier usually, parallel requests ok.
    const apiKey = process.env.GEOAPIFY_KEY || "10e2d3a2a3784cea80f54b3c404adfe4"; // Use env or fallback

    await Promise.all(toFetch.map(async (loc) => {
        try {
            const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(loc + ", India")}&apiKey=${apiKey}&limit=1`;
            const res = await axios.get(url, { timeout: 3000 }); // 3s timeout

            if (res.data && res.data.features && res.data.features.length > 0) {
                const props = res.data.features[0].properties;
                const coords = { lat: props.lat, lon: props.lon };

                GEO_CACHE[loc] = coords;
                results[loc] = coords;
            } else {
                console.warn(`[GEO] No results for ${loc}`);
                // Fallback to cityCoords logic (randomish) to prevent nulls
                const fallback = getCityCoords(loc);
                GEO_CACHE[loc] = fallback;
                results[loc] = fallback;
            }
        } catch (err) {
            console.error(`[GEO] Error fetching ${loc}:`, err.message);
            // Fallback
            const fallback = getCityCoords(loc);
            results[loc] = fallback;
        }
    }));

    // Merge cache hits back
    uniqueLocs.forEach(loc => {
        if (!results[loc] && GEO_CACHE[loc]) {
            results[loc] = GEO_CACHE[loc];
        }
    });

    return results;
};

module.exports = { fetchCoordinates, getBaseName };
