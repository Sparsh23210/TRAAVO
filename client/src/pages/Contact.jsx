import React from 'react';
import MetaTags from '../components/MetaTags';
import SEOContentSections from '../components/SEOContentSections';
import { SEO_CONTENT } from '../data/seoContent';

const Contact = () => {
    const data = SEO_CONTENT['contact'];

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            fontFamily: "'Inter', sans-serif",
            color: '#334155'
        }}>
            <MetaTags 
                title={data.title}
                description={data.description}
                canonical="/contact"
                faqSchema={data.faqSchema}
            />
            <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#1e293b',
                marginBottom: '1.5rem',
                textAlign: 'center'
            }}>Contact Support</h1>

            <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                        Need help with your booking or have a question about Traavo?
                        Our support team is here to assist you.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>

                    {/* Email Support */}
                    <div style={{
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Email Us</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>We usually reply within 24 hours</p>
                        <a href="mailto:support@traavo.com" style={{
                            display: 'block',
                            marginTop: '0.5rem',
                            color: '#2563eb',
                            fontWeight: '600',
                            textDecoration: 'none'
                        }}>traavo2321@zohomail.in</a>
                    </div>

                    {/* Phone Support */}
                    <div style={{
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📞</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Call Us</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Mon-Fri, 9am - 6pm IST</p>
                        <a href="tel:+919876543210" style={{
                            display: 'block',
                            marginTop: '0.5rem',
                            color: '#2563eb',
                            fontWeight: '600',
                            textDecoration: 'none'
                        }}>+918707601618</a>
                    </div>

                    {/* Office Address */}
                    <div style={{
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                        textAlign: 'center',
                        gridColumn: '1 / -1'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Visit Us</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                            Traavo HQ, Tech Park, Sector 44,<br />
                            Gurugram, Haryana, India - 122003
                        </p>
                    </div>

                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                    * Note: These contact details are for demonstration purposes only.
                </div>
            </div>
        </div>
    );
};

export default Contact;
