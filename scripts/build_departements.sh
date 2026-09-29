#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
cd "${PROJECT_DIR}"
echo "============================================"
echo " Build départements"
echo "============================================"
echo ""; echo ">>> 1/2 Téléchargement"
bash scripts/fetch_departements.sh
echo ""; echo ">>> 2/2 Traitement"
python3 scripts/process_departements.py
