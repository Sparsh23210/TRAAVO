import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MetaTags from '../components/MetaTags';
import BackgroundAnimation from '../components/BackgroundAnimation';
import { SEO_CONTENT } from '../data/seoContent';
import './SEOPage.css';

const SEOPage = ({ slug }) => {
    const navigate = useNavigate();
    const data = SEO_CONTENT[slug] || {
        title: "Travel Guide",
        subtitle: "Explore smart ways to travel with Traavo.",
        description: "Discover expert travel tips, hidden routes, and smart pathfinding with Traavo's comprehensive guides.",
        faqSchema: [],
        content: <p>Our guide is being updated with the latest transit secrets. Stay tuned!</p>
    };





    const allSlugs = Object.keys(SEO_CONTENT);
    const relatedSlugs = allSlugs
        .filter(s => s !== slug && !['home', 'about', 'contact', 'explore', 'bus-routes', 'train-routes'].includes(s))
        .slice(0, 6);

    return (
        <div className="seo-page-container">
            <MetaTags
                title={data.title}
                description={data.description}
                canonical={`/${slug}`}
                faqSchema={data.faqSchema}
                ogImage={data.ogImage}
            />
            <BackgroundAnimation dark={true} />
            <div className="seo-header">
                <h1>{data.title}</h1>
                <p className="seo-subtitle">{data.subtitle}</p>
            </div>
            <div className="seo-content-card">
                <article>
                    {data.content}

                    {data.statistics && (
                        <section className="seo-stats-section">
                            <h2>Key Transit Statistics</h2>
                            <div className="stats-grid">
                                {data.statistics.map((stat, i) => (
                                    <div key={i} className="stat-card">
                                        <span className="stat-value">{stat.value}</span>
                                        <span className="stat-label">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.practicalInfo && (
                        <section className="seo-practical-section">
                            <h2>Practical Travel Information</h2>
                            <div className="practical-grid">
                                {data.practicalInfo.map((info, i) => (
                                    <div key={i} className="practical-item">
                                        <h3>{info.title}</h3>
                                        <p>{info.details}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}



                    {data.faqSchema && data.faqSchema.length > 0 && (
                        <section className="seo-faq-section">
                            <h2>Frequently Asked Questions</h2>
                            <div className="faq-list">
                                {data.faqSchema.map((faq, i) => (
                                    <div key={i} className="faq-item">
                                        <h3>{faq.question}</h3>
                                        <p>{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </article>

                <div className="seo-cta">
                    <h2>Ready to find your route?</h2>
                    <p>Use Traavo's Smart Search to discover all possible paths right now across all modes of transport.</p>
                    <button onClick={() => navigate('/')} className="search-now-btn">
                        Go to Home & Search 🔎
                    </button>

                    {relatedSlugs.length > 0 && (
                        <div className="seo-internal-links">
                            <h3>Continue Your Journey: Related Guides</h3>
                            <ul className="related-links-grid">
                                {relatedSlugs.map(rSlug => (
                                    <li key={rSlug}>
                                        <Link to={`/${rSlug}`}>
                                            {SEO_CONTENT[rSlug]?.title.split(':')[0]}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SEOPage;
