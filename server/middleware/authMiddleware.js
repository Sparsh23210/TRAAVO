const { admin, auth, db } = require('../utils/firebase');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
};

// Middleware to check credits (optional, can be done in controller)
const checkCredits = async (req, res, next) => {
    try {
        const userRef = db.collection('users').doc(req.user.uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            // If user doesn't exist in Firestore yet (edge case), create them with default free plan
            // But for now, just error or let controller handle.
            // We'll let controller handle creation if missing, or middleware can reject.
            // Given the requirements "Credit deduction MUST happen on backend", precise control is needed.
            // Let's assume user exists or created on frontend login.
            return res.status(404).json({ error: 'User not found in system' });
        }

        const userData = doc.data();
        if (userData.credits <= 0) {
            return res.status(403).json({ error: 'Insufficient credits', code: 'NO_CREDITS' });
        }

        req.userData = userData;
        next();
    } catch (error) {
        console.error("Credit check error:", error);
        res.status(500).json({ error: 'Internal Server Error during credit check' });
    }
};

module.exports = { verifyToken, checkCredits };
