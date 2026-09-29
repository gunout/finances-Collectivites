#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
cd "${PROJECT_DIR}"
echo "============================================"
echo " Build du dashboard régions"
echo "============================================"
echo ""; echo ">>> 1/2 Téléchargement"
bash scripts/fetch_ofgl.sh
echo ""; echo ">>> 2/2 Traitement"
python3 scripts/process_data.py
echo ""
echo "Pour lancer : python3 -m http.server 8000"
echo "Puis ouvrir : http://localhost:8000"
