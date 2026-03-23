/**
 * STRICT HOP FILTERING
 * @param {Array} routes - The raw list of routes.
 * @param {number} hops - The STRICT hop count (1, 2, 3, 4).
 * @returns {Array} - Filtered routes that EXACTLY match the hop count.
 */
export const filterRoutesByHops = (routes, hops) => {
    if (!routes || !Array.isArray(routes)) return [];
    const numHops = Number(hops);
    return routes.filter(route => {
        // Show all routes up to the selected max hops.
        return route.hops <= numHops && route.hops > 0;
    });
};

/**
 * ROUTE SORTING
 * @param {Array} routes - Routes to sort.
 * @param {string} criteria - 'FASTEST' | 'SHORTEST' | 'DISTANCE'.
 * @returns {Array} - Sorted array.
 */
export const sortRoutes = (routes, criteria = 'DISTANCE_THEN_ARRIVAL') => {
    // Always use the unified strict sort
    return [...routes].sort(compareRoutesUnified);
};

const compareRoutesUnified = (a, b) => {
    // 1. Distance (Ascending)
    // Use totalDistanceKm if available
    const distA = a.totalDistanceKm || 0;
    const distB = b.totalDistanceKm || 0;
    if (Math.abs(distA - distB) > 0.1) {
        return distA - distB;
    }

    // 2. Duration/Time (Ascending)
    // Prefer totalDurationMins if available, else parse string
    const timeA = a.totalDurationMins ?? parseDuration(a.totalTime);
    const timeB = b.totalDurationMins ?? parseDuration(b.totalTime);
    if (timeA !== timeB) return timeA - timeB;

    // 3. Hop Count (Ascending)
    const hopsA = a.hops || (a.steps ? a.steps.length : 0);
    const hopsB = b.hops || (b.steps ? b.steps.length : 0);
    return hopsA - hopsB;
};

const getLastArrivalTime = (route) => {
    if (route.steps && route.steps.length > 0) {
        return route.steps[route.steps.length - 1].arrTime || "23:59";
    }
    return "00:00";
};

const parseDuration = (durationStr) => {
    if (!durationStr) return 999999;
    let minutes = 0;
    const hoursMatch = durationStr.match(/(\d+)h/);
    const minsMatch = durationStr.match(/(\d+)m/);
    if (hoursMatch) minutes += parseInt(hoursMatch[1]) * 60;
    if (minsMatch) minutes += parseInt(minsMatch[1]);
    return minutes;
};

/**
 * GROUP ROUTES
 * Consolidates "Bus -> Train" or "Train -> Bus" routes that share the same first leg.
 * Designed for scenarios like: 
 * Route 1: Bus(A->B) + Train(B->C, Train X)
 * Route 2: Bus(A->B) + Train(B->C, Train Y)
 * -> Becomes 1 Grouped Route with 2 Options for the 2nd leg.
 * 
 * @param {Array} routes 
 * @returns {Array} - Array of Route Objects (some may be "grouped" type).
 */
export const groupRoutes = (routes) => {
    // 0. Pre-Deduplication (Global Level)
    // Remove exact duplicates from the input list immediately
    const distinctRoutes = [];
    const seenGlobalKeys = new Set();

    // Group single-step buses by Operator and Service Type 
    const busGroups = {};

    routes.forEach(r => {
        const isOnlyBus = r.type === 'Bus' && r.steps.length === 1;
        
        if (isOnlyBus) {
            const step = r.steps[0];
            const serviceType = step.serviceType || 'ORDINARY';
            const key = `BUS_GROUP|${step.from}|${step.to}|${step.operator}|${serviceType}`;
            
            if (!busGroups[key]) {
                busGroups[key] = JSON.parse(JSON.stringify(r)); // deep copy to modify
                if (!busGroups[key].steps[0].allTimings) {
                    busGroups[key].steps[0].allTimings = [busGroups[key].steps[0].depTime];
                }
            } else {
                // Merge all Timings
                const existingStep = busGroups[key].steps[0];
                const newTimings = new Set([
                    ...(existingStep.allTimings || [existingStep.depTime]),
                    ...(step.allTimings || [step.depTime])
                ]);
                existingStep.allTimings = [...newTimings].sort();
                
                // Update to earliest departure representation if needed
                if (step.depTime < existingStep.depTime) {
                    existingStep.depTime = step.depTime;
                    existingStep.arrTime = step.arrTime;
                    busGroups[key].totalTime = r.totalTime;
                }
            }
            return;
        }

        // Construct a signature for the whole route
        // Key: DepTime + ArrTime + Operator (from first leg or all legs) + TotalTime
        // Improve sensitivity: Include all step times and OPERATOR
        const signature = r.steps.map(s => `${s.mode}:${s.operator}:${s.from}:${s.to}:${s.depTime}:${s.arrTime}`).join('|');
        if (!seenGlobalKeys.has(signature)) {
            seenGlobalKeys.add(signature);
            distinctRoutes.push(r);
        }
    });

    Object.values(busGroups).forEach(bg => distinctRoutes.push(bg));

    const groups = {};
    const singles = [];

    distinctRoutes.forEach(route => {
        // Condition 1: Standard Bus -> Train (2 Steps)
        // Condition 2: Live Location -> Bus -> Train (3 Steps, where Step 0 is Transfer)

        let isGroupable = false;
        let commonKey = '';
        let commonLegs = [];
        let variableLegIndex = -1;

        if (route.steps.length === 2) {
            // Standard Case: 1st Leg common, 2nd Leg variable
            isGroupable = true;
            const leg1 = route.steps[0];
            commonKey = `${leg1.mode}-${leg1.from}-${leg1.to}-${leg1.depTime}`;
            commonLegs = [leg1];
            variableLegIndex = 1;
        } else if (route.steps.length === 3 && route.steps[0].mode === 'Transfer') {
            // Live Location Case: "Transfer" + "Bus" -> "Train" (Variable)
            // Common Part is Step 0 AND Step 1
            isGroupable = true;
            const leg0 = route.steps[0];
            const leg1 = route.steps[1];
            // Key combines both legs to ensure we only group identical paths
            commonKey = `${leg0.from}-${leg0.to}-${leg1.mode}-${leg1.from}-${leg1.to}-${leg1.depTime}`;
            commonLegs = [leg0, leg1];
            variableLegIndex = 2;
        }

        if (isGroupable) {
            if (!groups[commonKey]) {
                groups[commonKey] = {
                    type: 'grouped',
                    commonLegs: commonLegs, // Store ARRAY of common legs
                    commonLeg: commonLegs[commonLegs.length - 1], // Fallback for old UI (the main transit leg)
                    options: [], // Will contain full route objects
                    totalDistanceKm: route.totalDistanceKm, // Will be updated to min/avg? Or just take first.
                    totalTime: route.totalTime,
                    hops: route.hops,
                    id: route.id || Math.random().toString()
                };
            }
            groups[commonKey].options.push(route);
        } else {
            singles.push(route);
        }
    });

    // If a group only has 1 option, treat it as a single route
    const groupedRoutes = Object.values(groups).map(g => {
        // DEDUPLICATE OPTIONS within the group
        const uniqueOptions = [];
        const seenOptionKeys = new Set();

        g.options.forEach(opt => {
            // Create a unique key for the option to detect exact duplicates
            // Key: DepTime + ArrTime + Operator (from variable leg) + TotalTime
            const variableIndex = g.commonLegs.length; // Leg after common part
            const varLeg = opt.steps[variableIndex];
            // If unknown operator, use mode/time as proxy
            const opKey = varLeg ? (varLeg.operator || varLeg.mode) : 'unknown';

            // Generate Key: "04:40-07:10-TrainXYZ-2h30m"
            const uniqueKey = `${varLeg?.depTime}-${varLeg?.arrTime}-${opKey}-${opt.totalTime}`;

            if (!seenOptionKeys.has(uniqueKey)) {
                seenOptionKeys.add(uniqueKey);
                uniqueOptions.push(opt);
            }
        });

        g.options = uniqueOptions;

        if (g.options.length === 1) return g.options[0];

        // SORT THE OPTIONS WITHIN THE GROUP
        // Requirement: Sort options by Distance then Arrival Time
        g.options.sort(compareRoutesUnified);

        // Update the "representative" stats for the group card based on the best option (first after sort)
        const bestOption = g.options[0];
        g.totalDistanceKm = bestOption.totalDistanceKm;
        g.totalTime = bestOption.totalTime;

        return g;
    });

    return [...singles, ...groupedRoutes];
};

/**
 * PROCESS LIVE LOCATION & NAMING RESTRICTIONS
 * 1. Renames nodes with suffixes (Bus Stand, Railway Station).
// processLiveLocationRoutes removed


/**
 * GROUP ROUTES BY INTERMEDIATE CITY (VIA)
 * Creates a higher-level visual grouping for routes passing through the same transfer city.
 * e.g. All routes "Via Alwar" are grouped together.
 */
export const groupRoutesByVia = (routes) => {
    if (!routes || routes.length === 0) return [];

    const groups = [];
    const groupMap = new Map(); // Key: "ViaName" -> GroupObject

    const getViaName = (route) => {
        // If grouped route (internal), check common leg
        // If standard route, check step 0 to
        let targetStep = null;
        if (route.type === 'grouped' && route.commonLeg) {
            targetStep = route.commonLeg;
        } else if (route.steps && route.steps.length > 1) {
            targetStep = route.steps[0];
        }

        if (targetStep) {
            // "Alwar Bus Stand" -> "ALWAR"
            return targetStep.to.replace(/( Bus Stand| Railway Station)$/i, '').trim().toUpperCase();
        }
        return 'DIRECT';
    };

    routes.forEach(route => {
        const via = getViaName(route);

        if (groupMap.has(via)) {
            groupMap.get(via).routes.push(route);
        } else {
            const newGroup = {
                type: 'via_group',
                via: via,
                routes: [route],
                id: `via_${via}_${Math.random().toString(36)}`
            };
            groupMap.set(via, newGroup);
            groups.push(newGroup);
        }
    });

    return groups;
};
