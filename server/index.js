const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load early

const connectDB = require('./config/db');
const { findRoutes } = require('./services/routingService');
const { getCityCoords } = require('./utils/cityCoords');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    'https://traavo.vercel.app', 
    'http://localhost:5173', 
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(bodyParser.json());

// Connect to Database
connectDB();
// Force Restart Trigger 5 for Suffix Fix

// --- ROUTES ---

const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const exploreRoutes = require('./routes/exploreRoutes'); // [NEW]
const { verifyToken } = require('./middleware/authMiddleware');
const { admin, db } = require('./utils/firebase');

app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/routes', pdfRoutes);
app.use('/api/explore', exploreRoutes); // [NEW]

app.post('/api/routes/find', verifyToken, async (req, res) => {
    const { from, to, time, day, mode, filter, hops, userLat, userLng, isLive, adminData, resolvedName } = req.body;
    const maxHops = parseInt(hops) || 4;

    if (!from || !to) {
        return res.status(400).json({ error: 'Please provide origin and destination.' });
    }

    // 1. Preliminary Credit Check (Optimization)
    // We check if user has at least 1 credit before doing the expensive search.
    // However, we don't deduct yet.
    // Note: Race condition possible but acceptable for this use case.
    try {
        const userRef = db.collection('users').doc(req.user.uid);
        const doc = await userRef.get();
        if (!doc.exists || (doc.data().credits || 0) <= 0) {
            return res.status(403).json({ error: 'Insufficient credits', code: 'NO_CREDITS' });
        }
    } catch (err) {
        console.error("Credit Check Error:", err);
        // Continue? No, fail safe.
        return res.status(500).json({ error: "Failed to verify credits before search" });
    }

    console.log(`Searching routes from ${from} to ${to} at ${time} [Filter: ${filter || 'all'}, Hops: ${maxHops}] Live: ${isLive} User: ${req.user.uid}`);

    let routes = [];
    try {
        routes = await findRoutes(from, to, time, day, mode, maxHops, userLat, userLng, isLive, adminData, resolvedName);
    } catch (error) {
        console.error("Routing Error:", error);
        return res.status(500).json({ error: 'Internal Server Error during search' });
    }

    // 2. Deduction Logic (Only if result is given/shown)
    // findRoutes returns an object with categories { mixed: { all: [] }, ... }
    const totalRoutes = routes ? Object.values(routes).reduce((acc, cat) => acc + (cat.all ? cat.all.length : 0), 0) : 0;

    if (totalRoutes > 0) {
        try {
            await db.runTransaction(async (t) => {
                const userRef = db.collection('users').doc(req.user.uid);
                const doc = await t.get(userRef);

                if (!doc.exists) {
                    throw new Error("User not found (please re-login)");
                }

                const userData = doc.data();
                const currentCredits = userData.credits !== undefined ? userData.credits : 0;

                if (currentCredits <= 0) {
                    throw new Error("Insufficient credits");
                }

                // Deduct 1 credit
                t.update(userRef, { credits: admin.firestore.FieldValue.increment(-1) });
            });
        } catch (error) {
            console.error("Credit Deduction Failed AFTER Search:", error);
            // Edge case: User had credits at start, but lost them during search (race condition),
            // OR system error.
            if (error.message === "Insufficient credits") {
                return res.status(403).json({ error: 'Insufficient credits to view results', code: 'NO_CREDITS' });
            }
            return res.status(500).json({ error: `Transaction failed: ${error.message}` });
        }
    }

    // 3. Return Response
    res.json({ success: true, routes });
});

// --- PLACES SEARCH ENDPOINT ---
const Place = require('./models/Place');

app.get('/api/places/search', async (req, res) => {
    const { query } = req.query;

    if (!query || query.length < 2) {
        return res.json({ success: true, results: [] });
    }

    const cleanQuery = query.toLowerCase().trim();

    try {
        // Priority 1: Exact prefix match on search_key
        const prefixResults = await Place.find({
            search_key: { $regex: `^${cleanQuery}` }
        }).limit(10).lean();

        // Priority 2: Ngram match (if we need more results)
        // Only fetch if we have fewer than 10 results, or just fetch and combine
        let finalResults = [...prefixResults];

        if (finalResults.length < 10) {
            const excludeIds = finalResults.map(p => p._id);
            const ngramResults = await Place.find({
                _id: { $nin: excludeIds },
                ngrams: cleanQuery
            }).limit(15 - finalResults.length).lean();

            finalResults = [...finalResults, ...ngramResults];
        }

        // Limit availability to top 15 total
        // Limit availability to top 15 total
        const top15 = finalResults.slice(0, 15);

        // Enrich with Real Coordinates (Geoapify)
        const namesToFetch = top15.map(p => p.name);
        const { fetchCoordinates, getBaseName: getGeoBase } = require('./utils/geoUtils');

        // This is async now
        let enrichedResults = [];
        try {
            const coordMap = await fetchCoordinates(namesToFetch);
            enrichedResults = top15.map(place => {
                const base = getGeoBase(place.name);
                const coords = coordMap[base] || { lat: 20.5937, lon: 78.9629 }; // Fallback
                return {
                    ...place,
                    lat: coords.lat,
                    lon: coords.lon || coords.lng
                };
            });
        } catch (err) {
            console.error("Geo Enrichment Error in Search:", err);
            // Fallback to raw if geo fails
            enrichedResults = top15.map(p => ({ ...p, lat: null, lon: null }));
        }

        res.json({ success: true, results: enrichedResults });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: 'Search temporarily unavailable' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
