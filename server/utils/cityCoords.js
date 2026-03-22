const getBaseName = (name) => {
    if (!name) return '';
    const base = name.split(/[\(\[-]/)[0]
        .replace(/\b(JN|JUNCTION|CANTT|CENTRAL|TERMINAL|STAND|ISBT|NEW|OLD|STATION|RLY|CITY)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    return base.toUpperCase();
};

const CITY_COORDS = {
    'DELHI': { lat: 28.6139, lon: 77.2090 },
    'NEW DELHI': { lat: 28.6141, lon: 77.2135 },
    'KURUKSHETRA': { lat: 29.9691, lon: 76.8783 },
    'AMBALA': { lat: 30.3782, lon: 76.7767 },
    'PANIPAT': { lat: 29.3909, lon: 76.9635 },
    'KARNAL': { lat: 29.6857, lon: 76.9907 },
    'SONIPAT': { lat: 28.9931, lon: 77.0151 },
    'CHANDIGARH': { lat: 30.7333, lon: 76.7794 },
    'LUDHIANA': { lat: 30.9010, lon: 75.8573 },
    'AMRITSAR': { lat: 31.6340, lon: 74.8723 },
    'ROHTAK': { lat: 28.8955, lon: 76.6066 },
    'HISAR': { lat: 29.1492, lon: 75.7217 },
    'MUMBAI': { lat: 19.0760, lon: 72.8777 },
    'PUNE': { lat: 18.5204, lon: 73.8567 },
    'JAIPUR': { lat: 26.9124, lon: 75.7873 },
    'AGRA': { lat: 27.1767, lon: 78.0081 },
    'LUCKNOW': { lat: 26.8467, lon: 80.9461 },
    'KANPUR': { lat: 26.4499, lon: 80.3319 },
    'VARANASI': { lat: 25.3176, lon: 82.9739 },
    'PATNA': { lat: 25.5941, lon: 85.1376 },
    'KOLKATA': { lat: 22.5726, lon: 88.3639 },
    'CHENNAI': { lat: 13.0827, lon: 80.2707 },
    'BANGALORE': { lat: 12.9716, lon: 77.5946 },
    'HYDERABAD': { lat: 17.3850, lon: 78.4867 }
};

// Deterministic hash for consistent fallback coordinates
const getHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash); // Ensure positive
};

const getCityCoords = (loc) => {
    const base = getBaseName(loc);
    const coords = CITY_COORDS[base];
    if (coords) return { ...coords, lng: coords.lon }; // Add lng backcompat

    // Consistent fallback based on name hash
    // Generate within a reasonable bounds around Central India (20-30N, 75-85E)
    const hash = getHash(base);
    const latOffset = (hash % 1000) / 1000; // 0.000 to 0.999
    const lonOffset = ((hash >> 10) % 1000) / 1000; // 0.000 to 0.999

    // Example: Base around Delhi with spread
    // Or just spread widely? Let's keep it somewhat tight to avoid ocean.
    // Base: 22.0, 78.0
    // Spread: 10 deg lat, 10 deg lon
    const lat = 20.0 + (latOffset * 10.0);
    const lon = 75.0 + (lonOffset * 10.0);

    return {
        lat: parseFloat(lat.toFixed(4)),
        lon: parseFloat(lon.toFixed(4)),
        lng: parseFloat(lon.toFixed(4))
    };
};

module.exports = { getCityCoords, CITY_COORDS };
