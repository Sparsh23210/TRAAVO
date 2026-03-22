const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    search_key: { type: String, required: true, index: true }, // Index already exists per prompt
    ngrams: { type: [String], index: true }, // Index already exists per prompt
    types: { type: [String], default: [] }
});

module.exports = mongoose.model('Place', PlaceSchema);
