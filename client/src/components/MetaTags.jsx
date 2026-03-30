import React from 'react';
import { Helmet } from 'react-helmet-async';

const MetaTags = ({ 
    title, 
    description, 
    canonical, 
    faqSchema,
    ogImage = "https://traavo.site/logo-full.png",
    twitterCard = "summary_large_image",
    robots = "index, follow"
}) => {
    const siteUrl = "https://traavo.site";
    const fullCanonical = canonical ? `${siteUrl}${canonical.startsWith('/') ? '' : '/'}${canonical}` : siteUrl;
    const pageTitle = title ? `${title} | Traavo` : "Traavo | Explore & Plan Your Journey";

    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{pageTitle}</title>
            {description && <meta name="description" content={description} />}
            <meta name="robots" content={robots} />
            
            {/* Canonical link */}
            <link rel="canonical" href={fullCanonical} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={fullCanonical} />
            <meta property="og:title" content={pageTitle} />
            {description && <meta property="og:description" content={description} />}
            <meta property="og:image" content={ogImage} />

            {/* Twitter */}
            <meta name="twitter:card" content={twitterCard} />
            <meta name="twitter:url" content={fullCanonical} />
            <meta name="twitter:title" content={pageTitle} />
            {description && <meta name="twitter:description" content={description} />}
            <meta name="twitter:image" content={ogImage} />

            {/* FAQ Schema */}
            {faqSchema && faqSchema.length > 0 && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": faqSchema.map(item => ({
                            "@type": "Question",
                            "name": item.question,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": item.answer
                            }
                        }))
                    })}
                </script>
            )}
        </Helmet>
    );
};

export default MetaTags;
