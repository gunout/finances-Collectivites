#!/usr/bin/env python3
"""
Traitement des données OFGL — structure longue pivotée.
"""

import json
import os
import sys
from collections import defaultdict
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

RAW_FILE = os.path.join(PROJECT_DIR, "data/raw/regions_ofgl_raw.json")
OUTPUT_FILE = os.path.join(PROJECT_DIR, "data/processed/regions_finances.json")
META_FILE = os.path.join(PROJECT_DIR, "data/processed/metadata.json")

# Type de budget à retenir
TYPE_BUDGET = "Budget consolidé"

# 13 régions métropolitaines
REGIONS_METRO = {
    "11": "Île-de-France",
    "24": "Centre-Val de Loire",
    "27": "Bourgogne-Franche-Comté",
    "28": "Normandie",
    "32": "Hauts-de-France",
    "44": "Grand Est",
    "52": "Pays de la Loire",
    "53": "Bretagne",
    "75": "Nouvelle-Aquitaine",
    "76": "Occitanie",
    "84": "Auvergne-Rhône-Alpes",
    "93": "Provence-Alpes-Côte d'Azur",
    "94": "Corse",
}

# Mapping agrégat OFGL → clé normalisée du dashboard
AGREGATS_MAP = {
    "Recettes de fonctionnement":              "recettes_fonctionnement",
    "Dépenses de fonctionnement":              "depenses_fonctionnement",
    "Epargne brute":                           "epargne_brute",
    "Epargne nette":                           "epargne_nette",
    "Epargne de gestion":                      "epargne_gestion",
    "Encours de dette":                        "dette",
    "Dépenses d'équipement":                   "investissement",
    "Dépenses d'investissement":               "depenses_investissement",
    "Recettes d'investissement":               "recettes_investissement",
    "Recettes d'investissement hors emprunts": "recettes_invest_hors_emprunts",
    "Frais de personnel":                      "personnel",
    "Achats et charges externes":              "achats",
    "Charges financières":                     "charges_financieres",
    "Annuité de la dette":                     "annuite_dette",
    "Impôts locaux":                           "impots_locaux",
    "Impôts et taxes":                         "impots_taxes",
    "Concours de l'Etat":                      "dotations_etat",
    "TVA":                                     "tva",
    "TICPE":                                   "ticpe",
    "Dépenses totales":                        "depenses_totales",
    "Recettes totales":                        "recettes_totales",
    "Fonds de roulement":                      "fonds_roulement",
    "Capacité ou besoin de financement":       "capacite_financement",
    "Dépenses d'intervention":                 "depenses_intervention",
    "Subventions reçues et participations":    "subventions_recues",
    "Péréquations et compensations fiscales":  "perequations",
    "DRES":                                    "dres",
}

ANNEES = ["2023", "2024", "2025"]


def load_raw():
    if not os.path.exists(RAW_FILE):
        print(f"[ERROR] Fichier introuvable : {RAW_FILE}")
        sys.exit(1)
    with open(RAW_FILE, encoding="utf-8") as f:
        return json.load(f)


def parse_records(records):
    data = defaultdict(lambda: defaultdict(dict))

    for rec in records:
        code = rec.get("insee")
        if code not in REGIONS_METRO:
            continue
        if rec.get("type") != TYPE_BUDGET:
            continue

        agregat = rec.get("agregat")
        cle = AGREGATS_MAP.get(agregat)
        if not cle:
            continue

        for annee in ANNEES:
            montant = rec.get(f"m_{annee}")
            montant_hab = rec.get(f"m_hab_{annee}")

            if montant is not None:
                data[code][annee][cle] = montant
            if montant_hab is not None:
                data[code][annee][f"{cle}_par_hab"] = montant_hab

    return data


def compute_ratios(entry):
    rec = entry.get("recettes_fonctionnement")
    dep = entry.get("depenses_fonctionnement")
    dette = entry.get("dette")
    epargne = entry.get("epargne_brute")
    personnel = entry.get("personnel")

    if rec and dette:
        entry["taux_endettement"] = round(dette / rec * 100, 2)
    if rec and epargne:
        entry["taux_epargne"] = round(epargne / rec * 100, 2)
    if dep and personnel:
        entry["part_personnel"] = round(personnel / dep * 100, 2)
    if rec and dep:
        entry["solde_fonctionnement"] = round(rec - dep, 2)
    if epargne and dette:
        entry["delai_desendettement"] = round(dette / epargne, 2)

    return entry


def build_dataset(raw):
    records = raw.get("results", [])
    pivoted = parse_records(records)

    regions = {}
    for code, nom in REGIONS_METRO.items():
        if code not in pivoted:
            print(f"[WARN] Aucune donnée pour {code} — {nom}")
            continue

        annees_data = []
        for annee in sorted(pivoted[code].keys()):
            entry = dict(pivoted[code][annee])
            entry["annee"] = int(annee)
            rf = entry.get("recettes_fonctionnement")
            rf_hab = entry.get("recettes_fonctionnement_par_hab")
            if rf and rf_hab:
                entry["population"] = int(round(rf / rf_hab))
            entry = compute_ratios(entry)
            annees_data.append(entry)

        regions[code] = {
            "code": code,
            "nom": nom,
            "donnees": annees_data,
        }

    return {
        "meta": {
            "source": "OFGL / DGFiP",
            "dataset": "donnees_carto_regions",
            "type_budget": TYPE_BUDGET,
            "date_extraction": datetime.now().isoformat(),
            "nb_regions": len(regions),
            "annees": ANNEES,
        },
        "regions": regions,
    }


def main():
    print("[INFO] Chargement des données brutes...")
    raw = load_raw()
    print(f"[INFO] {len(raw.get('results', []))} records à traiter...")

    print("[INFO] Pivot de la structure longue...")
    dataset = build_dataset(raw)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(dataset["meta"], f, ensure_ascii=False, indent=2)

    print(f"[OK] {OUTPUT_FILE}")
    print(f"[OK] {dataset['meta']['nb_regions']} régions traitées")
    for code, r in dataset["regions"].items():
        annees = [d["annee"] for d in r["donnees"]]
        print(f"     {code} {r['nom']} : {annees}")


if __name__ == "__main__":
    main()