const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load early

const connectDB = require('./config/db');
const { findRoutes } = require('./services/routingService');
const { getCityCoords } = require('./utils/cityCoords');

const app = express();
const PORT = process.env.PORT || 5000;

// Health check route for Render
app.get('/health', (req, res) => res.status(200).send('Server is healthy'));

const allowedOrigins = [
    'https://traavo.vercel.app',
    'https://traavo.site',
    'https://www.traavo.site',
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
    // BYPASSED FOR LOCAL TESTS

    console.log(`Searching routes from ${from} to ${to} at ${time} [Filter: ${filter || 'all'}, Hops: ${maxHops}] Live: ${isLive} User: ${req.user.uid}`);

    let routes = [];
    try {
        routes = await findRoutes(from, to, time, day, mode, maxHops, userLat, userLng, isLive, adminData, resolvedName);
    } catch (error) {
        console.error("Routing Error:", error);
        return res.status(500).json({ error: 'Internal Server Error during search' });
    }

    // 3. Return Response
    res.json({ success: true, routes });
});

// --- NEW EXACT TIMING CREDIT DEDUCTION ---
app.post('/api/user/deduct-credit', verifyToken, async (req, res) => {
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
        res.json({ success: true });
    } catch (error) {
        console.error("Credit Deduction Failed:", error);
        if (error.message === "Insufficient credits") {
            return res.status(403).json({ error: 'Insufficient credits', code: 'NO_CREDITS' });
        }
        return res.status(500).json({ error: `Transaction failed: ${error.message}` });
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
