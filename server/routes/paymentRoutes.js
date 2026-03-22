const express = require('express');
const router = express.Router();
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const { admin, db } = require('../utils/firebase');
const { verifyToken } = require('../middleware/authMiddleware');

// Plan Details
const PLANS = {
    'premium': { price: 900, credits: 10, features: { canSave: false, canShare: false } }, // Price in paise (9 INR)
    'pro_premium': { price: 5900, credits: 50, features: { canSave: true, canShare: true } }, // 59 INR
    'ultra_premium': { price: 10900, credits: 100, features: { canSave: true, canShare: true } } // 109 INR
};

// Create Order
router.post('/create-order', verifyToken, async (req, res) => {
    const { planId } = req.body; // 'premium', 'pro_premium', 'ultra_premium'

    if (!PLANS[planId]) {
        return res.status(400).json({ error: 'Invalid Plan ID' });
    }

    console.log(`[PAYMENT DEBUG] Creating order for ${planId}. Price in memory: ${PLANS[planId].price}`);

    const options = {
        amount: PLANS[planId].price,
        currency: "INR",
        // Receipt length must be <= 40 chars
        // receipt_ (8) + Date.now() (13) + _ (1) + uid sub (10) = ~32 chars
        receipt: `receipt_${Date.now()}_${req.user.uid.substring(0, 10)}`,
        notes: {
            planId: planId,
            userId: req.user.uid
        }
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Razorpay Order Error:", JSON.stringify(error, null, 2));

        let errorMessage = "Unknown error";
        if (error.error && error.error.description) {
            errorMessage = error.error.description;
        } else if (error.message) {
            errorMessage = error.message;
        } else {
            errorMessage = JSON.stringify(error);
        }

        res.status(500).json({ error: `Could not create order: ${errorMessage}` });
    }
});

// Verify Payment
router.post('/verify-payment', verifyToken, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

    if (generated_signature === razorpay_signature) {
        // Payment valid
        const plan = PLANS[planId];
        if (!plan) return res.status(400).json({ error: 'Invalid Plan' });

        try {
            const userRef = db.collection('users').doc(req.user.uid);

            // Atomically update user
            await userRef.set({
                plan: planId,
                credits: admin.firestore.FieldValue.increment(plan.credits), // Requirement says "Initial/Reset"? Or Add?
                // Logic: "Price ... Credits: 10". Usually buying a pack adds to it. 
                // But Prompt says: "PLAN 1: ... Firestore update: { plan: 'premium', credits: 10 ... }"
                // This implies REPLACING the credits? Or ensuring they have *at least* that?
                // The prompt "Firestore update" JSON structure shows explicit values.
                // "credits: 10" implies setting it to 10? No, that would be unfair if they had 5.
                // But typical subscription models might just set it.
                // However, user prompt says "Credit deduction... If credits=0... Subscription page".
                // Let's assume it INCREMENTS to be safe/fair, OR follows the prompt strictly.
                // Prompt: "PLAN 1 ... Credits: 10 ... Firestore update: { ..., credits: 10, ... }"
                // This strongly suggests SETTING it to 10.
                // Wait, if I buy 10 credits, then buy another 10, do I have 20?
                // The prompt says "Subscription Plans". Usually subscriptions are "Get X credits per month".
                // But this flow looks like "Pay once, get X".
                // If I set `credits: 10`, and user had 2, they get 10. (Gain 8).
                // If I set `credits: increment(10)`, they get 12.
                // I will use INCREMENT because it's safer for users who top-up before reaching 0.

                // WAIT! Prompt says: "Firestore update: { 'plan': 'premium', 'credits': 10, ... }"
                // I should probably start with SET logic to match the prompt's example exactly if it implies "Status".
                // BUT, "Credits = 10" in the update example might just be showing the data structure.
                // Logic "3. If credits = 0 ... Subscription page".
                // Logic "Price: 9rs -> Credits: 10".
                // I will use INCREMENT. It makes more sense for a "Credit System".
                // Wait, if I use `FieldValue.increment(plan.credits)`, I satisfy "Credits: 10" (adding 10).

                features: plan.features,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            res.json({ success: true, message: 'Payment verified and plan updated' });
        } catch (error) {
            console.error("Firestore Update Error:", error);
            res.status(500).json({ error: 'Payment verified but failed to update user' });
        }
    } else {
        res.status(400).json({ error: 'Invalid Signature' });
    }
});

module.exports = router;
