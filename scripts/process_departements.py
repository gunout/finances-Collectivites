#!/usr/bin/env python3
"""Traitement des données OFGL départements — CSV."""

import csv
import json
import os
from collections import defaultdict
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
RAW_FILE = os.path.join(PROJECT_DIR, "data/raw/departements_ofgl.csv")
OUTPUT_FILE = os.path.join(PROJECT_DIR, "data/processed/departements_finances.json")
META_FILE = os.path.join(PROJECT_DIR, "data/processed/departements_metadata.json")

ANNEES = ["2023", "2024", "2025"]

# Mapping agrégat OFGL → clé normalisée (noms exacts du CSV)
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
    "Dépenses d'intervention":                 "depenses_intervention",
    "Subventions reçues et participations":    "subventions_recues",
    "Allocations APA":                         "apa",
    "Allocations RSA":                         "rsa",
    "Droits de mutation":                      "dmto",
    "Dotation globale de fonctionnement":      "dgf",
}


def load_csv():
    with open(RAW_FILE, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f, delimiter=";"))


def parse_records(rows):
    data = defaultdict(lambda: defaultdict(dict))
    noms = {}
    pops = {}

    for row in rows:
        annee = row.get("exer", "").strip()
        if annee not in ANNEES:
            continue

        code = row.get("dep_code", "").strip()
        if not code:
            continue
        if len(code) == 1:
            code = "0" + code

        agregat = row.get("agregat", "").strip()
        cle = AGREGATS_MAP.get(agregat)
        if not cle:
            continue

        noms[code] = row.get("dep_name", "").strip()

        try:
            pop = int(float(row.get("ptot", "0") or 0))
            if pop > 0:
                pops[code] = pop
        except (ValueError, TypeError):
            pass

        try:
            montant = float(row.get("montant", "0") or 0)
            data[code][annee][cle] = montant
        except (ValueError, TypeError):
            pass

        try:
            montant_hab = float(row.get("euros_par_habitant", "0") or 0)
            data[code][annee][f"{cle}_par_hab"] = montant_hab
        except (ValueError, TypeError):
            pass

    return data, noms, pops


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


def build_dataset(rows):
    pivoted, noms, pops = parse_records(rows)
    departements = {}

    for code in sorted(pivoted.keys()):
        annees_data = []
        for annee in sorted(pivoted[code].keys()):
            entry = dict(pivoted[code][annee])
            entry["annee"] = int(annee)
            if code in pops:
                entry["population"] = pops[code]
            entry = compute_ratios(entry)
            annees_data.append(entry)

        departements[code] = {
            "code": code,
            "nom": noms.get(code, code),
            "donnees": annees_data,
        }

    return {
        "meta": {
            "source": "OFGL / DGFiP",
            "dataset": "ofgl-base-departements-consolidee",
            "date_extraction": datetime.now().isoformat(),
            "nb_departements": len(departements),
            "annees": ANNEES,
        },
        "regions": departements,
    }


def main():
    print("[INFO] Chargement du CSV...")
    rows = load_csv()
    print(f"[INFO] {len(rows)} lignes")
    print("[INFO] Pivot...")
    dataset = build_dataset(rows)
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(dataset["meta"], f, ensure_ascii=False, indent=2)
    print(f"[OK] {OUTPUT_FILE}")
    print(f"[OK] {dataset['meta']['nb_departements']} départements traités")
    for code, r in list(dataset["regions"].items())[:5]:
        annees = [d["annee"] for d in r["donnees"]]
        print(f"     {code} {r['nom']} : {annees}")
    if len(dataset["regions"]) > 5:
        print(f"     ... et {len(dataset['regions']) - 5} autres")


if __name__ == "__main__":
    main()