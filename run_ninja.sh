#!/bin/bash
# Script para correr el Onvio Downloader en segundo plano "real" (Xvfb)
# Esto permite que el visor de PDF de Chromium funcione pero sin mostrar ventanas.

# 1. Asegurarnos de que las dependencias de sistema estén (Xvfb)
if ! command -v xvfb-run &> /dev/null
then
    echo "ERROR: 'xvfb-run' no está instalado. Instalalo con: sudo dnf install xorg-x11-server-Xvfb (Fedora) o sudo apt install xvfb (Ubuntu/Debian)"
    exit 1
fi

# 2. Variables de entorno (puedes pasarlas al ejecutar el script)
MONTH=${TARGET_MONTH:-02}
YEAR=${TARGET_YEAR:-2026}

echo "[INFO] Iniciando descarga para el periodo $MONTH/$YEAR en segundo plano virtual..."

# 3. Ejecutar Playwright dentro del buffer de pantalla virtual
# -a: Busca un display libre automáticamente
# -s: Configuración de la resolución de pantalla virtual
xvfb-run -a -s "-screen 0 1280x1024x24" npx playwright test tests/ninja_test.spec.js --project=chromium --reporter=list

echo "[FIN] Proceso terminado. Revisa la carpeta test-results/ninja_test/"
