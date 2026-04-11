/**
 * Decodes a Google Maps encoded polyline string.
 * @param {string} encoded - The encoded polyline string.
 * @returns {Array} An array of [lat, lng] pairs.
 */
export const decodePolyline = (encoded) => {
    if (!encoded) return [];
    
    let poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        poly.push([lat / 1e5, lng / 1e5]);
    }
    return poly;
};

/**
 * Generates a Google Maps directions URL for a multi-step route.
 * @param {Object} route - The route object.
 * @returns {string} Google Maps URL.
 */
export const getGoogleMapsUrl = (route) => {
    if (!route || !route.steps || route.steps.length === 0) return "";
    
    const baseUrl = "https://www.google.com/maps/dir/";
    const points = [];
    
    // Add start
    points.push(encodeURIComponent(route.steps[0].from));
    
    // Add all intermediate destinations and the final end
    route.steps.forEach(s => {
        points.push(encodeURIComponent(s.to));
    });
    
    // Mode selection (Google Directions Link uses travelmode parameter)
    // We'll stick to a general multi-stop link which works best across modes
    return `${baseUrl}${points.join("/")}/`;
};
