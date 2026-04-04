import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import './Legal.css';

const Privacy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="legal-page-wrapper">
            <Helmet>
                <title>Privacy Policy | Traavo - Your Travel Emergency Companion</title>
                <meta name="description" content="Traavo's Privacy Policy. Learn how we collect, use, and protect your data while providing smart and reliable travel alternative routing." />
            </Helmet>

            <div className="legal-bg-glow-1"></div>
            <div className="legal-bg-glow-2"></div>

            <div className="legal-container">
                <div className="legal-header">
                    <span className="legal-badge">Legal</span>
                    <h1 className="legal-title">Privacy Policy</h1>
                    <p className="legal-last-updated">Last Updated: April 5, 2026</p>
                </div>

                <div className="legal-content-wrapper">
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to Traavo. We respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you about how we look after your personal data when you visit our website (traavo.com) and tell you about your privacy rights and how the law protects you.
                    </p>

                    <h2>2. Data We Collect</h2>
                    <p><strong>We do not collect, store, or track any personal data tied to your searches.</strong> When you use Traavo to find emergency travel routes, we only process anonymized operational data:</p>
                    <ul>
                        <li><strong>Search Data:</strong> Travel origin, destination, and preferred dates are processed temporarily to generate accurate routes, but are never stored or linked to your identity.</li>
                        <li><strong>Technical Data:</strong> Basic internet protocol (IP) address, browser type and version, and operating system for platform monitoring.</li>
                        <li><strong>Usage Data:</strong> Anonymous information about how you interact with our application to help us improve our routing algorithms.</li>
                    </ul>

                    <h2>3. How We Use Your Data</h2>
                    <p>We will only use your personal data when the law allows us to. Most commonly, we use your data in the following circumstances:</p>
                    <ul>
                        <li>To provide accurate fallback travel options when direct paths are unavailable.</li>
                        <li>To manage and optimize our smart routing algorithms (Seat Chain, Station Alternative, etc.).</li>
                        <li>To improve our website, products/services, marketing, customer relationships, and experiences.</li>
                    </ul>

                    <h2>4. Data Sharing and Third Parties</h2>
                    <p>
                        We do not sell your personal data to third parties. However, in order to provide comprehensive travel alternatives (like connecting buses or nearby trains), we may share anonymized search queries with our transit data partners.
                    </p>

                    <h2>5. Data Security</h2>
                    <p>
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. We limit access to your personal data to those employees and partners who have a business need to know.
                    </p>

                    <h2>6. Cookies</h2>
                    <p>
                        You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of the Traavo route-finding experience may become less efficient or not function properly.
                    </p>

                    <h2>7. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy or our privacy practices, please contact our support team through our <a href="/contact">Contact Page</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
