require('dotenv').config();
const mongoose = require('mongoose');
const BusService = require('../models/BusService');
const TrainStoppage = require('../models/TrainStoppage');

const getBaseName = (name) => {
    if (!name) return '';
    const base = name.split(/[\(\[-]/)[0]
        .replace(/\b(JN|JUNCTION|CANTT|CENTRAL|TERMINAL|STAND|ISBT|NEW|OLD|STATION|RLY|CITY)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    return base.toUpperCase();
};

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI_ATLAS);
        console.log("Connected to MongoDB. Starting NORMALIZATION process...");

        console.log("Normalizing BusServices...");
        const buses = await BusService.find({});
        let busUpdates = 0;
        for (const bus of buses) {
            let needsUpdate = false;
            const f_norm = getBaseName(bus.f);
            const t_norm = getBaseName(bus.t);
            const v_norm = (bus.v || []).map(v => getBaseName(v));

            if (bus.f_normalized !== f_norm || bus.t_normalized !== t_norm || JSON.stringify(bus.v_normalized) !== JSON.stringify(v_norm)) {
                bus.set('f_normalized', f_norm);
                bus.set('t_normalized', t_norm);
                bus.set('v_normalized', v_norm);
                await bus.save();
                busUpdates++;
            }
        }
        console.log(`Updated ${busUpdates} out of ${buses.length} BusServices.`);

        console.log("Normalizing TrainStoppages...");
        const trains = await TrainStoppage.find({});
        let trainUpdates = 0;
        for (const train of trains) {
            const stat_norm = getBaseName(train.station_name);
            if (train.station_name_normalized !== stat_norm) {
                train.set('station_name_normalized', stat_norm);
                await train.save();
                trainUpdates++;
            }
        }
        console.log(`Updated ${trainUpdates} out of ${trains.length} TrainStoppages.`);

        console.log("Creating strict Indexes on new fields...");
        await BusService.collection.createIndex({ f_normalized: 1 });
        await BusService.collection.createIndex({ v_normalized: 1 });
        await TrainStoppage.collection.createIndex({ station_name_normalized: 1 });
        console.log("Indexes created successfully!");

        console.log("Migration Complete. Exiting.");
        process.exit(0);
    } catch (err) {
        console.error("Migration Error:", err);
        process.exit(1);
    }
}

run();
