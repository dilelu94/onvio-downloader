const { test, expect } = require('@playwright/test');
const { downloadPlanillaTotales, downloadInformeLiquidacion } = require('../src/downloads/reports');
const fs = require('fs');

test.use({ storageState: 'auth.json' });

test('Download Onvio reports', async ({ page }) => {
  // If auth.json doesn't exist, we should probably run the login test first
  if (!fs.existsSync('auth.json')) {
    throw new Error('auth.json not found. Please run "npx playwright test auth.spec.js --headed" first to log in.');
  }

  // Navigate directly to the main portal
  await page.goto('https://onvio.com.ar/staff/#/');
  await page.waitForLoadState('networkidle');

  // Try to download the first report
  try {
    await downloadPlanillaTotales(page);
  } catch (error) {
    console.error('Failed to download Planilla de Totales:', error.message);
  }

  // Try to download the second report
  try {
    await downloadInformeLiquidacion(page);
  } catch (error) {
    console.error('Failed to download Informe de Liquidación:', error.message);
  }
});
