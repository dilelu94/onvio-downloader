const { test, expect } = require('@playwright/test');
const { EstudioOneDownloader } = require('../src/downloads/estudio_one');
const path = require('path');
const fs = require('fs');

const TARGET_MONTH = process.env.TARGET_MONTH;
const TARGET_YEAR = process.env.TARGET_YEAR;

if (!TARGET_MONTH || !TARGET_YEAR) {
  throw new Error('TARGET_MONTH and TARGET_YEAR are required.');
}

function loadCompanies() {
  const filePath = path.join(__dirname, '..', 'companies.txt');
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

function fileExistsFlexible(dir, type) {
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir);
  return files.some(f => f.toLowerCase().includes(type.toLowerCase()));
}

test('Download reports with strict retries and session renewal', async ({ browser }) => {
  const initialCompanies = loadCompanies();
  if (initialCompanies.length === 0) throw new Error('No companies found.');

  let queue = initialCompanies.map(c => ({ name: c, attempts: 0 }));
  let results = [];

  const desktopPath = path.join(process.env.HOME, 'Desktop');
  const mainDirName = `${TARGET_MONTH} ${TARGET_YEAR} sindicatos`;
  const baseDir = path.join(desktopPath, mainDirName);
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

  while (queue.length > 0) {
    const companyObj = queue.shift();
    const company = companyObj.name;
    const companyDir = path.join(baseDir, company.replace(/[^a-z0-9]/gi, '_'));
    
    // SKIP si ya existen ambos
    if (fileExistsFlexible(companyDir, 'Planilla') && fileExistsFlexible(companyDir, 'Informe')) {
      console.log(`[SKIP] ${company}`);
      results.push({ name: company, status: 'SKIPPED' });
      continue;
    }

    console.log(`\n=== PROCESSING: ${company} (Attempt ${companyObj.attempts + 1}/3) ===`);
    if (!fs.existsSync(companyDir)) fs.mkdirSync(companyDir, { recursive: true });

    const context = await browser.newContext({ storageState: fs.existsSync('auth.json') ? 'auth.json' : undefined });
    const page = await context.newPage();
    const downloader = new EstudioOneDownloader(page);

    try {
      await page.goto('https://onvio.com.ar/staff/#/', { timeout: 60000 });
      
      // AUTO-LOGIN
      if (!page.url().includes('staff')) {
        console.log('Logging in...');
        await page.getByRole('button', { name: 'Iniciar sesión' }).first().click().catch(() => {});
        await page.getByRole('textbox', { name: /correo/i }).fill(process.env.ONVIO_USER).catch(() => {});
        await page.getByRole('button', { name: /iniciar/i }).click().catch(() => {});
        await page.getByRole('textbox', { name: /contraseña/i }).fill(process.env.ONVIO_PASS).catch(() => {});
        await page.getByRole('button', { name: /iniciar/i }).click();
        await page.waitForURL(/.*staff.*/, { timeout: 60000 });
        await page.context().storageState({ path: 'auth.json' });
      }

      await downloader.navigateToSueldos();
      await downloader.selectEnterprise(company);
      
      await downloader.downloadPlanillaPDF(TARGET_MONTH, TARGET_YEAR, companyDir, company);
      await downloader.downloadInformeExcel(TARGET_MONTH, TARGET_YEAR, companyDir, company);

      results.push({ name: company, status: 'SUCCESS' });
      console.log(`=== COMPLETED: ${company} ===`);

    } catch (error) {
      console.error(`[ERROR] ${company}: ${error.message}`);
      
      if (companyObj.attempts < 2) { // Máximo 3 intentos (0, 1, 2)
        console.log(`[RETRY] Adding ${company} back to queue.`);
        companyObj.attempts++;
        queue.push(companyObj);
        
        // BORRAR SESIÓN si el error fue por lentitud
        if (error.message.includes('Timeout') || error.message.includes('open menu')) {
           console.log('Slowness detected. Clearing session for next retry.');
           if (fs.existsSync('auth.json')) fs.unlinkSync('auth.json');
        }
      } else {
        results.push({ name: company, status: 'FAILED', error: error.message });
      }
    } finally {
      await context.close();
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  // REPORTE FINAL
  const reportPath = path.join(baseDir, 'REPORTE_FINAL.txt');
  const reportContent = results.map(r => `${r.status.padEnd(10)} | ${r.name} ${r.error ? '('+r.error+')' : ''}`).join('\n');
  fs.writeFileSync(reportPath, `REPORTE FINAL - PERIODO ${TARGET_MONTH}/${TARGET_YEAR}\n\n${reportContent}`);
  console.log(`\nProcess finished. Results in: ${reportPath}`);
});
