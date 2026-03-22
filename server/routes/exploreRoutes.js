const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { admin, db } = require('../utils/firebase');
const TourismPlace = require('../models/TourismPlace');
const { getDuration } = require('../utils/mapApi');

// In-memory Category Map (Frontend -> Backend)
// Expanded to include all confirmed DB categories
const CATEGORY_MAP = {
    'Hill': ['Hill', 'Mountain Peak', 'Valley', 'Hill Station', 'Trekking', 'Viewpoint'],
    'Beach': ['Beach', 'Island', 'Promenade'],
    'Museum': ['Museum', 'Art Gallery', 'Science', 'Planetarium', 'Observatory'],
    'Heritage': ['Fort', 'Palace', 'Historical', 'Monument', 'Tomb', 'Mausoleum', 'Cave', 'Ruins', 'Archaeological Site', 'Heritage', 'Stepwell', 'War Memorial'],
    'Nature': ['Lake', 'Waterfalls', 'Waterfall', 'Wildlife Sanctuary', 'National Park', 'Botanical Garden', 'Scenic Area', 'Zoo', 'Park', 'Garden', 'Forest', 'Nature', 'River Island', 'Vineyard', 'Orchard'],
    'Spiritual': ['Temple', 'Temples', 'Church', 'Mosque', 'Gurudwara', 'Monastery', 'Shrine', 'Religious Site', 'Religious Shrine', 'Religious Complex', 'Spiritual Center'],
    'City Break': ['Market', 'Mall', 'Park', 'Landmark', 'Commercial Complex', 'Amusement Park', 'Theme Park', 'Urban Development Project', 'Township', 'Government Building'],
    // Add missing ones as identity mappings or groups
    'Cultural': ['Cultural', 'Culture', 'Memorial', 'Phased Development'],
    'Adventure Sport': ['Adventure Sport', 'Trekking', 'Ski Resort', 'Race Track'],
    'Entertainment': ['Entertainment', 'Film Studio', 'Theme Park', 'Aquarium']
};

router.post('/search', verifyToken, async (req, res) => {
    let { type, state, city, tripDays, budgetType, budget } = req.body;
    const uid = req.user.uid;

    console.log("--- INCOMING SEARCH ---", { type, state, city, tripDays, budgetType, budget });

    // 1. Validation
    if (!type || !tripDays || !budgetType) {
        return res.status(400).json({ error: "Missing required fields: type, tripDays, budgetType" });
    }

    try {
        // Sanitize Input
        type = type.trim();
        budgetType = budgetType.toLowerCase().trim();
        const selectedDay = tripDays.toString().trim();

        // 2. Preliminary Credit Check (Read-Only)
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists || (userDoc.data().credits || 0) <= 0) {
            return res.status(403).json({ error: "Insufficient credits", code: "NO_CREDITS" });
        }

        // 3. Build Query Filters (Strict Order)
        let query = {};

        // Step 1: Category filter
        const mappedList = CATEGORY_MAP[type] || [];
        const searchList = mappedList.length > 0 ? mappedList : [type];
        const regexList = searchList.map(c => new RegExp(c, 'i'));
        query.category = { $in: regexList };

        // Step 2: State filter (Optional)
        if (state && state !== 'All States' && state !== '') {
            query.state = state;
        }

        // Step 3: City filter (Optional)
        if (city && city !== 'All Cities' && city !== '') {
            query.city = city;
        }

        // Step 4: Trip Day and Budget Filter (Strict)
        const budgetField = `trip_days.${selectedDay}.budget.${budgetType}`;
        query[`trip_days.${selectedDay}`] = { $exists: true };
        if (budget) {
            query[budgetField] = { $lte: parseInt(budget) };
        }

        console.log("--- SEARCH QUERY DEBUG ---");
        console.log("Regex List:", regexList);
        console.log("Query:", JSON.stringify(query, null, 2));

        // 4. Fetch Candidates
        let places = await TourismPlace.find(query).lean();
        console.log(`Found ${places.length} places.`);

        // Step 5: Sorting
        places.sort((a, b) => {
            if (b.google_rating !== a.google_rating) {
                return (b.google_rating || 0) - (a.google_rating || 0);
            }
            const budgetA = a.trip_days[selectedDay]?.budget[budgetType] || 0;
            const budgetB = b.trip_days[selectedDay]?.budget[budgetType] || 0;
            return budgetA - budgetB;
        });

        // Limit results
        const results = places.slice(0, 15).map(place => ({
            _id: place._id,
            name: place.name,
            city: place.city,
            state: place.state,
            category: place.category,
            google_rating: place.google_rating,
            entry_fee_inr: place.entry_fee_inr || 0,
            weekly_off: place.weekly_off || "None",
            best_time: place.best_time || "All Year",
            estimated_budget: place.trip_days[selectedDay]?.budget[budgetType],
            selected_trip_days: selectedDay,
            coordinates: null
        }));

        // 5. Credit Deduction (Only if results found)
        if (results.length > 0) {
            try {
                await db.runTransaction(async (t) => {
                    const doc = await t.get(userRef);
                    if (!doc.exists) throw new Error("User not found");

                    const currentCredits = doc.data().credits || 0;
                    if (currentCredits <= 0) throw new Error("Insufficient credits");

                    t.update(userRef, { credits: currentCredits - 1 });
                });
            } catch (err) {
                console.error("Credit Deduction Failed:", err);
                if (err.message === "Insufficient credits") {
                    return res.status(403).json({ error: "Insufficient credits", code: "NO_CREDITS" });
                }
                throw err; // Re-throw other errors
            }
        }

        res.json({ success: true, results });

    } catch (error) {
        console.error("Explore Search Error:", error);
        res.status(500).json({ error: "Failed to fetch recommendations" });
    }
});

// Endpoint for Map Distance/Route (Lazy Load) - Unchanged
router.post('/map-details', verifyToken, async (req, res) => {
    const { userLocation, placeName, placeCity } = req.body;

    if (!userLocation || !placeName) {
        return res.status(400).json({ error: "Missing details" });
    }

    try {
        const destination = `${placeName}, ${placeCity}`;
        const durationData = await getDuration(userLocation, destination, 'driving'); // Default to driving

        res.json({
            success: true,
            distance: durationData.distance,
            duration: durationData.text,
            destination_query: destination,
            geometry: durationData.geometry,  // Pass GeoJSON to frontend
            fromCoords: durationData.fromCoords,
            toCoords: durationData.toCoords
        });
    } catch (error) {
        console.error("Map Details Error:", error);
        res.status(500).json({ error: "Failed to fetch map details" });
    }
});

// Endpoint to get list of cities for dropdown
router.get('/cities', async (req, res) => {
    try {
        const cities = await TourismPlace.distinct('city');
        res.json({ success: true, cities: cities.sort() });
    } catch (error) {
        console.error("City Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch cities" });
    }
});

// [NEW] Endpoint to get list of states for dropdown
router.get('/states', async (req, res) => {
    try {
        const states = await TourismPlace.distinct('state');
        res.json({ success: true, states: states.sort() });
    } catch (error) {
        console.error("State Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch states" });
    }
});

// Endpoint to get list of categories for dropdown
router.get('/categories', async (req, res) => {
    try {
        const categories = await TourismPlace.distinct('category');
        // Filter out nulls and sort
        const cleanCats = categories.filter(Boolean).sort();
        res.json({ success: true, categories: cleanCats });
    } catch (error) {
        console.error("Category Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

module.exports = router;
