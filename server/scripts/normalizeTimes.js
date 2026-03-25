const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BusService = require('../models/BusService');
const TrainStoppage = require('../models/TrainStoppage');

dotenv.config();

// Helper to convert HH:MM string to minutes
const timeToMins = (timeStr) => {
    try {
        if (!timeStr || typeof timeStr !== 'string') return null;
        if (timeStr.toLowerCase() === 'now') {
            const d = new Date();
            return d.getHours() * 60 + d.getMinutes();
        }
        const parts = timeStr.split(':');
        if (parts.length < 2) return null;
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return null;
        return h * 60 + m;
    } catch (e) {
        return null;
    }
};

const normalizeTimes = async () => {
    try {
        let uriBase = process.env.MONGODB_URI_ATLAS || process.env.MONGODB_URI;
        const hosts = ['ac-jkzrhhv-shard-00-01.pughucv.mongodb.net:27017', 'ac-jkzrhhv-shard-00-02.pughucv.mongodb.net:27017', 'ac-jkzrhhv-shard-00-00.pughucv.mongodb.net:27017'];
        
        let connected = false;
        for (const host of hosts) {
            try {
                let testUri = uriBase.replace(/ac-jkzrhhv-shard-\d{2}-\d{2}\.pughucv\.mongodb\.net:27017/, host);
                if (!testUri.includes('directConnection=true')) testUri += '&directConnection=true';
                
                console.log("Trying host: " + host);
                await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
                // Double check if it's primary by doing a dummy write or just proceeding (mongoose will throw NotWritablePrimary on save if not)
                console.log("Connected to MongoDB at " + host);
                connected = true;
                break;
            } catch (err) {
                console.log("Host " + host + " failed: " + err.message);
            }
        }
        
        if (!connected) throw new Error("Could not connect to any primary node.");
        console.log("Connected to MongoDB");

        // Process BusServices
        console.log("Processing Bus Services...");
        const buses = await BusService.find({});
        let busUpdates = 0;
        for (let bus of buses) {
            let dt_mins_arr = [];
            // Parse dt
            if (typeof bus.dt === 'string') {
                const timings = bus.dt.split(',').map(s => s.trim()).filter(s => s);
                for (let t of timings) {
                    const m = timeToMins(t);
                    if (m !== null) dt_mins_arr.push(m);
                }
            } else if (Array.isArray(bus.dt)) {
                for (let t of bus.dt) {
                    const m = timeToMins(t);
                    if (m !== null) dt_mins_arr.push(m);
                }
            }
            
            // Only update if needed
            bus.dt_mins = dt_mins_arr;
            await bus.save();
            busUpdates++;
            if (busUpdates % 1000 === 0) console.log(`Processed ${busUpdates} buses...`);
        }
        console.log(`Updated ${busUpdates} Bus Services.`);

        // Process TrainStoppages
        console.log("Processing Train Stoppages...");
        const trains = await TrainStoppage.find({});
        let trainUpdates = 0;
        for (let train of trains) {
            let mins = null;
            if (train.dt) {
                mins = timeToMins(train.dt);
            }
            train.dt_mins = mins;
            await train.save();
            trainUpdates++;
            if (trainUpdates % 5000 === 0) console.log(`Processed ${trainUpdates} train stops...`);
        }
        console.log(`Updated ${trainUpdates} Train Stoppages.`);

        console.log("Time normalization completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error during normalization:", err);
        process.exit(1);
    }
};

normalizeTimes();
