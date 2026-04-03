import React, { useEffect } from 'react';
import MetaTags from '../components/MetaTags';
import './Contact.css';

const Contact = () => {
    const data = {
        title: "Contact Support | Traavo",
        description: "Need help with your booking or have a question about Traavo? Our support team is here to assist you via email or phone.",
        faqSchema: [
            {
                question: "How can I contact Traavo support?",
                answer: "You can email us at traavo2321@zohomail.in or call us at +918707601618."
            }
        ]
    };

    useEffect(() => {
        // Scroll to top when page loads
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="contact-page-wrapper">
            {/* Background Accents */}
            <div className="contact-bg-glow-1"></div>
            <div className="contact-bg-glow-2"></div>

            <div className="contact-container">
                <MetaTags
                    title={data.title}
                    description={data.description}
                    canonical="/contact"
                    faqSchema={data.faqSchema}
                />
                
                <div className="contact-header">
                    <h1 className="contact-title">Get in <span>Touch</span></h1>
                    <p className="contact-subtitle">
                        Need help with your booking or have a question about Traavo? 
                        Our dedicated support team is always here to assist you 24/7.
                    </p>
                </div>

                <div className="contact-cards-container">
                    <div className="contact-grid">

                        {/* Email Support */}
                        <div className="contact-card email-card">
                            <div className="icon-wrapper">
                                <svg viewBox="0 0 64 64" fill="none" className="icon-svg">
                                    <defs>
                                        <linearGradient id="envelopeGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#F5F3FF" />
                                            <stop offset="1" stopColor="#EDE9FE" />
                                        </linearGradient>
                                        <dropShadow id="blueShadow" dx="0" dy="4" stdDeviation="4" floodColor="#3B82F6" floodOpacity="0.4" />
                                    </defs>
                                    {/* Envelope Flap Back */}
                                    <path d="M6 24 L32 40 L58 24" fill="#DDD6FE" />
                                    {/* Envelope Body */}
                                    <rect x="6" y="20" width="52" height="34" rx="4" fill="url(#envelopeGrad)" stroke="#C4B5FD" strokeWidth="2" />
                                    {/* Envelope Bottom Folds */}
                                    <path d="M6 20 L24 35" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M58 20 L40 35" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
                                    {/* Front Flap Bottom */}
                                    <path d="M6 54 L32 38 L58 54" fill="#F5F3FF" stroke="#C4B5FD" strokeWidth="2" strokeLinejoin="round" />
                                    {/* Center Blue Circle with @ */}
                                    <circle cx="32" cy="38" r="14" fill="#3B82F6" filter="url(#blueShadow)" />
                                    <text x="32" y="44" fill="#ffffff" fontSize="18" fontWeight="800" fontFamily="system-ui, sans-serif" textAnchor="middle">@</text>
                                    <path d="M22 32 A 14 14 0 0 1 42 32 A 10 10 0 0 0 22 32" fill="#ffffff" opacity="0.3" />
                                </svg>
                            </div>
                            <h3 className="card-title">Email Us</h3>
                            <p className="card-desc">We usually reply within 24 hours</p>
                            <a href="mailto:traavo2321@zohomail.in" className="card-link email-link">
                                traavo2321@zohomail.in
                            </a>
                        </div>

                        {/* Phone Support */}
                        <div className="contact-card phone-card">
                            <div className="icon-wrapper">
                                <svg viewBox="0 0 64 64" fill="none" className="icon-svg">
                                    <defs>
                                        <linearGradient id="phoneGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#F0FDF4" />
                                            <stop offset="1" stopColor="#DCFCE7" />
                                        </linearGradient>
                                        <dropShadow id="greenShadow" dx="0" dy="4" stdDeviation="4" floodColor="#22C55E" floodOpacity="0.4" />
                                    </defs>
                                    <circle cx="32" cy="32" r="26" fill="url(#phoneGrad)" stroke="#BBF7D0" strokeWidth="2" />
                                    <path d="M41 40c-1.3 1.3-3 1.8-4.8 1.4-3.1-.7-7.2-2.5-10.9-6.2-3.7-3.7-5.5-7.8-6.2-10.9-.4-1.8.1-3.5 1.4-4.8l2-2c1.2-1.2 3.1-1.4 4.5-.4l3.1 2.3c1.2.9 1.4 2.6.4 3.7l-1.6 1.8c.8 1.8 2 3.6 3.6 5.2s3.4 2.8 5.2 3.6l1.8-1.6c1.1-1 2.8-.8 3.7.4l2.3 3.1c1 1.4.8 3.3-.4 4.5l-2 2h-.1z" fill="#22C55E" filter="url(#greenShadow)" />
                                </svg>
                            </div>
                            <h3 className="card-title">Call Us</h3>
                            <p className="card-desc">Mon-Fri, 9am - 6pm IST</p>
                            <a href="tel:+918707601618" className="card-link phone-link">
                                +91 87076 01618
                            </a>
                        </div>

                        {/* Office Address */}
                        <div className="contact-card address-card">
                            <div className="icon-wrapper">
                                <svg viewBox="0 0 64 64" fill="none" className="icon-svg">
                                    <defs>
                                        <linearGradient id="pinGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#F8FAFC" />
                                            <stop offset="1" stopColor="#F1F5F9" />
                                        </linearGradient>
                                        <dropShadow id="slateShadow" dx="0" dy="4" stdDeviation="4" floodColor="#64748B" floodOpacity="0.4" />
                                    </defs>
                                    <circle cx="32" cy="32" r="26" fill="url(#pinGrad)" stroke="#E2E8F0" strokeWidth="2" />
                                    <path d="M32 16C25.4 16 20 21.4 20 28C20 37 32 48 32 48C32 48 44 37 44 28C44 21.4 38.6 16 32 16ZM32 32C29.8 32 28 30.2 28 28C28 25.8 29.8 24 32 24C34.2 24 36 25.8 36 28C36 30.2 34.2 32 32 32Z" fill="#64748B" filter="url(#slateShadow)" />
                                </svg>
                            </div>
                            <h3 className="card-title">Visit Us</h3>
                            <p className="card-desc">Traavo HQ, Tech Park<br />Gurugram, HR - 122003</p>
                            <div className="card-link address-text">
                                Head Office
                            </div>
                        </div>

                    </div>
                    
                    <div className="contact-footer-note">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        We strive to resolve all queries within 24-48 business hours.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
