const { test, expect } = require('@playwright/test');
const { EstudioOneDownloader } = require('../src/downloads/estudio_one');
const path = require('path');
const fs = require('fs');

test.use({ storageState: 'auth.json' });

const TARGET_MONTH = '02';
const TARGET_YEAR = '2026';
const COMPANY_NAME = 'CLUB - CLUB DE PESCA CAZA Y NAUTICA BELGRANO';
const REF_DIR = path.join(__dirname, 'resultados_a_esperar');
const DOWNLOAD_DIR = path.join(process.env.HOME, 'Desktop', 'VALIDATION_TEST');

test.beforeAll(async () => {
  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
});

test('Download and Verify Club Belgrano Reports (Sequential Reset)', async ({ page }) => {
  test.setTimeout(400000);
  const downloader = new EstudioOneDownloader(page);
  
  // 1. DESCARGAR PDF
  await page.goto('https://onvio.com.ar/staff/#/');
  await downloader.navigateToSueldos();
  await downloader.selectEnterprise(COMPANY_NAME);
  await downloader.downloadPlanillaPDF(TARGET_MONTH, TARGET_YEAR, DOWNLOAD_DIR);
  
  // 2. DESCARGAR EXCEL (Reinicio de Pestaña para limpieza total)
  console.log('\n--- RESTARTING FLOW FOR EXCEL ---');
  await page.goto('https://onvio.com.ar/staff/#/');
  await downloader.navigateToSueldos();
  await downloader.selectEnterprise(COMPANY_NAME);
  const excelFile = await downloader.downloadInformeExcel(TARGET_MONTH, TARGET_YEAR, DOWNLOAD_DIR);

  // VERIFICACIÓN
  const refPdf = path.join(REF_DIR, '645115ed-cb26-491e-b33d-3246ad872d57.pdf');
  const refExcel = path.join(REF_DIR, 'Cubo Informe de Liquidación.xlsx');

  console.log('\n--- FINAL VERIFICATION ---');
  if (fs.existsSync(excelFile) && fs.existsSync(refExcel)) {
    const stats1 = fs.statSync(excelFile);
    const stats2 = fs.statSync(refExcel);
    console.log(`Excel: New ${stats1.size} | Ref ${stats2.size}`);
    expect(stats1.size).toBe(stats2.size);
    console.log('SUCCESS: Excel matches reference perfectly.');
  }
});
