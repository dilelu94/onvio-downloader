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
  await page.goto('https://onvio.com.ar/#/', { timeout: 60000 });

  // Click initial 'Iniciar sesión' button on the homepage
  const loginStartBtn = page.getByRole('button', { name: 'Iniciar sesión' }).first();
  try {
    await loginStartBtn.waitFor({ state: 'visible', timeout: 15000 });
    await loginStartBtn.click();
  } catch (e) {
    console.log('No "Iniciar sesión" button found, proceeding directly...');
  }

  console.log('Waiting for Email or Password input...');
  const emailInput = page.getByRole('textbox', { name: 'Correo electrónico' });
  const passInput = page.getByRole('textbox', { name: 'Contraseña' });
  
  // Wait for either the email input or the password input to become visible
  try {
    await Promise.any([
      emailInput.waitFor({ state: 'visible', timeout: 30000 }),
      passInput.waitFor({ state: 'visible', timeout: 30000 })
    ]);
  } catch (e) {
    console.log('Timeout waiting for login inputs. Proceeding anyway...');
  }

  if (await emailInput.isVisible()) {
    console.log('Entering email...');
    await emailInput.fill(user);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await passInput.waitFor({ state: 'visible', timeout: 15000 });
  }

  if (await passInput.isVisible()) {
    console.log('Entering password...');
    await passInput.click();
    await passInput.fill(pass);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  }

  // MFA CHECK: Onvio usually asks for a code
  console.log('Checking for MFA / Security Code screen...');
  
  try {
    // Look for common MFA indicators
    const mfaInput = page.locator('input[name="code"], .mfa-input, input[id*="code"]').first();
    if (await mfaInput.isVisible({ timeout: 10000 })) {
        console.log('MFA detected. Awaiting manual intervention if needed, but in CI we hope it is not required or handled via session.');
    }
  } catch (e) {
    console.log('MFA screen not detected or timed out, proceeding...');
  }

  // After MFA or if none, wait for the dashboard or staff page
  console.log('Waiting for the Dashboard or Staff page to load...');
  await page.waitForURL(/.*(dashboard|staff).*/i, { timeout: 90000 });
  
  // Wait a bit for the page to settle
  await page.waitForLoadState('networkidle');
  
  // Save storage state to reuse the session
  await page.context().storageState({ path: 'auth.json' });
  console.log('Session saved to auth.json');
}

module.exports = { login };
