const BusService = require('../models/BusService');
const TrainStoppage = require('../models/TrainStoppage');
const { getDuration, estimateDurationOffline } = require('../utils/mapApi');
const { getStationCode, getTrainsBetweenStations, getTrainSchedule, normalizeAndCacheSchedule } = require('../utils/railwayApi');
const { validateRouteWithGoogle } = require('../utils/enrichmentUtils');

const getBaseName = (name) => {
    if (!name) return '';
    const base = name.split(/[\(\[-]/)[0]
        .replace(/\b(JN|JUNCTION|CANTT|CENTRAL|TERMINAL|STAND|ISBT|NEW|OLD|STATION|RLY|CITY)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    return base.toUpperCase();
};

// Start/End Suffix Helper
const formatName = (name, mode) => {
    let base = getBaseName(name);
    // Convert to Title Case
    base = base.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

    if (mode === 'Bus') return `${base} Bus Stand`;
    if (mode === 'Train') return `${base} Railway Station`;
    return base; // Transfer/Walking
};

// Time Helper (HH:mm to Minutes from Midnight)
const timeToMins = (timeStr) => {
    if (!timeStr || timeStr.toLowerCase() === 'now') {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
    }
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const minsToTime = (mins) => {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.floor(mins % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const escapeRegex = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

// Google Maps Directions Link Helper (DISABLED for Geoapify Migration)
const getDirLink = (origin, destination, mode = 'driving') => {
    return ""; // Removed Google Maps Link
};

const getFullRouteMapLink = (steps) => {
    return ""; // Removed Google Maps Link
};

const { getCityCoords } = require('../utils/cityCoords');

const getCoords = (loc) => getCityCoords(loc);

const Place = require('../models/Place');

const EXCLUDED_KEYWORDS = [
    'ISBT', 'BUS STAND', 'BUSSTAND', 'DEPOT', 'TERMINAL',
    'JN', 'JUNCTION', 'RAILWAY', 'STATION', 'CANTT', 'CANTONMENT'
];

const isValidCity = (name) => {
    const uName = name.toUpperCase();
    return !EXCLUDED_KEYWORDS.some(k => uName.includes(k));
};

const resolveLiveLocation = async (resolvedName, lat, lng, adminData = {}) => {
    const { district, town, state } = adminData;
    let candidates = [];
    let matchSource = '';

    if (district) {
        const distClean = getBaseName(district);
        const distRegex = new RegExp(`^${escapeRegex(distClean)}$`, 'i');

        const distMatches = await Place.find({
            search_key: distRegex
        }).limit(5).lean();

        distMatches.forEach(p => {
            if (isValidCity(p.name)) {
                candidates.push(p);
                matchSource = 'District';
            }
        });
    }

    if (candidates.length === 0 && town) {
        const townClean = getBaseName(town);
        const townRegex = new RegExp(`^${escapeRegex(townClean)}`, 'i');

        const townMatches = await Place.find({
            search_key: townRegex
        }).limit(5).lean();

        townMatches.forEach(p => {
            if (isValidCity(p.name)) {
                candidates.push(p);
                matchSource = 'Town';
            }
        });
    }

    if (candidates.length === 0) {
        const nameRegex = new RegExp(escapeRegex(resolvedName), 'i');
        const fallbackMatches = await Place.find({
            search_key: nameRegex
        }).limit(20).lean();

        fallbackMatches.forEach(p => {
            if (isValidCity(p.name)) {
                candidates.push(p);
                matchSource = 'Fallback';
            }
        });

        if (candidates.length === 0 && isValidCity(resolvedName)) {
            candidates.push({ name: getBaseName(resolvedName) });
            matchSource = 'Raw';
        }
    }

    if (candidates.length === 0) return null;

    const uniqueCityNames = [...new Set(candidates.map(c => getBaseName(c.name)))];
    console.log(`Live Location Candidates [${matchSource}]:`, uniqueCityNames);

    let bestCandidate = null;
    let minDuration = Infinity;
    const origin = `${lat},${lng}`;

    for (const city of uniqueCityNames) {
        const busDest = `${city} Bus Stand`;

        // Optimize: Use estimate/heuristic for resolution if many candidates
        const busRes = await getDuration(origin, busDest, 'driving');

        if (busRes && busRes.value < minDuration) {
            minDuration = busRes.value;
            bestCandidate = {
                name: city,
                type: 'Bus',
                hubName: busDest,
                duration: busRes.value,
                distText: busRes.distance,
                link: getDirLink("Your Location", busDest, 'driving')
            };
        }

        const trainDest = `${city} Railway Station`;
        const trainRes = await getDuration(origin, trainDest, 'driving');

        if (trainRes && trainRes.value < minDuration) {
            minDuration = trainRes.value;
            bestCandidate = {
                name: city,
                type: 'Train',
                hubName: trainDest,
                duration: trainRes.value,
                distText: trainRes.distance,
                link: getDirLink("Your Location", trainDest, 'driving')
            };
        }
    }

    return bestCandidate;
};

// Main Routing Function
const findRoutes = async (startLocation, endLocation, startTimeStr = 'All Time', filterDay = 'ALL', filterMode = 'All', maxHops = 4, userLat = null, userLng = null, isLive = false, adminData = {}, resolvedName = '') => {
    const startTimeMins = startTimeStr === 'All Time' ? 0 : timeToMins(startTimeStr);
    let startBase = getBaseName(startLocation);
    const endBase = getBaseName(endLocation);

    console.log(`Searching strictly in DB: ${startBase} -> ${endBase} @ ${startTimeStr} (Max Hops: ${maxHops})`);

    const validRoutes = [];
    const MAX_ROUTES = 5000;
    const trainCache = new Map();
    const bestDistances = new Map();
    if (!global.busDurationCache) global.busDurationCache = new Map(); // Global Cache for O-D durations

    let currentLevel = [{
        location: startBase,
        timeMins: startTimeMins,
        path: [],
        visited: new Set([startBase]),
        hops: 0,
        totalDistance: 0
    }];

    if (isLive && userLat && userLng) {
        const targetName = resolvedName || startLocation;
        console.log(`Resolving Live Location for: ${targetName} (${userLat}, ${userLng})`);

        const resolved = await resolveLiveLocation(targetName, userLat, userLng, adminData);

        if (resolved) {
            console.log(`Resolved Live Location to: ${resolved.hubName} (Dist: ${resolved.distText})`);
            startBase = getBaseName(resolved.name);

            currentLevel[0].path.push({
                mode: 'Transfer',
                operator: 'Your Commute',
                from: 'Your Location',
                to: resolved.hubName,
                depTime: minsToTime(startTimeMins),
                arrTime: minsToTime(startTimeMins + Math.round(resolved.duration / 60)),
                durationMins: Math.round(resolved.duration / 60),
                distanceKm: parseFloat(resolved.distText) || 0,
                mapLink: resolved.link,
                fromCoords: { lat: userLat, lng: userLng },
                toCoords: getCoords(resolved.name)
            });

            currentLevel[0].timeMins += Math.round(resolved.duration / 60);
            currentLevel[0].totalDistance += parseFloat(resolved.distText) || 0;
            currentLevel[0].location = startBase;
            currentLevel[0].visited.add(startBase);
        } else {
            console.log("Could not strictly resolve live location via Map API. Falling back to text matching.");
            if (resolvedName) {
                console.log(`Falling back to startBase: ${resolvedName}`);
                startBase = getBaseName(resolvedName);
                currentLevel[0].location = startBase;
                currentLevel[0].visited.add(startBase);
            }
        }
    }

    for (let hop = 0; hop < maxHops; hop++) {
        if (currentLevel.length === 0 || validRoutes.length >= MAX_ROUTES) break;

        const locs = [...new Set(currentLevel.map(n => n.location))];
        
        // Optimize: Use exact match on normalized base names instead of regex
        const uniqueVars = locs;
        const chunkSize = 300; // Increased chunk size for fast exact matches
        const allBusService = [];
        const allTrainStops = [];

        // In-Memory Global Caches for BFS nodes (speeds up Deep Hops)
        if (!global.busQueryCache) global.busQueryCache = new Map();
        if (!global.trainQueryCache) global.trainQueryCache = new Map();

        for (let i = 0; i < uniqueVars.length; i += chunkSize) {
            const chunk = uniqueVars.slice(i, i + chunkSize);
            const cacheKeyBus = chunk.join(',') + '_' + filterDay;
            const cacheKeyTrain = chunk.join(',') + '_' + filterDay;

            let busHops = [];
            let trainHops = [];

            if (global.busQueryCache.has(cacheKeyBus)) {
                busHops = global.busQueryCache.get(cacheKeyBus);
            } else {
                let busQuery = { $or: [{ f_normalized: { $in: chunk } }, { v_normalized: { $in: chunk } }] };
                if (filterDay !== 'ALL') {
                    busQuery.sd = { $in: ['ALL DAYS', filterDay.toUpperCase()] };
                }
                const selectFields = 'f v t op st dt dt_mins _id f_normalized v_normalized t_normalized';
                busHops = await BusService.find(busQuery).select(selectFields).limit(10000).lean();
                global.busQueryCache.set(cacheKeyBus, busHops);
            }

            if (global.trainQueryCache.has(cacheKeyTrain)) {
                trainHops = global.trainQueryCache.get(cacheKeyTrain);
            } else {
                let trainQuery = { station_name_normalized: { $in: chunk } };
                if (filterDay !== 'ALL') {
                    trainQuery.runs_on = filterDay.toUpperCase();
                }
                const selectFieldsTrain = 'tn nm station_name seq distance_km dt dt_mins station_name_normalized -_id';
                trainHops = await TrainStoppage.find(trainQuery).select(selectFieldsTrain).limit(10000).lean();
                global.trainQueryCache.set(cacheKeyTrain, trainHops);
            }
            
            allBusService.push(...busHops);
            allTrainStops.push(...trainHops);
        }

        const nextLevelMap = {};
        const busMap = {};
        allBusService.forEach(b => { // Fallback to getBaseName if missing
            const f = b.f_normalized || getBaseName(b.f);
            if (!busMap[f]) busMap[f] = [];
            busMap[f].push(b);
            
            const vArrNorm = b.v_normalized && b.v_normalized.length > 0 ? b.v_normalized : (b.v || []).map(getBaseName);
            vArrNorm.forEach(vb => {
                if (!busMap[vb]) busMap[vb] = [];
                busMap[vb].push(b);
            });
        });

        const trainMap = {};
        allTrainStops.forEach(ts => {
            const s = ts.station_name_normalized || getBaseName(ts.station_name);
            if (!trainMap[s]) trainMap[s] = [];
            trainMap[s].push(ts);
        });

        // PRE-FETCH ALL REQUIRED TRAIN SCHEDULES TO PREVENT O(N^2) DB TIMEOUTS
        const levelTNs = new Set();
        currentLevel.forEach(node => {
            const l = getBaseName(node.location);
            const ts = (trainMap[l] || []).map(t => t.tn);
            ts.forEach(t => levelTNs.add(t));
        });

        const missingTNs = [...levelTNs].filter(tn => !trainCache.has(tn));
        if (missingTNs.length > 0) {
            const tnChunks = [];
            for (let x = 0; x < missingTNs.length; x += 300) {
                tnChunks.push(missingTNs.slice(x, x + 300));
            }
            // Execute chunks sequentially to prevent crashing the node server with massive heap payloads
            if (!global.trainScheduleCache) global.trainScheduleCache = new Map();

            for (const chunk of tnChunks) {
                const chunkKey = chunk.join(',');
                let scheds;
                if (global.trainScheduleCache.has(chunkKey)) {
                    scheds = global.trainScheduleCache.get(chunkKey);
                } else {
                    scheds = await TrainStoppage.find({ tn: { $in: chunk } })
                                                  .select('tn nm station_name seq distance_km dt dt_mins station_name_normalized -_id')
                                                  .lean();
                    global.trainScheduleCache.set(chunkKey, scheds);
                }
                scheds.forEach(s => {
                    if (!trainCache.has(s.tn)) trainCache.set(s.tn, []);
                    trainCache.get(s.tn).push(s);
                });
            }
        }

        // SYNCHRONOUS LOOP PROCESSING (No DB Awaits Here!)
        const getModeType = (path) => {
            const mSet = new Set(path.map(p => p.mode).filter(m => m !== 'Transfer'));
            if (mSet.has('Bus') && mSet.size === 1) return 'PB';
            if (mSet.has('Train') && mSet.size === 1) return 'PT';
            return 'MX';
        };

        for (const node of currentLevel) {
            const loc = node.location;

            // Bus Processing with Map API
            const busCandidates = busMap[loc] || [];
            if (busCandidates.length > 0 && filterMode !== 'Only Train') {
                // Batch/Cache Calls
                // We'll iterate but use cache for getDuration
                for (const bus of busCandidates) {
                    
                    // --- PREVENT SAME BUS SPLITTING ---
                    const lastLegCheck = node.path.length > 0 ? node.path[node.path.length - 1] : null;
                    if (lastLegCheck && lastLegCheck.mode === 'Bus' && lastLegCheck.busId === bus._id?.toString()) {
                        // User is already on this exact bus from a previous hop
                        continue;
                    }

                    const isAtSource = (bus.f_normalized || getBaseName(bus.f)) === loc;
                    
                    // Handle array of timings using Integer Minutes (dt_mins) if available
                    let validDepTimes = [];
                    if (isAtSource) {
                        if (bus.dt_mins && Array.isArray(bus.dt_mins) && bus.dt_mins.length > 0) {
                            for (let m of bus.dt_mins) {
                                let dtMins = m;
                                while (dtMins < node.timeMins) dtMins += 1440;
                                // Time Filter
                                if (startTimeStr !== 'All Time' && node.timeMins === startTimeMins) {
                                    const filterMins = timeToMins(startTimeStr);
                                    if ((dtMins % 1440) < filterMins) {
                                        continue;
                                    }
                                }
                                validDepTimes.push(dtMins);
                            }
                        } else {
                            // Fallback to string processing
                            let busTimings = [];
                            if (typeof bus.dt === 'string') {
                                busTimings = bus.dt.split(',').map(s => s.trim()).filter(s => s);
                            } else if (Array.isArray(bus.dt)) {
                                busTimings = bus.dt;
                            } else {
                                busTimings = [bus.dt];
                            }
                            for (let tStr of busTimings) {
                                let dtMins = timeToMins(tStr);
                                while (dtMins < node.timeMins) dtMins += 1440;
                                if (startTimeStr !== 'All Time' && node.timeMins === startTimeMins) {
                                    const filterMins = timeToMins(startTimeStr);
                                    if ((dtMins % 1440) < filterMins) {
                                        continue;
                                    }
                                }
                                validDepTimes.push(dtMins);
                            }
                        }
                    } else {
                        let depTime = node.timeMins + 60;
                        validDepTimes.push(depTime);
                    }

                    if (validDepTimes.length === 0) continue;
                    let depTime = Math.min(...validDepTimes);

                    let possibleDrops = isAtSource ? [...(bus.v || []), bus.t] : [];
                    if (!isAtSource) {
                        const vArrNames = bus.v || [];
                        const vArrNorm = bus.v_normalized && bus.v_normalized.length > 0 ? bus.v_normalized : vArrNames.map(getBaseName);
                        const idx = vArrNorm.indexOf(loc);
                        if (idx !== -1) possibleDrops = [...vArrNames.slice(idx + 1), bus.t];
                    }

                    for (const drop of possibleDrops) {
                        const dBase = getBaseName(drop);
                        if (node.visited.has(dBase)) continue;

                        // REAL MAP CALL WITH CACHE
                        const cacheKey = `${loc}-${drop}`;
                        let apiRes;
                        if (global.busDurationCache.has(cacheKey)) {
                            apiRes = global.busDurationCache.get(cacheKey);
                        } else {
                            try {
                                const fromC = getCoords(loc);
                                const toC = getCoords(drop);

                                // Try to use coordinate estimation if available (even if rough)
                                const originStr = `${fromC.lat},${fromC.lng}`;
                                const destStr = `${toC.lat},${toC.lng}`;

                                apiRes = estimateDurationOffline(originStr, destStr, 'driving'); // Heuristic!
                                global.busDurationCache.set(cacheKey, apiRes);
                            } catch (e) {
                                apiRes = { value: 3600, distance: "0 km" }; // Fallback
                            }
                        }

                        const dist = isNaN(parseFloat(apiRes.distance)) ? 0 : parseFloat(apiRes.distance.replace(/,/g, ''));
                        const dur = Math.round(apiRes.value / 60);
                        const newTotalDist = node.totalDistance + dist;

                        const modesInPath = new Set(node.path.map(p => p.mode).filter(m => m !== 'Transfer'));
                        modesInPath.add('Bus');
                        const isPureBus = modesInPath.has('Bus') && modesInPath.size === 1;
                        const isPureTrain = modesInPath.has('Train') && modesInPath.size === 1;
                        const modeType = isPureBus ? 'PB' : (isPureTrain ? 'PT' : 'MX');
                        const pruneKey = dBase + modeType;

                        if (dBase !== endBase) {
                            if (bestDistances.has(pruneKey) && bestDistances.get(pruneKey) < newTotalDist - 500) continue;
                            bestDistances.set(pruneKey, newTotalDist);
                        }

                        const formattedFrom = formatName(node.location, 'Bus');
                        
                        let newPath = [...node.path];
                        const lastLeg = newPath.length > 0 ? newPath[newPath.length - 1] : null;
                        if (lastLeg && lastLeg.to !== formattedFrom) {
                            newPath.push({
                                mode: 'Transfer',
                                operator: 'City Transfer',
                                from: lastLeg.to,
                                to: formattedFrom,
                                depTime: lastLeg.arrTime,
                                arrTime: minsToTime((timeToMins(lastLeg.arrTime) + 30) % 1440),
                                durationMins: 30,
                                distanceKm: 5,
                                mapLink: "",
                                fromCoords: getCoords(lastLeg.to),
                                toCoords: getCoords(formattedFrom)
                            });
                        }

                        newPath.push({
                            mode: 'Bus',
                            busId: bus._id ? bus._id.toString() : null,
                            operator: bus.op,
                            serviceType: bus.st || 'ORDINARY',
                            from: formattedFrom,
                            to: formatName(drop, 'Bus'),
                            depTime: minsToTime(depTime % 1440),
                            arrTime: minsToTime((depTime + dur) % 1440),
                            allTimings: [...new Set(validDepTimes.map(m => minsToTime(m % 1440)))].sort(),
                            durationMins: dur,
                            distanceKm: dist,
                            mapLink: "",
                            geometry: apiRes ? apiRes.geometry : null, // Pass GeoJSON if available
                            fromCoords: getCoords(node.location),
                            toCoords: getCoords(drop)
                        });

                        const newNode = {
                            location: dBase,
                            timeMins: depTime + dur + 30,
                            path: newPath,
                            visited: new Set([...node.visited, dBase]),
                            hops: node.hops + 1,
                            totalDistance: newTotalDist
                        };

                        if (dBase === endBase) {
                            if (validRoutes.length < MAX_ROUTES) validRoutes.push(newNode);
                        } else if (newNode.hops < maxHops) {
                            const mt = getModeType(newNode.path);
                            const locKey = dBase + '_' + mt;
                            if (!nextLevelMap[locKey]) nextLevelMap[locKey] = [];
                            nextLevelMap[locKey].push(newNode);
                            if (nextLevelMap[locKey].length > 10) {
                                nextLevelMap[locKey].sort((a,b) => a.timeMins - b.timeMins);
                                nextLevelMap[locKey] = nextLevelMap[locKey].slice(0, 5);
                            }
                        }
                    }
                }
            }

            // Train Processing
            const tns = [...new Set((trainMap[loc] || []).map(t => t.tn))];
            if (tns.length > 0 && filterMode !== 'Only Bus') {
                tns.forEach(tn => {
                    const route = (trainCache.get(tn) || []).sort((a, b) => a.seq - b.seq);
                    const cIdx = route.findIndex(r => (r.station_name_normalized || getBaseName(r.station_name)) === loc);
                    if (cIdx === -1) return;

                    const start = route[cIdx];
                    const operatorName = `${start.tn} ${start.nm}`;

                    // --- PREVENT SAME TRAIN SPLITTING ---
                    const lastLeg = node.path.length > 0 ? node.path[node.path.length - 1] : null;
                    if (lastLeg && lastLeg.mode === 'Train' && lastLeg.operator === operatorName) {
                        // User is already on this exact train from a previous continuous hop.
                        // Skip evaluating it again here to avoid generating redundant split segments.
                        return; 
                    }

                    // Use dt_mins for train departure if available
                    let depTime = start.dt_mins !== undefined && start.dt_mins !== null ? start.dt_mins : timeToMins(start.dt || '00:00');
                    while (depTime < node.timeMins) depTime += 1440;

                    // Apply Time filter for Train 
                    if (startTimeStr !== 'All Time' && node.timeMins === startTimeMins) {
                        const filterMins = timeToMins(startTimeStr);
                        if ((depTime % 1440) < filterMins) {
                            return; // Valid departure is before filter, skip this train
                        }
                    }

                    // Process all downstream stations continuously (no artificial limit)
                    for (let i = cIdx + 1; i < route.length; i++) {
                        const end = route[i];
                        const dBase = end.station_name_normalized || getBaseName(end.station_name);
                        if (node.visited.has(dBase)) continue;

                        const dist = Math.abs(end.distance_km - (start.distance_km || 0)) || 120;
                        const dur = Math.round((dist / 55) * 60);
                        const newTotalDist = node.totalDistance + dist;

                        const modesInPath = new Set(node.path.map(p => p.mode).filter(m => m !== 'Transfer'));
                        modesInPath.add('Train');
                        const isPureBus = modesInPath.has('Bus') && modesInPath.size === 1;
                        const isPureTrain = modesInPath.has('Train') && modesInPath.size === 1;
                        const modeType = isPureBus ? 'PB' : (isPureTrain ? 'PT' : 'MX');
                        const pruneKey = dBase + modeType;

                        if (dBase !== endBase) {
                            if (bestDistances.has(pruneKey) && bestDistances.get(pruneKey) < newTotalDist - 500) continue;
                            bestDistances.set(pruneKey, newTotalDist);
                        }

                        const formattedFrom = formatName(start.station_name, 'Train');
                        let newPath = [...node.path];
                        const lastLeg = newPath.length > 0 ? newPath[newPath.length - 1] : null;

                        if (lastLeg && lastLeg.to !== formattedFrom) {
                            newPath.push({
                                mode: 'Transfer',
                                operator: 'City Transfer',
                                from: lastLeg.to,
                                to: formattedFrom,
                                depTime: lastLeg.arrTime,
                                arrTime: minsToTime((timeToMins(lastLeg.arrTime) + 30) % 1440),
                                durationMins: 30,
                                distanceKm: 5,
                                mapLink: "",
                                fromCoords: getCoords(lastLeg.to),
                                toCoords: getCoords(formattedFrom)
                            });
                        }

                        newPath.push({
                            mode: 'Train',
                            operator: `${start.tn} ${start.nm}`,
                            from: formattedFrom,
                            to: formatName(end.station_name, 'Train'),
                            depTime: minsToTime(depTime % 1440),
                            arrTime: minsToTime((depTime + dur) % 1440),
                            durationMins: dur,
                            distanceKm: dist,
                            mapLink: getDirLink(start.station_name, end.station_name, 'transit'),
                            fromCoords: getCoords(start.station_name),
                            toCoords: getCoords(end.station_name)
                        });

                        const newNode = {
                            location: dBase,
                            timeMins: depTime + dur + 45,
                            path: newPath,
                            visited: new Set([...node.visited, dBase]),
                            hops: node.hops + 1,
                            totalDistance: newTotalDist
                        };

                        if (dBase === endBase) {
                            if (validRoutes.length < MAX_ROUTES) validRoutes.push(newNode);
                        } else if (newNode.hops < maxHops) {
                            const mt = getModeType(newNode.path);
                            const locKey = dBase + '_' + mt;
                            if (!nextLevelMap[locKey]) nextLevelMap[locKey] = [];
                            nextLevelMap[locKey].push(newNode);
                            if (nextLevelMap[locKey].length > 10) {
                                nextLevelMap[locKey].sort((a,b) => a.timeMins - b.timeMins);
                                nextLevelMap[locKey] = nextLevelMap[locKey].slice(0, 5);
                            }
                        }
                    }
                });
            }
        }
        
        const nextLevel = Object.values(nextLevelMap).flat();
        
        // Final Global Deduplication to enforce the 3000 Node max scaling cap
        const locMap = {};
        for (const n of nextLevel) {
            const mt = getModeType(n.path);
            const locKey = n.location + '_' + mt;
            if (!locMap[locKey]) locMap[locKey] = [];
            locMap[locKey].push(n);
        }
        
        const prunedNext = [];
        for (const locKey in locMap) {
            // Sort incoming paths by earliest arrival time to prioritize fast connections
            locMap[locKey].sort((a, b) => a.timeMins - b.timeMins);
            // Drastically reduce redundancy: only keep top 3 paths to the exact same city per mode
            prunedNext.push(...locMap[locKey].slice(0, 3));
        }

        // Drastically cut exponential expansion: cap active graph nodes to 600 per hop level
        currentLevel = prunedNext.slice(0, 600);
    }

    // --- CATEGORIZATION ---
    const rawCategories = {
        mixed: [],
        bus_train: [],
        train_bus: [],
        only_bus: [],
        only_train: []
    };

    validRoutes.forEach(route => {
        const uniqueModes = new Set(route.path.map(p => p.mode));
        const routeData = {
            id: Math.random().toString(36).substr(2, 9),
            type: [...uniqueModes].join(' + '),
            totalDistanceKm: Math.round(route.totalDistance),
            totalDurationMins: Math.round(route.timeMins - startTimeMins),
            totalTime: minsToTime(route.timeMins - startTimeMins),
            hops: route.hops,
            steps: route.path,
            confidence: 'Database Archive',
            fullMapLink: getFullRouteMapLink(route.path)
        };

        const coreModes = new Set([...uniqueModes].filter(m => m !== 'Transfer'));
        const isOnlyBus = coreModes.has('Bus') && coreModes.size === 1;
        const isOnlyTrain = coreModes.has('Train') && coreModes.size === 1;
        const hasBoth = coreModes.has('Bus') && coreModes.has('Train');

        // Apply Mode Filter early
        if (filterMode === 'Only Bus' && !isOnlyBus) return;
        if (filterMode === 'Only Train' && !isOnlyTrain) return;
        if (filterMode === 'Bus + Train') {
            if (!(hasBoth && route.path.find(p => p.mode !== 'Transfer')?.mode === 'Bus')) return;
        }
        if (filterMode === 'Train + Bus') {
            if (!(hasBoth && route.path.find(p => p.mode !== 'Transfer')?.mode === 'Train')) return;
        }

        if (isOnlyBus) rawCategories.only_bus.push(routeData);
        else if (isOnlyTrain) rawCategories.only_train.push(routeData);
        else if (hasBoth) {
            const firstCore = route.path.find(p => p.mode !== 'Transfer')?.mode;
            if (firstCore === 'Bus') rawCategories.bus_train.push(routeData);
            else rawCategories.train_bus.push(routeData);
        }
        rawCategories.mixed.push(routeData);
    });

    const finalize = (arr) => {
        try {
            const sorted = [...arr].sort((a, b) => {
                const distA = a.totalDistanceKm || 0;
                const distB = b.totalDistanceKm || 0;
                const timeA = a.totalDurationMins || 0;
                const timeB = b.totalDurationMins || 0;
                const hopsA = a.hops || 0;
                const hopsB = b.hops || 0;

                if (Math.abs(distA - distB) > 0.1) {
                    return distA - distB;
                }
                if (timeA !== timeB) {
                    return timeA - timeB;
                }
                return hopsA - hopsB;
            });
            return { best: [], all: sorted };
        } catch (err) {
            console.error("Sorting Error in routingService:", err);
            return { best: [], all: arr };
        }
    };

    // --- COORDINATE ENRICHMENT (FIX FOR MAP PINS) ---
    const { fetchCoordinates, getBaseName: getGeoBase } = require('../utils/geoUtils');

    const finalResult = {
        mixed: finalize(rawCategories.mixed),
        bus_train: finalize(rawCategories.bus_train),
        train_bus: finalize(rawCategories.train_bus),
        only_bus: finalize(rawCategories.only_bus),
        only_train: finalize(rawCategories.only_train)
    };

    // --- GOOGLE ENHANCEMENT LAYER (POST-PROCESSING) ---
    const MAX_API_CALLS = 2;
    let apiCallsCount = 0;

    const enrichResults = async (categories) => {
        // Collect top 2 candidates from 'mixed' for enrichment (Priority)
        const candidates = categories.mixed?.all?.slice(0, MAX_API_CALLS) || [];
        
        for (const route of candidates) {
            if (apiCallsCount >= MAX_API_CALLS) break;
            
            try {
                const enriched = await validateRouteWithGoogle(route);
                // Update the route in place within the original structure
                Object.assign(route, enriched);
                apiCallsCount++;
            } catch (err) {
                console.error("Enrichment failed for a route:", err.message);
            }
        }

        // --- RANKING REFINEMENT (SAFE) ---
        // Refine order using: priority 1 → INCREASING TOTAL DISTANCE, priority 2 → total duration, priority 3 → hops
        const refinedSort = (arr) => {
            return [...arr].sort((a, b) => {
                const distA = a.live_distance || a.totalDistanceKm || Infinity;
                const distB = b.live_distance || b.totalDistanceKm || Infinity;
                if (Math.abs(distA - distB) > 0.1) return distA - distB;

                const durA = a.live_duration || a.totalDurationMins || Infinity;
                const durB = b.live_duration || b.totalDurationMins || Infinity;
                if (durA !== durB) return durA - durB;

                return (a.hops || 0) - (b.hops || 0);
            });
        };

        // Apply refinement to all categories
        Object.keys(categories).forEach(cat => {
            if (categories[cat].all) {
                categories[cat].all = refinedSort(categories[cat].all);
            }
        });
    };

    await enrichResults(finalResult);

    return finalResult;
};

module.exports = {
    findRoutes
};
