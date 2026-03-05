const { expect } = require('@playwright/test');
require('dotenv').config();

/**
 * Perform login to Onvio
 * @param {import('@playwright/test').Page} page
 */
async function login(page) {
  const user = process.env.ONVIO_USER;
  const pass = process.env.ONVIO_PASS;

  if (!user || !pass) {
    throw new Error('Please set ONVIO_USER and ONVIO_PASS in your .env file');
  }

  console.log('Navigating to Onvio login page...');
  // Regional Onvio URL for Argentina
  await page.goto('https://onvio.com.ar/');

  // Initial redirect usually takes us to the login page
  // We'll wait for the email/username input
  await page.waitForSelector('input[name="username"], input[type="email"]');
  await page.fill('input[name="username"], input[type="email"]', user);
  await page.click('button[type="submit"], #next-btn, .btn-primary');

  // Wait for password field
  await page.waitForSelector('input[name="password"], input[type="password"]');
  await page.fill('input[name="password"], input[type="password"]', pass);
  await page.click('button[type="submit"], #login-btn, .btn-primary');

  // MFA CHECK: Onvio usually asks for a code
  // We'll wait to see if the MFA screen appears
  console.log('Checking for MFA / Security Code screen...');
  
  // If the MFA screen appears, we pause to let the user enter it
  // This is where you manually enter the code and then click Resume in Playwright Inspector
  try {
    // Look for common MFA indicators like "Security Code" or "Código de Seguridad"
    await page.waitForSelector('input[name="code"], .mfa-input, text=Código de Seguridad', { timeout: 10000 });
    console.log('MFA detected. Please enter the code in the browser and then resume the script.');
    await page.pause();
  } catch (e) {
    console.log('MFA screen not detected within 10s, proceeding...');
  }

  // After MFA or if none, wait for the dashboard or staff page
  console.log('Waiting for the Dashboard or Staff page to load...');
  // We'll wait for common indicators of success in Onvio
  await page.waitForURL(/.*(dashboard|staff).*/i, { timeout: 60000 });
  
  // Wait a bit for the page to settle
  await page.waitForLoadState('networkidle');
  
  // Save storage state to reuse the session
  await page.context().storageState({ path: 'auth.json' });
  console.log('Session saved to auth.json');
}

module.exports = { login };
