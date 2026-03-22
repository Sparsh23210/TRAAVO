const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("CRITICAL: Razorpay Keys are missing in .env!");
} else {
    console.log("Razorpay initialized with Key ID:", process.env.RAZORPAY_KEY_ID);
}

module.exports = razorpay;
