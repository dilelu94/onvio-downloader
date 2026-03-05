const { expect } = require('@playwright/test');
const path = require('path');

/**
 * Download "Planilla de totales por sector" (PDF)
 * @param {import('@playwright/test').Page} page
 */
async function downloadPlanillaTotales(page) {
  console.log('Navigating to: Gestión -> Planilla de totales por sector');
  
  // Navigate through the menu
  // Onvio menus are often clickable text or icons
  await page.click('text=Gestión');
  await page.waitForTimeout(1000); // Wait for menu expansion
  await page.click('text=Planilla de totales por sector');

  // Wait for the report page to load
  await page.waitForLoadState('networkidle');

  // Logic to trigger the PDF download
  // Usually involves clicking a "Descargar" or "Imprimir" button
  console.log('Triggering PDF download...');
  const downloadPromise = page.waitForEvent('download');
  
  // Try to find a download or export button for PDF
  const downloadBtn = page.locator('button:has-text("Descargar"), button:has-text("Exportar"), .icon-download, [title*="PDF"]');
  await downloadBtn.first().click();
  
  const download = await downloadPromise;
  const fileName = 'planilla_totales_generales.pdf';
  const filePath = path.join(process.cwd(), fileName);
  await download.saveAs(filePath);
  console.log(`Report saved to: ${filePath}`);
}

/**
 * Download "Informe de Liquidacion" (Excel/Cubo)
 * @param {import('@playwright/test').Page} page
 */
async function downloadInformeLiquidacion(page) {
  console.log('Navigating to: Gestión -> Informe de Liquidación');
  
  // Go back to Gestión or find the menu
  await page.click('text=Gestión');
  await page.waitForTimeout(1000);
  await page.click('text=Informe de Liquidación');

  // Wait for the report page to load
  await page.waitForLoadState('networkidle');

  console.log('Triggering Excel download...');
  const downloadPromise = page.waitForEvent('download');
  
  // Try to find an Excel export button
  const excelBtn = page.locator('button:has-text("Excel"), [title*="Excel"], button:has-text("Exportar")');
  await excelBtn.first().click();
  
  const download = await downloadPromise;
  const fileName = 'informe_liquidacion.xlsx';
  const filePath = path.join(process.cwd(), fileName);
  await download.saveAs(filePath);
  console.log(`Report saved to: ${filePath}`);
}

module.exports = { downloadPlanillaTotales, downloadInformeLiquidacion };
