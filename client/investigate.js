const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/no-train-ticket-guide-2026', { waitUntil: 'networkidle0' });
    
    // Take screenshot
    await page.screenshot({ path: 'artifacts/screenshot.png' });
    
    // Get HTML
    const html = await page.content();
    fs.writeFileSync('artifacts/page.html', html);
    
    // Also get the dimensions of some elements
    const dimensions = await page.evaluate(() => {
        const getRect = selector => {
            const el = document.querySelector(selector);
            return el ? el.getBoundingClientRect() : null;
        };
        return {
            seoContainer: getRect('.seo-page-container'),
            header: getRect('.seo-header'),
            contentCard: getRect('.seo-content-card'),
            background: getRect('canvas'),
            bodyBox: document.body.getBoundingClientRect()
        };
    });
    fs.writeFileSync('artifacts/dimensions.json', JSON.stringify(dimensions, null, 2));

    await browser.close();
})();
