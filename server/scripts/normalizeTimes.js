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
        const buses = await BusService.find({}).lean();
        const busBulkOps = [];
        for (let bus of buses) {
            let dt_mins_arr = [];
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
            
            if (dt_mins_arr.length > 0) {
                busBulkOps.push({
                    updateOne: {
                        filter: { _id: bus._id },
                        update: { $set: { dt_mins: dt_mins_arr } }
                    }
                });
            }
        }
        if (busBulkOps.length > 0) {
            console.log(`Executing ${busBulkOps.length} bus bulk updates...`);
            await BusService.bulkWrite(busBulkOps);
        }
        console.log(`Updated ${busBulkOps.length} Bus Services.`);

        // Process TrainStoppages
        console.log("Processing Train Stoppages...");
        const trains = await TrainStoppage.find({}).lean();
        const trainBulkOps = [];
        for (let train of trains) {
            let mins = null;
            if (train.dt) {
                mins = timeToMins(train.dt);
            }
            if (mins !== null) {
                trainBulkOps.push({
                    updateOne: {
                        filter: { _id: train._id },
                        update: { $set: { dt_mins: mins } }
                    }
                });
            }
        }
        if (trainBulkOps.length > 0) {
            console.log(`Executing ${trainBulkOps.length} train bulk updates...`);
            await TrainStoppage.bulkWrite(trainBulkOps);
        }
        console.log(`Updated ${trainBulkOps.length} Train Stoppages.`);

        console.log("Time normalization completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error during normalization:", err);
        process.exit(1);
    }
};

normalizeTimes();
