# Dashboard Santé Financière des Régions

Dashboard interactif présentant les comptes financiers des **13 régions métropolitaines** françaises, à partir des données ouvertes de l'OFGL (Observatoire des Finances et de la Gestion publique Locales) et de la DGFiP.

## Structure du projet

    dashboard-regions-finances/
    ├── config.env              Configuration (API, régions, chemins)
    ├── index.html              Page principale
    ├── README.md
    ├── css/
    │   └── style.css           Styles
    ├── js/
    │   └── app.js              Logique du dashboard
    ├── scripts/
    │   ├── fetch_ofgl.sh       Téléchargement des données
    │   ├── process_data.py     Traitement et calcul des ratios
    │   └── build.sh            Pipeline complet
    ├── data/
    │   ├── raw/                Données brutes OFGL
    │   └── processed/          Données consolidées JSON
    ├── assets/
    │   ├── icons/
    │   └── maps/
    └── docs/

## Utilisation

### 1. Pipeline complet

    ./scripts/build.sh

### 2. Étape par étape

    ./scripts/fetch_ofgl.sh
    python3 scripts/process_data.py

### 3. Lancer le serveur local

    python3 -m http.server 8000

Puis ouvrir http://localhost:8000

## Sources de données

- **OFGL** : https://data.ofgl.fr
- **Dataset** : donnees_carto_regions
- **DGFiP** : balances comptables des collectivités

## Indicateurs (ratios légaux R2313-1 CGCT)

- Dépenses réelles de fonctionnement / population
- Recettes réelles de fonctionnement / population
- Encours de dette / population
- Épargne brute / recettes
- Délai de désendettement (années)

## Les 13 régions métropolitaines

| Code | Région |
|------|--------|
| 11 | Île-de-France |
| 24 | Centre-Val de Loire |
| 27 | Bourgogne-Franche-Comté |
| 28 | Normandie |
| 32 | Hauts-de-France |
| 44 | Grand Est |
| 52 | Pays de la Loire |
| 53 | Bretagne |
| 75 | Nouvelle-Aquitaine |
| 76 | Occitanie |
| 84 | Auvergne-Rhône-Alpes |
| 93 | Provence-Alpes-Côte d'Azur |
| 94 | Corse |

## Licence

Données publiques — République Française.
