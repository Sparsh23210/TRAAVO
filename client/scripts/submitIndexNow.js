import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resolve = (p) => path.resolve(__dirname, '..', p);

const sitemapPath = resolve('dist/sitemap.xml');
const INDEX_NOW_KEY = 'bc34d8a571e04130a113a7c617b070ba';
const HOST = 'traavo.site';
const KEY_LOCATION = `https://${HOST}/${INDEX_NOW_KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const extractUrlsFromSitemap = () => {
    try {
        if (!fs.existsSync(sitemapPath)) {
            console.error(`Sitemap not found at ${sitemapPath}. Cannot submit to IndexNow.`);
            return [];
        }
        const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
        const urls = [];
        const regex = /<loc>(.*?)<\/loc>/g;
        let match;
        while ((match = regex.exec(sitemapContent)) !== null) {
            urls.push(match[1]);
        }
        // Deduplicate and return
        return [...new Set(urls)];
    } catch (error) {
        console.error('Error reading sitemap:', error);
        return [];
    }
};

(async () => {
    console.log('Starting IndexNow submission...');
    const urls = extractUrlsFromSitemap();

    if (urls.length === 0) {
        console.log('No URLs found to submit. Exiting.');
        process.exit(0);
    }

    console.log(`Found ${urls.length} URLs to submit to Bing/IndexNow.`);

    const payload = {
        host: HOST,
        key: INDEX_NOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: urls
    };

    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'charset': 'utf-8'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('✅ IndexNow submission successful! Bing & Copilot have been notified.');
        } else if (response.status === 202) {
             console.log('✅ IndexNow submission queued! Bing & Copilot have been notified.');
        } else {
            const text = await response.text();
            console.error(`❌ IndexNow submission failed. Status: ${response.status} ${response.statusText}`);
            console.error(`Response details: ${text}`);
        }
    } catch (error) {
        console.error('❌ Network error during IndexNow submission:', error);
    }
})();
