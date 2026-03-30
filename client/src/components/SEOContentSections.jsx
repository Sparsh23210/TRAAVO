import React, { useState } from 'react';
import '../pages/SEOPage.css';

const CollapsibleSection = ({ title, children, defaultExpanded = false }) => {
    const [isOpen, setIsOpen] = useState(defaultExpanded);
    return (
        <div className={`collapsible-wrapper ${isOpen ? 'is-open' : ''}`}>
            <button className="collapsible-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <span className="arrow">{isOpen ? '−' : '+'}</span>
            </button>
            <div className="collapsible-content">
                <div className="collapsible-inner">
                    {children}
                </div>
            </div>
        </div>
    );
};

const SEOContentSections = ({ data, hideStats = false }) => {
    if (!data) return null;

    return (
        <div className="seo-content-sections">
            <article>
                <div className="main-content-collapsible">
                    <CollapsibleSection title="Read Detailed Travel Insights" defaultExpanded={false}>
                        {data.content}
                    </CollapsibleSection>
                </div>
                
                {data.statistics && !hideStats && (
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

                {data.faqSchema && data.faqSchema.length > 0 && (
                    <section className="seo-faq-section">
                        <CollapsibleSection title="Frequently Asked Questions">
                            <div className="faq-list">
                                {data.faqSchema.map((faq, i) => (
                                    <div key={i} className="faq-item">
                                        <h3>{faq.question}</h3>
                                        <p>{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    </section>
                )}
            </article>
        </div>
    );
};

export default SEOContentSections;
