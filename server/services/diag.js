const mongoose = require('mongoose');
const BusService = require('../models/BusService');
const TrainStoppage = require('../models/TrainStoppage');
const { findRoutes } = require('./routingService');
require('dotenv').config();

const uri = process.env.MONGODB_URI_ATLAS || process.env.MONGODB_URI || 'mongodb://localhost:27017/transport_db';

mongoose.connect(uri)
    .then(async () => {
        console.log('MongoDB Connected');
        try {
            const results = await findRoutes('Delhi', 'Kurukshetra', '00:00');
            console.log('--- DIAGNOSTIC RESULTS ---');

            const count = (cat) => results[cat].best.length + results[cat].all.length;

            console.log('Total Mixed:', count('mixed'));
            console.log('Total Only Train:', count('only_train'));
            console.log('Total Only Bus:', count('only_bus'));
            console.log('Total Bus->Train:', count('bus_train'));

            if (results.only_train.best.length > 0) {
                console.log('Samples:', results.only_train.best.slice(0, 3).map(r => r.steps[0].operator));
            }
        } catch (err) {
            console.error(err);
        }
        process.exit(0);
    });
