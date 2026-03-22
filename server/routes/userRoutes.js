const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { admin, db } = require('../utils/firebase');

// Get User Data (Current credits etc)
router.get('/me', verifyToken, async (req, res) => {
    try {
        const userRef = db.collection('users').doc(req.user.uid);
        const doc = await userRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(doc.data());
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
