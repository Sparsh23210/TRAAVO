const mongoose = require('mongoose');

const BusServiceSchema = new mongoose.Schema({
    m: {
        type: String,
        required: true,
        default: 'bus',
        enum: ['bus']
    },
    op: {
        type: String, // Operator (e.g., HR, PB)
        required: true
    },
    st: {
        type: String, // Service Type (e.g., ORDINARY, VOLVO)
        default: 'ORDINARY'
    },
    sd: {
        type: String, // Service Days
        default: 'ALL DAYS'
    },
    f: {
        type: String, // From (Source)
        required: true,
        uppercase: true,
        trim: true
    },
    f_normalized: {
        type: String,
        default: ''
    },
    v: {
        type: [String], // Via (Intermediate stops)
        default: [],
        set: v => v.map(s => s.toUpperCase().trim())
    },
    v_normalized: {
        type: [String],
        default: []
    },
    t: {
        type: String, // To (Destination)
        required: true,
        uppercase: true,
        trim: true
    },
    t_normalized: {
        type: String,
        default: ''
    },
    dt: {
        type: mongoose.Schema.Types.Mixed, // Departure Time (HH:mm) String or Array
        required: true
    },
    dt_mins: {
        type: [Number],
        default: []
    },
    src: {
        type: String,
        default: 'manual'
    }
}, {
    timestamps: true
});

// Index for efficient searching
BusServiceSchema.index({ f: 1 });
BusServiceSchema.index({ t: 1 });
BusServiceSchema.index({ v: 1 });
BusServiceSchema.index({ dt_mins: 1 });

module.exports = mongoose.model('BusService', BusServiceSchema, 'bus_services');
