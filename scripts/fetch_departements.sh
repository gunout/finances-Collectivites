#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
source "${PROJECT_DIR}/config.env"

mkdir -p "${PROJECT_DIR}/data/raw"
OUTPUT="${PROJECT_DIR}/data/raw/departements_ofgl.csv"

URL="https://data.ofgl.fr/api/explore/v2.1/catalog/datasets/${OFGL_DATASET_DEPARTEMENTS}/exports/csv?delimiter=%3B&lang=fr"

echo "[INFO] Téléchargement CSV complet..."
if ! curl -sSL --fail --retry 3 -o "${OUTPUT}" "${URL}"; then
    echo "[ERROR] Échec du téléchargement"
    exit 1
fi

SIZE=$(du -h "${OUTPUT}" | cut -f1)
LINES=$(wc -l < "${OUTPUT}")
echo "[OK] ${OUTPUT} (${SIZE}, ${LINES} lignes)"
