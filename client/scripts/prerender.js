import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import serveStatic from 'serve-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resolve = (p) => path.resolve(__dirname, '..', p);

const distDir = resolve('dist');
const sitemapPath = resolve('dist/sitemap.xml'); // We render after Vite build, so sitemap is in dist

const extractUrlsFromSitemap = () => {
    try {
        const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
        const urls = [];
        const regex = /<loc>(.*?)<\/loc>/g;
        let match;
        while ((match = regex.exec(sitemapContent)) !== null) {
            let url = match[1];
            // Remove the hardcoded domain to get relative paths
            url = url.replace('https://traavo.site', '');
            if (!url.startsWith('/')) url = '/' + url;
            urls.push(url);
        }
        // Deduplicate and return
        return [...new Set(urls)];
    } catch (error) {
        console.error('Error reading sitemap:', error);
        console.log('Falling back to only prerendering /');
        return ['/'];
    }
};

(async () => {
    console.log('Starting prerender process...');

    // 1. Start a local server to serve the React SPA
    const app = express();

    // Read the original index.html into memory so we always serve a clean template
    // even if the script eventually overwrites dist/index.html
    const indexTemplate = fs.readFileSync(resolve('dist/index.html'), 'utf-8');

    // Serve static files from dist
    app.use(serveStatic(distDir));

    // For any other route (SPA fallback), serve the clean in-memory template
    app.use((req, res) => {
        res.send(indexTemplate);
    });

    const server = app.listen(0, async () => {
        const port = server.address().port;
        console.log(`Local static server started on port ${port}`);

        // 2. Discover routes to render
        const routes = extractUrlsFromSitemap();
        console.log(`Found ${routes.length} routes to prerender from sitemap.xml`);


        const isVercel = process.env.VERCEL === '1';
        let browser;

        if (isVercel) {
            console.log("Detecting Vercel Environment. Loading Sparticuz Chromium...");
            const puppeteerCore = (await import('puppeteer-core')).default;
            const chromium = (await import('@sparticuz/chromium')).default;
            
            browser = await puppeteerCore.launch({
                args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });
        } else {
            console.log("Detecting Local Environment. Loading Standard Puppeteer...");
            const puppeteer = (await import('puppeteer')).default;
            
            browser = await puppeteer.launch({
                headless: 'new', // Use new headless mode
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }


        for (const route of routes) {
            console.log(`Prerendering ${route} ...`);
            const page = await browser.newPage();

            // We wait for 'networkidle0' which means there are no more than 0 active network connections for at least 500ms
            // This ensures all React API calls, data fetching, and animations have finished executing.
            try {
                await page.goto(`http://localhost:${port}${route}`, {
                    waitUntil: 'networkidle0',
                    timeout: 45000
                });
            } catch (err) {
                console.error(`Timeout/Error while rendering ${route}. We will still try to save what was captured.`);
            }

            let html = await page.content();

            // Inject a meta tag so the client knows which route this HTML is for
            html = html.replace(
                '</head>',
                `  <meta name="prerender-path" content="${route}">\n</head>`
            );

            // Structure the output. 
            // e.g. /about -> dist/about/index.html
            let routeDir = route === '/' ? distDir : resolve(`dist${route}`);
            if (!fs.existsSync(routeDir)) {
                fs.mkdirSync(routeDir, { recursive: true });
            }

            fs.writeFileSync(path.join(routeDir, 'index.html'), html);
            await page.close();
        }

        await browser.close();
        server.close();
        console.log('✅ Pre-rendering complete! Your site is now optimized for Bing/Google crawl bots.');
        process.exit(0);
    });
})();
