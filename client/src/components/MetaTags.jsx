import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const MetaTags = ({ 
    title, 
    description, 
    canonical, 
    faqSchema,
    ogImage = "https://traavo.site/logo-full.png",
    twitterCard = "summary_large_image",
    robots = "index, follow"
}) => {
    const location = useLocation();
    const siteUrl = "https://traavo.site";
    
    // Use explicitly provided canonical or fallback to current pathname (which inherently drops query params)
    let cleanCanonical = canonical || location.pathname;
    
    // Ensure it starts with /
    if (!cleanCanonical.startsWith('/')) {
        cleanCanonical = '/' + cleanCanonical;
    }
    
    // Remove trailing slash if it's not the root path
    if (cleanCanonical.length > 1 && cleanCanonical.endsWith('/')) {
        cleanCanonical = cleanCanonical.slice(0, -1);
    }
    
    const fullCanonical = `${siteUrl}${cleanCanonical}`;
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
