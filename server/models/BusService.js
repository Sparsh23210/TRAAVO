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
    v: {
        type: [String], // Via (Intermediate stops)
        default: [],
        set: v => v.map(s => s.toUpperCase().trim())
    },
    t: {
        type: String, // To (Destination)
        required: true,
        uppercase: true,
        trim: true
    },
    dt: {
        type: String, // Departure Time (HH:mm)
        required: true
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

module.exports = mongoose.model('BusService', BusServiceSchema, 'bus_services');
