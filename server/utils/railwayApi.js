const axios = require('axios');
const TrainStoppage = require('../models/TrainStoppage');

const COMMON_STATIONS = {
    'DELHI': 'NDLS',
    'MATHURA': 'MTJ',
    'AGRA': 'AGC',
    'MUMBAI': 'CSMT',
    'PUNE': 'PUNE',
    'JALGAON': 'JL',
    'BHUSAVAL': 'BSL',
    'KURUKSHETRA': 'KKDE',
    'VARANASI': 'BSB',
    'LUCKNOW': 'LKO',
    'KANPUR': 'CNB',
    'JAIPUR': 'JP',
    'CHANDIGARH': 'CDG',
    'AMBALA': 'UMB'
};

const stationCodeCache = {};
const discoveryCache = {};

const getStationCode = async (stationName) => {
    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || 'indian-railway-irctc.p.rapidapi.com';

    // 1. Local fallback
    const normalized = stationName.toUpperCase();
    if (COMMON_STATIONS[normalized]) return COMMON_STATIONS[normalized];

    // 2. Memory cache
    if (stationCodeCache[normalized]) return stationCodeCache[normalized];

    if (!apiKey) return null;

    try {
        let url;
        if (apiHost.includes('irctc1')) {
            url = `https://${apiHost}/api/v1/searchStation?query=${encodeURIComponent(stationName)}`;
        } else {
            url = `https://${apiHost}/api/stations/v1/search/${encodeURIComponent(stationName)}`;
        }

        const response = await axios.get(url, {
            headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': apiHost }
        });

        const stations = response.data?.data || response.data?.stations || [];
        const code = stations.length > 0 ? (stations[0].stationCode || stations[0].code) : null;

        if (code) {
            stationCodeCache[normalized] = code;
            console.log(`Cached Station: ${normalized} -> ${code}`);
        }
        return code;
    } catch (error) {
        if (error.response?.status === 429) console.warn("Rate limit hit: Station Search");
        return null;
    }
};

const getTrainsBetweenStations = async (fromCode, toCode) => {
    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || 'indian-railway-irctc.p.rapidapi.com';

    const cacheKey = `${fromCode}-${toCode}`;
    if (discoveryCache[cacheKey]) return discoveryCache[cacheKey];

    if (!apiKey) return [];

    try {
        const date = new Date().toISOString().split('T')[0];
        let url;
        if (apiHost.includes('irctc1')) {
            url = `https://${apiHost}/api/v3/getTrainBetweenStations?fromStationCode=${fromCode}&toStationCode=${toCode}&dateOfJourney=${date}`;
        } else {
            url = `https://${apiHost}/api/trains-between-stations/v1/from/${fromCode}/to/${toCode}?date=${date}`;
        }

        const response = await axios.get(url, {
            headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': apiHost }
        });

        const trains = response.data?.data || [];
        if (trains.length > 0) {
            discoveryCache[cacheKey] = trains;
            console.log(`Cached Discovery: ${fromCode}->${toCode} (${trains.length} trains)`);
        }
        return trains;
    } catch (error) {
        if (error.response?.status === 429) console.warn("Rate limit hit: Trains Discovery");
        return [];
    }
};

const getTrainSchedule = async (trainNumber) => {
    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || 'indian-railway-irctc.p.rapidapi.com';
    if (!apiKey) return null;

    try {
        let url;
        if (apiHost.includes('irctc1')) {
            url = `https://${apiHost}/api/v1/getTrainSchedule?trainNo=${trainNumber}`;
        } else {
            url = `https://${apiHost}/api/trains-search/v1/train/${trainNumber}?isH5=true&client=web`;
        }

        const response = await axios.get(url, {
            headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': apiHost }
        });

        return response.data?.data || null;
    } catch (error) {
        if (error.response?.status === 429) console.warn("Rate limit hit: Train Schedule");
        return null;
    }
};

const normalizeAndCacheSchedule = async (trainNumber, apiData) => {
    const stops = apiData.stoppages || apiData.Route || apiData.trainRoute || [];
    if (!stops || stops.length === 0) return;

    const trainName = apiData.trainName || apiData.TrainName || `TRAIN_${trainNumber}`;
    const stoppages = [];
    await TrainStoppage.deleteMany({ tn: trainNumber });

    for (const stop of stops) {
        const stationName = stop.stationName || stop.StationName;
        const stationCode = stop.stationCode || stop.StationCode;
        const seq = parseInt(stop.sequence || stop.haltNumber || stop.stopNumber || stop.SerialNo || 0);
        const at = stop.arrivalTime || stop.ArrivalTime || '00:00';
        const dt = stop.departureTime || stop.DepartureTime || '00:00';
        const dayOffset = parseInt(stop.dayCount || stop.Day || 1) - 1;
        const distance = parseFloat(stop.distance || stop.Distance || 0);

        if (!stationCode) continue;

        stoppages.push({
            m: 'train', tn: trainNumber, nm: trainName,
            station_name: stationName, station_code: stationCode,
            seq, at, dt, day_offset: dayOffset, distance_km: distance,
            src: 'railway_api'
        });
    }

    if (stoppages.length > 0) {
        await TrainStoppage.insertMany(stoppages);
        console.log(`Cached schedule for ${trainNumber} (${stoppages.length} stops)`);
    }
};

module.exports = {
    getStationCode,
    getTrainsBetweenStations,
    getTrainSchedule,
    normalizeAndCacheSchedule
};
