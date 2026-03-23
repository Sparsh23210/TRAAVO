const mongoose = require('mongoose');

const TrainStoppageSchema = new mongoose.Schema({
    m: {
        type: String,
        required: true,
        default: 'train',
        enum: ['train']
    },
    tn: {
        type: String, // Train Number
        required: true
    },
    nm: {
        type: String, // Train Name
        required: true
    },
    station_name: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    station_name_normalized: {
        type: String,
        default: ''
    },
    station_code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    seq: {
        type: Number, // Sequence number in the route
        required: true
    },
    at: {
        type: String, // Arrival Time (HH:mm)
        default: null
    },
    dt: {
        type: String, // Departure Time (HH:mm)
        default: null
    },
    day_offset: {
        type: Number, // Day offset from start (0, 1, 2...)
        default: 0
    },
    distance_km: {
        type: Number,
        default: 0
    },
    runs_on: {
        type: [String], // ["MON", "TUE", ...]
        default: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
    },
    src: {
        type: String, // 'static_schedule' or 'railway_api'
        default: 'static_schedule'
    }
}, {
    timestamps: true
});

// Compound index for finding a specific train's connectivity
// Start from a station
TrainStoppageSchema.index({ station_name: 1 });
// Ensure uniqueness of train+station? Maybe not, schedules change. 
// But (tn, station_code) should technically be unique for a run.
TrainStoppageSchema.index({ tn: 1, seq: 1 });

module.exports = mongoose.model('TrainStoppage', TrainStoppageSchema, 'train_stoppages');
