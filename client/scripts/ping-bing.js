import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = 'traavo.site';
const KEY = '';

async function submitToIndexNow() {
    console.log(`Starting IndexNow submission for ${HOST}...`);

    try {
        const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
        const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

        // Extract <loc> URLs from sitemap.xml
        const urlRegex = /<loc>(https:\/\/traavo\.site\/[^<]+)<\/loc>/g;
        const urls = [];
        let match;
        while ((match = urlRegex.exec(sitemapContent)) !== null) {
            urls.push(match[1]);
        }

        if (urls.length === 0) {
            console.error("❌ No URLs found in sitemap.xml");
            return;
        }

        console.log(`📡 Found ${urls.length} URLs. (Bing Guideline: Full Refresh Mode)`);
        console.log(`📡 Pinging Bing/IndexNow for priority grounding...`);

        const payload = {
            host: HOST,
            key: KEY,
            keyLocation: `https://${HOST}/${KEY}.txt`,
            urlList: urls
        };

        const response = await fetch('https://api.indexnow.org/IndexNow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("✅ Success! Your 32+ pages have been submitted to Bing and Copilot.");
            console.log("Bing will now recrawl your site shortly.");
        } else {
            const errorText = await response.text();
            console.error(`❌ IndexNow submission failed. Status: ${response.status}`);
            console.error(`Response details: ${errorText}`);
            console.error("\n--- TROUBLESHOOTING ---");
            console.error("If you see '403 Forbidden', it means Bing hasn't seen your verification file yet.");
            console.error(`Please visit https://${HOST}/${KEY}.txt in your browser to confirm it's live.`);
        }

    } catch (error) {
        console.error("❌ An unexpected error occurred during submission:", error.message);
    }
}

submitToIndexNow();
