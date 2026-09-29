
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
source "${PROJECT_DIR}/config.env"

mkdir -p "${PROJECT_DIR}/data/raw"
OUTPUT="${PROJECT_DIR}/${RAW_FILE}"
TMPDIR="${PROJECT_DIR}/data/raw/tmp"
mkdir -p "${TMPDIR}"

LIMIT=100
OFFSET=0
TOTAL=999999

while [ "$OFFSET" -lt "$TOTAL" ]; do
    URL="${OFGL_API_BASE}/${OFGL_DATASET_REGIONS}/records?limit=${LIMIT}&offset=${OFFSET}"
    echo "[INFO] Offset ${OFFSET}..."
    curl -sSL --fail --retry 3 -H "Accept: application/json" \
        -o "${TMPDIR}/page_${OFFSET}.json" "${URL}"
    if [ "$OFFSET" -eq 0 ]; then
        TOTAL=$(python3 -c "import json; print(json.load(open('${TMPDIR}/page_0.json'))['total_count'])")
        echo "[INFO] Total à télécharger : ${TOTAL}"
    fi
    OFFSET=$((OFFSET + LIMIT))
done

python3 - <<PYEOF
import json, glob, os
files = sorted(
    glob.glob("${TMPDIR}/page_*.json"),
    key=lambda p: int(os.path.basename(p).replace("page_","").replace(".json",""))
)
all_records = []
total = 0
for f in files:
    with open(f, encoding="utf-8") as fh:
        d = json.load(fh)
        all_records.extend(d.get("results", []))
        total = d.get("total_count", total)
out = {"total_count": total, "results": all_records}
with open("${OUTPUT}", "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False)
print(f"[OK] {len(all_records)} records fusionnés sur {total}")
PYEOF

rm -rf "${TMPDIR}"
