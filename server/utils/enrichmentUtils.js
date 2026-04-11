const { Client } = require("@googlemaps/google-maps-services-js");
const { getCache, setCache } = require("./redis");

const client = new Client({});
const API_KEY = process.env.MAP_API_KEY;

/**
 * Validates a route using Google Maps Distance Matrix and Directions APIs.
 * @param {Object} route - The route object from BFS.
 * @returns {Object} Enriched route object.
 */
const validateRouteWithGoogle = async (route) => {
    if (!API_KEY || !route.steps || route.steps.length === 0) return route;

    const origin = route.steps[0].from;
    const destination = route.steps[route.steps.length - 1].to;
    const waypoints = route.steps.slice(0, -1).map(s => s.to);

    // Cache keys
    const cacheKeyBase = `${origin}_${destination}_${waypoints.join("|")}`.replace(/\s+/g, "_").toLowerCase();
    const distanceCacheKey = `dist_${cacheKeyBase}`;
    const polylineCacheKey = `poly_${cacheKeyBase}`;

    // 1. Check Cache
    const cachedDistance = await getCache(distanceCacheKey);
    const cachedPolyline = await getCache(polylineCacheKey);

    let liveDistance = 0;
    let liveDuration = 0;
    let routePolyline = cachedPolyline;

    if (cachedDistance) {
        liveDistance = cachedDistance.distance;
        liveDuration = cachedDistance.duration;
    } else {
        // 2. Call Distance Matrix (Batched)
        try {
            const response = await client.distancematrix({
                params: {
                    origins: [origin],
                    destinations: [destination],
                    waypoints: waypoints, // Note: Distance Matrix doesn't take waypoints directly like Directions, 
                                          // but we can compute hop-by-hop if needed. 
                                          // For better accuracy with waypoints, Directions is preferred.
                    key: API_KEY
                }
            });

            if (response.data.status === "OK") {
                // Simplified: Just use total OD for now if hop-by-hop is too complex here
                // However, user asked for sum(all hop distances).
                // Let's use Directions API which gives both polyline and summed distances more easily.
                const directionsResp = await client.directions({
                    params: {
                        origin,
                        destination,
                        waypoints,
                        mode: route.steps.every(s => s.mode === "Train") ? "transit" : "driving",
                        key: API_KEY
                    }
                });

                if (directionsResp.data.status === "OK") {
                    const leg = directionsResp.data.routes[0].legs[0]; // Directions with waypoints returns multiple legs
                    const allLegs = directionsResp.data.routes[0].legs;
                    
                    liveDistance = allLegs.reduce((sum, l) => sum + (l.distance.value / 1000), 0); // km
                    liveDuration = allLegs.reduce((sum, l) => sum + (l.duration.value / 60), 0); // mins
                    routePolyline = directionsResp.data.routes[0].overview_polyline.points;

                    // --- STEP-LEVEL SYNCHRONIZATION ---
                    allLegs.forEach((leg, index) => {
                        if (route.steps[index]) {
                            route.steps[index].distanceKm = leg.distance.value / 1000;
                            route.steps[index].durationMins = leg.duration.value / 60;
                            
                            // SYNC COORDINATES WITH GOOGLE MAPS RESOLUTION
                            route.steps[index].fromCoords = {
                                lat: leg.start_location.lat,
                                lon: leg.start_location.lng
                            };
                            route.steps[index].toCoords = {
                                lat: leg.end_location.lat,
                                lon: leg.end_location.lng
                            };
                        }
                    });

                    await setCache(distanceCacheKey, { distance: liveDistance, duration: liveDuration }, 43200); // 12h
                    await setCache(polylineCacheKey, routePolyline, 86400); // 24h
                }
            }
        } catch (err) {
            console.error("Google API Enrichment Error:", err.message);
            if (err.response && err.response.data) {
                console.error("Google API Error Details:", JSON.stringify(err.response.data, null, 2));
            }
        }
    }

    // 3. Update route object
    return {
        ...route,
        live_distance: liveDistance || route.totalDistanceKm,
        live_duration: liveDuration || route.totalDurationMins,
        route_polyline: routePolyline || null,
        enriched: !!liveDistance
    };
};

module.exports = {
    validateRouteWithGoogle
};
