import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import './Legal.css';

const Refund = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="legal-page-wrapper">
            <Helmet>
                <title>Refund & Cancellation Policy | Traavo - Your Travel Emergency Companion</title>
                <meta name="description" content="Traavo's Refund and Cancellation Policy. Learn about our no-refund and zero-cancellation charge policy for our digital routing services." />
            </Helmet>

            <div className="legal-bg-glow-1"></div>
            <div className="legal-bg-glow-2"></div>

            <div className="legal-container">
                <div className="legal-header">
                    <span className="legal-badge">Compliance</span>
                    <h1 className="legal-title">Refund & Cancellation</h1>
                    <p className="legal-last-updated">Last Updated: April 11, 2026</p>
                </div>

                <div className="legal-content-wrapper">
                    <h2>1. Digital Service Nature</h2>
                    <p>
                        Traavo provides AI-driven travel intelligence and routing services. These are considered digital services that are delivered instantly upon request (when a route is searched or credits are used).
                    </p>

                    <h2>2. No Refund Policy</h2>
                    <p>
                        <strong>No refunds will be provided</strong> for any credits purchased or services utilized on the Traavo platform. Once a payment is successfully processed and credits are added to your account, they cannot be exchanged for cash or refunded to your original payment method.
                    </p>

                    <h2>3. Cancellation Policy</h2>
                    <p>
                        We do not charge any "Cancellation Fees" for the use of our platform. Users are free to stop using the service at any time. However, any unused credits remaining in the account at the time of discontinuance will not be eligible for a refund.
                    </p>

                    <h2>4. Failed Transactions</h2>
                    <p>
                        In case of a payment failure where the amount is deducted from your bank account but credits are not added to your Traavo profile, the amount is typically refunded by your bank within 5-7 business days. If the issue persists, please contact our support team with your transaction ID.
                    </p>

                    <h2>5. Contact for Discrepancies</h2>
                    <p>
                        If you believe there has been an error in your credit allocation or billing, please reach out to us via our <a href="/contact">Contact Page</a> within 24 hours of the transaction.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Refund;
