#!/bin/bash

# Limpiar capturas de depuración previas
rm -f *.png

echo "--- ONVIO DOWNLOADER ---"
read -p "Ingrese el MES (ej. 02): " month
read -p "Ingrese el AÑO (ej. 2026): " year

if [[ -z "$month" || -z "$year" ]]; then
    echo "Error: El mes y el año son obligatorios."
    exit 1
fi

echo "Iniciando descargas para el periodo $month/$year..."

# Exportar variables para Playwright
export TARGET_MONTH=$month
export TARGET_YEAR=$year

# Ejecutar Playwright:
# --workers=1: Para que no se pisen las sesiones de Onvio
# --retries=0: Para que NO vuelva a empezar si hay un aviso
# --reporter=line: Para que el shell sea limpio y se cierre solo
CI=true npx playwright test tests/download_all.spec.js --project=chromium --workers=1 --retries=0 --reporter=line --timeout=3600000

echo "--- PROCESO FINALIZADO CON ÉXITO ---"
