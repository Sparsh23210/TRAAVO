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

    const server = app.listen(0, '127.0.0.1', async () => {
        const port = server.address().port;
        console.log(`Local static server started at http://127.0.0.1:${port}`);

        // 2. Discover routes to render
        const routes = extractUrlsFromSitemap();
        console.log(`Found ${routes.length} routes to prerender from sitemap.xml`);

        const isVercel = process.env.VERCEL === '1';
        let browser;

        try {
            if (isVercel) {
                console.log("--- VERCEL ENVIRONMENT DETECTED ---");
                console.log("Loading specialized Sparticuz Chromium binary...");
                const puppeteerCore = (await import('puppeteer-core')).default;
                const chromium = (await import('@sparticuz/chromium')).default;
                
                const executablePath = await chromium.executablePath();
                console.log(`Using Chromium executable at: ${executablePath}`);

                browser = await puppeteerCore.launch({
                    args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
                    defaultViewport: chromium.defaultViewport,
                    executablePath: executablePath,
                    headless: chromium.headless,
                    ignoreHTTPSErrors: true,
                });
            } else {
                console.log("--- LOCAL ENVIRONMENT DETECTED ---");
                const puppeteer = (await import('puppeteer')).default;
                
                browser = await puppeteer.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            }

            console.log("Browser launched successfully. Starting render loop...");

            for (const route of routes) {
                console.log(`Prerendering ${route} ...`);
                const page = await browser.newPage();

                try {
                    await page.goto(`http://127.0.0.1:${port}${route}`, {
                        waitUntil: 'networkidle0',
                        timeout: 30000
                    });

                    let html = await page.content();

                    // Inject a meta tag so the client knows which route this HTML is for
                    html = html.replace(
                        '</head>',
                        `  <meta name="prerender-path" content="${route}">\n</head>`
                    );

                    // Structure the output. 
                    let routeDir = route === '/' ? distDir : resolve(`dist${route}`);
                    if (!fs.existsSync(routeDir)) {
                        fs.mkdirSync(routeDir, { recursive: true });
                    }

                    fs.writeFileSync(path.join(routeDir, 'index.html'), html);
                } catch (err) {
                    console.error(`Skipping ${route} due to error:`, err.message);
                } finally {
                    await page.close();
                }
            }

            console.log('✅ Pre-rendering complete!');
        } catch (error) {
            console.error('❌ CRITICAL ERROR during pre-rendering stage:');
            console.error(error);
            
            if (isVercel) {
                console.warn('⚠️ Building in Vercel. Error ignored to avoid blocking deployment.');
            } else {
                process.exit(1);
            }
        } finally {
            if (browser) await browser.close();
            server.close();
            console.log('Static server shut down.');
            process.exit(0);
        }
    });
})();
