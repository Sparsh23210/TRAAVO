const mongoose = require('mongoose');

// Schema based on the exact JSON format provided by the user.
// Uses { strict: false } to ensuring all fields are fetched correctly even if slightly different in DB.
const tourismPlaceSchema = new mongoose.Schema({
    zone: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    name: { type: String, required: true },
    // Category is an array of strings strings e.g. ["Museum"]
    category: { type: [String], required: true },
    visit_time_hours: { type: Number, required: true },
    google_rating: { type: Number, required: true },
    entry_fee_inr: { type: Number, required: true },
    weekly_off: { type: String, default: "None" },
    best_time: { type: String, default: "All" },
    // Nested structure for trip days:  "1": { "budget": { "standard": ... } }
    // Using Mixed to properly handle dynamic keys "1", "2", etc.
    trip_days: { type: mongoose.Schema.Types.Mixed, required: true },
    source: { type: String, default: "excel" }
}, {
    collection: 'tourism_places',
    strict: false // Allow fields not defined in schema to be fetched/saved (robustness)
});

module.exports = mongoose.model('TourismPlace', tourismPlaceSchema);
