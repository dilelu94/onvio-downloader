const { expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

class EstudioOneDownloader {
  constructor(page) {
    this.page = page;
    this.estudioPage = null;
  }

  async navigateToSueldos() {
    console.log('STEP 1: Opening Onvio Menu');
    await this.page.waitForLoadState('networkidle');
    try {
      await this.page.getByRole('link', { name: 'Menú' }).click({ timeout: 10000 });
      const pagePromise = this.page.waitForEvent('popup', { timeout: 15000 });
      await this.page.getByRole('link', { name: /Sueldos y Jornales/i }).click({ timeout: 10000 });
      this.estudioPage = await pagePromise;
      await this.estudioPage.waitForLoadState('load');
      console.log('Reached Estudio One');
    } catch (e) {
      console.error('Failed to open menu.');
      throw e;
    }
  }

  async selectEnterprise(companyName) {
    console.log(`STEP 2: Selecting Company (PRECISE MATCH) -> ${companyName}`);
    const page = this.estudioPage;
    await page.waitForTimeout(8000); 
    
    try {
      const searchBox = page.getByRole('textbox', { name: 'Buscar por Código, Razón' });
      await searchBox.waitFor({ state: 'visible', timeout: 60000 });
      await searchBox.click();
      await searchBox.fill(companyName);
      
      // ESPERAR A LAS SUGERENCIAS
      console.log('Waiting for suggestions...');
      await page.waitForTimeout(3000); 

      // Intentar encontrar el item exacto en la lista de sugerencias y hacerle click
      // Onvio suele usar listas de tipo autocomplete
      const suggestion = page.locator('.ui-autocomplete, .select2-results, .dropdown-menu')
                             .locator('li, div')
                             .filter({ hasText: new RegExp(`^${companyName}$`, 'i') })
                             .first();

      if (await suggestion.isVisible({ timeout: 5000 })) {
        console.log('Exact suggestion found, clicking it.');
        await suggestion.click();
      } else {
        console.log('Exact suggestion not found visually, using keyboard fallback but being specific.');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }

      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Aceptar' }).click({ force: true });
      
      // Esperar a que el modal realmente desaparezca para confirmar éxito
      await page.waitForSelector('.ui-dialog, .modal-backdrop', { state: 'hidden', timeout: 30000 });
      console.log('Company selection confirmed.');
    } catch (e) {
      console.error('Failed to select company precisely:', e.message);
      throw e;
    }
  }

  async downloadPlanillaPDF(month, year, downloadDir, companyName) {
    console.log(`[PDF] Planilla ${month}/${year}`);
    const page = this.estudioPage;

    const navigate = async () => {
      await page.getByRole('heading', { name: ' Reportes' }).click();
      await page.getByRole('link', { name: 'Planilla de Totales por Sector' }).first().click();
    };

    await navigate();
    if (page.url().includes('AGralEmpresas')) {
      console.log('[RECOVERY] Redirected to list. Re-selecting...');
      await this.selectEnterprise(companyName);
      await navigate();
    }

    await this.prepareParams(month, year, true);

    console.log('Clicking Emitir...');
    const dlPromise = page.waitForEvent('download', { timeout: 60000 });
    await page.getByRole('button', { name: 'Emitir' }).click();
    await page.waitForTimeout(10000);

    try {
      await page.locator('.iFramePpal').contentFrame().getByRole('menuitem', { name: 'Imprimir' }).click({ timeout: 10000 });
    } catch (e) {
      const frames = page.frames();
      for (const f of frames) {
        try { await f.getByRole('menuitem', { name: 'Imprimir' }).click({ timeout: 2000 }); break; } catch(err) {}
      }
    }

    const download = await dlPromise;
    await download.saveAs(path.join(downloadDir, `Planilla de Totales Generales.pdf`));
    console.log(`[SUCCESS] PDF saved.`);
  }

  async downloadInformeExcel(month, year, downloadDir, companyName) {
    console.log(`[EXCEL] Informe ${month}/${year}`);
    const page = this.estudioPage;

    const navigate = async () => {
      await page.getByRole('heading', { name: ' Reportes' }).click();
      await page.getByRole('link', { name: 'Informe de Liquidación' }).first().click();
    };

    await navigate();
    if (page.url().includes('AGralEmpresas')) {
      await this.selectEnterprise(companyName);
      await navigate();
    }

    await this.prepareParams(month, year, false);

    console.log('Clicking Emitir...');
    await page.getByRole('button', { name: 'Emitir' }).click();
    await page.waitForTimeout(10000);

    console.log('Opening Cubo...');
    const frame = page.locator('.iFramePpal').contentFrame();
    await frame.getByRole('tab', { name: 'Cubo' }).click({ timeout: 30000 });
    await page.waitForTimeout(5000);

    console.log('Deactivating subtotales...');
    try {
      await frame.locator('.bento-toggle-nob').click({ timeout: 5000 });
    } catch(e) {
      await frame.getByRole('img', { name: 'Cerrar sección' }).click().catch(() => {});
    }

    await page.waitForTimeout(3000);
    const dlPromise = page.waitForEvent('download', { timeout: 90000 });
    await frame.getByRole('menuitem', { name: 'Exportar' }).click();

    const download = await dlPromise;
    await download.saveAs(path.join(downloadDir, `Informe de Liquidacion.xlsx`));
    console.log(`[SUCCESS] Excel saved.`);
  }

  async prepareParams(month, year, hasPeriodField) {
    const page = this.estudioPage;
    const targetDate = `${month}/${year}`;
    
    if (hasPeriodField) {
      const period = `${month} ${year}`;
      const perInput = page.getByRole('textbox', { name: 'Período:' });
      await perInput.waitFor({ state: 'visible', timeout: 60000 });
      await perInput.fill(period);
      await page.waitForTimeout(1000);
    }

    await page.getByTitle('Seleccionar').click({ timeout: 20000 });
    await page.waitForTimeout(5000);

    console.log(`Ticking rows for: ${targetDate}`);
    const rows = page.getByRole('row');
    const count = await rows.count();
    let tickedCount = 0;
    
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = await row.innerText();
      if (text.includes(targetDate)) {
        const checkbox = row.getByRole('checkbox');
        if (await checkbox.count() > 0) {
          await checkbox.evaluate(node => { if (!node.checked) node.click(); });
          tickedCount++;
        }
      }
    }
    console.log(`Ticked ${tickedCount} rows.`);
    await page.getByRole('button', { name: 'Aceptar' }).click();
    await page.waitForTimeout(3000);
  }
}

module.exports = { EstudioOneDownloader };
