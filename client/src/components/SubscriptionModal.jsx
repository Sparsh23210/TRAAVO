import React, { useState } from 'react';
import './SubscriptionModal.css';
import { useAuth } from '../context/AuthContext';

const PLANS = [
    {
        id: 'premium',
        name: 'Premium',
        price: 9,
        credits: 10,
        features: ['Route search', 'Maps', 'NO Save', 'NO Share'],
        color: '#3b82f6',
        popular: false
    },
    {
        id: 'pro_premium',
        name: 'Pro Premium',
        price: 59,
        credits: 50,
        features: ['Save Route (PDF)', 'Share Route (WhatsApp)'],
        color: '#8b5cf6',
        popular: true
    },
    {
        id: 'ultra_premium',
        name: 'Ultra Premium',
        price: 109,
        credits: 100,
        features: ['All Pro features', 'Max Credits', 'Priority Support'],
        color: '#eab308',
        popular: false
    }
];

const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const SubscriptionModal = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleBuy = async (plan) => {
        if (!currentUser) return alert("Please login first");

        setLoading(true);
        const res = await loadRazorpay();

        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            setLoading(false);
            return;
        }

        try {
            // 1. Create Order
            const token = await currentUser.getIdToken();
            // Unused variable removed
            // Note: In development, usually proxied or localhost. Assuming localhost:5000 or relative if proxy setup.
            // But vite config might not proxy api. Let's assume relative /api if proxy exists, or absolute.
            // I'll use logic to use local if not set.
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            const response = await fetch(`${apiUrl}/api/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planId: plan.id })
            });

            const order = await response.json();

            if (!response.ok) {
                throw new Error(order.error || 'Something went wrong');
            }

            // 2. Open Razorpay
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Traavo",
                description: `Subscribe to ${plan.name}`,
                // image: "/logo.png", // Optional
                order_id: order.id,
                handler: async function (response) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch(`${apiUrl}/api/payment/verify-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                planId: plan.id
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok) {
                            alert("Payment Successful! Credits added.");
                            onClose();
                        } else {
                            alert(verifyData.error || "Payment verification failed");
                        }
                    } catch (e) {
                        console.error(e);
                        alert("Verification failed");
                    }
                },
                prefill: {
                    name: currentUser.displayName || currentUser.email,
                    email: currentUser.email,
                    contact: "" // Optional
                },
                theme: {
                    color: plan.color
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="subscription-modal">
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h2>Upgrade Your Plan</h2>
                <p>Get more credits and unlock premium features</p>

                <div className="plans-container">
                    {PLANS.map(plan => (
                        <div key={plan.id} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
                            {plan.popular && <div className="badge">Most Popular</div>}
                            <h3>{plan.name}</h3>
                            <div className="price">₹{plan.price}</div>
                            <div className="credits-badge">+{plan.credits} Credits</div>
                            <ul className="features-list">
                                {plan.features.map((f, i) => (
                                    <li key={i}>{f}</li>
                                ))}
                            </ul>
                            <button
                                className="buy-btn"
                                style={{ backgroundColor: plan.color }}
                                onClick={() => handleBuy(plan)}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Buy Now'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionModal;
