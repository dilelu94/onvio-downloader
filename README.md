# Onvio Downloader Automation

This script automates the download of specific reports from Thomson Reuters Onvio/Estudio One.

## Reports Downloaded
- **Planilla de Totales Generales.pdf**: Downloaded from the "Planilla de Totales por Sector" menu, targeting the totals section.
- **Informe de Liquidacion.xlsx**: Downloaded using the "Cubo" export method without subtotals.

## Setup

1. **Credentials:** Create a `.env` file in the root directory with:
   ```env
   ONVIO_USER=your_email
   ONVIO_PASS=your_password
   ```

2. **Company List:** Create a `companies.txt` file in the root directory. Add one company name per line.
   *Note: This file is ignored by Git for security.*

## Usage

Run the interactive launcher:
```bash
./run.sh
```
The script will prompt for the target Month and Year (e.g., 02 2026).

## Features
- **Retry Queue**: Failed downloads due to slowness are retried automatically.
- **Clean Restart**: Resets the interface between each company for maximum stability.
- **Final Report**: Generates a `REPORTE_FINAL.txt` summary on your Desktop.
