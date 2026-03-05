const { test, expect } = require('@playwright/test');
const { EstudioOneDownloader } = require('../src/downloads/estudio_one');
const path = require('path');
const fs = require('fs');

test.use({ storageState: 'auth.json' });

const TARGET_MONTH = '02';
const TARGET_YEAR = '2026';

test('Record Excel steps after PDF success', async ({ page }) => {
  test.setTimeout(600000); 

  const downloader = new EstudioOneDownloader(page);
  const desktopPath = path.join(process.env.HOME, 'Desktop');
  const mainDirName = `${TARGET_MONTH} ${TARGET_YEAR} sindicatos`;
  const baseDir = path.join(desktopPath, mainDirName);
  const companyDir = path.join(baseDir, 'CLUB_DE_PESCA_CAZA_Y_NAUTICA_BELGRANO');
  
  if (!fs.existsSync(companyDir)) fs.mkdirSync(companyDir, { recursive: true });

  const companyName = 'CLUB DE PESCA CAZA Y NAUTICA BELGRANO';

  // 1. DESCARGAR PDF (Flujo Automático)
  await page.goto('https://onvio.com.ar/staff/#/');
  await downloader.navigateToSueldos();
  await downloader.selectEnterprise(companyName);
  await downloader.downloadPlanillaPDF(TARGET_MONTH, TARGET_YEAR, companyDir);
  
  // 2. PAUSA PARA GRABACIÓN MANUAL
  console.log('\n--- PDF DOWNLOADED SUCCESSFULLY ---');
  console.log('El script está pausado. Por favor:');
  console.log('1. Ve al Playwright Inspector.');
  console.log('2. Dale a RECORD.');
  console.log('3. Haz los pasos del Excel manualmente.');
  console.log('4. Pégame el código aquí.');
  
  await page.pause();
});
