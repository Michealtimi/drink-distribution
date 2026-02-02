// Quick check: is Playwright's Chromium installed and what version?
const { chromium } = require('playwright');

chromium
  .launch({ headless: true })
  .then(async (browser) => {
    const version = await browser.version();
    console.log('Chromium installed:', browser.executablePath());
    console.log('Chromium version:', version);
    await browser.close();
    console.log('OK – Playwright Chromium is working.');
  })
  .catch((err) => {
    console.error('Chromium not installed or error:', err.message);
    console.log('Run: pnpm pw');
    process.exit(1);
  });
