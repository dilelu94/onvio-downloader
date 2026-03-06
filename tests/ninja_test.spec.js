const { test, expect } = require('@playwright/test');
const { EstudioOneDownloader } = require('../src/downloads/estudio_one');
const { login } = require('../src/auth/login');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

test('Test Ninja Blob Extraction - CLUB', async ({ browser }) => {
  const TARGET_MONTH = '02';
  const TARGET_YEAR = '2026';
  const COMPANY = 'CLUB - CLUB DE PESCA CAZA Y NAUTICA BELGRANO';
  
  const downloadDir = path.join(__dirname, '../test-results/ninja_test');
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  const context = await browser.newContext({ 
    storageState: fs.existsSync('auth.json') ? 'auth.json' : undefined 
  });
  const page = await context.newPage();
  const downloader = new EstudioOneDownloader(page);

  try {
    console.log('Performing login flow...');
    await login(page);

    await downloader.navigateToSueldos();
    await downloader.selectEnterprise(COMPANY);
    
    // Test the new Ninja Extraction method
    await downloader.downloadPlanillaPDF(TARGET_MONTH, TARGET_YEAR, downloadDir, COMPANY);

    const expectedFile = path.join(downloadDir, 'Planilla de Totales Generales.pdf');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
    console.log('Verification Success: PDF file exists at', expectedFile);

  } finally {
    await context.close();
  }
});
