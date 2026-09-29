<div align="center">

# 🇫🇷 Santé Financière des Collectivités

**Dashboard interactif des comptes financiers des 13 régions et 97 départements français**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/fr/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/fr/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/fr/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)](https://www.chartjs.org/)

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-222222?style=for-the-badge&logo=github)](https://gunout.github.io/finances-Collectivites/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Data](https://img.shields.io/badge/Data-OFGL%20%2F%20DGFiP-000091?style=for-the-badge)](https://data.ofgl.fr/)

[🔗 **Voir le dashboard en ligne**](https://gunout.github.io/finances-Collectivites/) · [📊 **Source des données**](https://data.ofgl.fr/) · [🐛 **Signaler un bug**](https://github.com/gunout/finances-Collectivites/issues)

</div>

---

## 📋 Présentation

Dashboard web statique présentant l'analyse financière des **collectivités territoriales françaises** à partir des données ouvertes officielles de l'**OFGL** (Observatoire des Finances et de la Gestion publique Locales) et de la **DGFiP** (Direction générale des finances publiques).

Il permet de visualiser, comparer et analyser les comptes consolidés des :

- **13 régions métropolitaines** (2012-2025)
- **97 départements** (métropole + DOM, 2023-2025)

---

## ✨ Fonctionnalités

### 🏛️ Vue par entité

- Sélection interactive parmi 13 régions ou 97 départements
- Statistiques clés : population, recettes, dépenses, dette, épargne brute
- Graphiques d'évolution temporelle (recettes / dépenses / investissement)
- Structure des recettes et des dépenses (camemberts)
- Suivi de la dette et de l'épargne
- Tableau détaillé par année
- Analyse automatique avec diagnostic (endettement, épargne, solde)

### 📊 Comparaison

- **Radar comparatif** de 2 à 3 collectivités sur 6 axes financiers
- **Carte de France** interactive (mode régions)
- **Tableau comparatif triable** sur 10 indicateurs
- **Export CSV** des données pour analyse externe

### 🎨 Design

- Charte **Marianne** officielle de l'État français (bleu #000091, rouge #E1000F)
- Police **Marianne** (Système de Design de l'État)
- Responsive (mobile, tablette, desktop)
- Bandeau tricolore et devise républicaine

---

## 🚀 Démo en ligne

👉 **[https://gunout.github.io/finances-Collectivites/](https://gunout.github.io/finances-Collectivites/)**

---

## 🛠️ Installation locale

### Prérequis

- Python 3.8+ (pour le serveur HTTP local et les scripts de traitement)
- Un navigateur web moderne
- curl ou wget (pour télécharger les données)

### Clone du dépôt

    git clone https://github.com/gunout/finances-Collectivites.git
    cd finances-Collectivites

### Lancement rapide

Les données traitées sont déjà incluses dans le dépôt (`data/processed/`). Il suffit de lancer un serveur local :

    python3 -m http.server 8000

Puis ouvrir http://localhost:8000 dans le navigateur.

> ⚠️ Un serveur HTTP est requis car le dashboard charge des fichiers JSON via `fetch()`, ce qui ne fonctionne pas en `file://`.

---

## 🔄 Mise à jour des données

Le projet inclut des scripts shell et Python pour retélécharger et retraiter les données depuis les sources officielles.

### Régions

    ./scripts/build.sh

1. `scripts/fetch_ofgl.sh` — télécharge les comptes des régions depuis l'API OFGL
2. `scripts/process_data.py` — pivote, filtre, calcule les ratios → `data/processed/regions_finances.json`

### Départements

    ./scripts/build_departements.sh

1. `scripts/fetch_departements.sh` — télécharge le CSV complet des départements
2. `scripts/process_departements.py` — pivote, filtre, calcule les ratios → `data/processed/departements_finances.json`

---

## 📁 Structure du projet

    finances-Collectivites/
    ├── index.html                       # Page principale
    ├── css/
    │   └── style.css                    # Charte Marianne
    ├── js/
    │   └── app.js                       # Logique du dashboard
    ├── data/
    │   ├── raw/                         # Données brutes (ignorées par Git)
    │   └── processed/                   # Données JSON consolidées
    │       ├── regions_finances.json
    │       ├── regions_metadata.json
    │       ├── departements_finances.json
    │       └── departements_metadata.json
    ├── scripts/
    │   ├── fetch_ofgl.sh                # Téléchargement régions
    │   ├── process_data.py              # Traitement régions
    │   ├── fetch_departements.sh        # Téléchargement départements
    │   ├── process_departements.py      # Traitement départements
    │   ├── build.sh                     # Pipeline régions
    │   └── build_departements.sh        # Pipeline départements
    ├── config.env                       # Configuration API
    └── README.md

---

## 📊 Sources de données

| Source | Description | Lien |
|--------|-------------|------|
| **OFGL** | Observatoire des Finances et de la Gestion publique Locales | [data.ofgl.fr](https://data.ofgl.fr/) |
| **DGFiP** | Direction générale des finances publiques | [economie.gouv.fr](https://www.economie.gouv.fr/dgfip) |
| **INSEE** | Populations légales | [insee.fr](https://www.insee.fr/) |

### Jeux de données utilisés

- `donnees_carto_regions` — Comptes consolidés des régions
- `ofgl-base-departements-consolidee` — Comptes consolidés des départements

---

## 📐 Indicateurs calculés

### Indicateurs bruts

- Recettes de fonctionnement
- Dépenses de fonctionnement
- Épargne brute, nette, de gestion
- Encours de dette
- Dépenses d'équipement
- Frais de personnel
- Achats et charges externes
- Charges financières
- Annuité de la dette
- Impôts et taxes
- TVA, TICPE, DGF
- Allocations APA et RSA (départements)

### Ratios dérivés

- **Taux d'endettement** = Dette / Recettes de fonctionnement
- **Taux d'épargne** = Épargne brute / Recettes de fonctionnement
- **Part du personnel** = Frais de personnel / Dépenses de fonctionnement
- **Solde de fonctionnement** = Recettes − Dépenses de fonctionnement
- **Délai de désendettement** = Dette / Épargne brute (en années)
- **Ratios par habitant** pour chaque indicateur

---

## 🎨 Charte graphique

Ce projet respecte la **charte Marianne** de l'État français :

| Élément | Valeur |
|---------|--------|
| Bleu France | `#000091` |
| Rouge Marianne | `#E1000F` |
| Bleu clair | `#6A6AF4` |
| Gris texte | `#161616` |
| Gris clair | `#666666` |
| Police | **Marianne** (DSFR) |
| Devise | *Liberté · Égalité · Fraternité* |

Référence : [Système de Design de l'État](https://www.systeme-de-design.gouv.fr/)

---

## 🧰 Stack technique

| Technologie | Usage |
|-------------|-------|
| **HTML5** | Structure du dashboard |
| **CSS3** | Mise en page (charte Marianne) |
| **JavaScript** (vanilla) | Logique applicative |
| **Chart.js 4.4** | Graphiques (lignes, camemberts, radar, barres) |
| **SVG** | Carte des régions |
| **Python 3** | Scripts de traitement des données |
| **Bash** | Pipeline de téléchargement |
| **GitHub Pages** | Hébergement statique |

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour proposer une amélioration :

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/amelioration`)
3. Commitez (`git commit -m "Ajout de..."`)
4. Poussez (`git push origin feature/amelioration`)
5. Ouvrez une **Pull Request**

### Idées d'amélioration

- [ ] Ajout des EPCI et communes
- [ ] Carte Leaflet avec GeoJSON des départements
- [ ] Export PDF des analyses
- [ ] Comparaison inter-temporelle (même entité sur plusieurs années)
- [ ] Indicateurs supplémentaires (DMTO, DGF par habitant)
- [ ] Mode sombre

---

## 📄 Licence

Ce projet est distribué sous licence **MIT**. Voir le fichier LICENSE pour plus d'informations.

Les données utilisées sont sous **Licence Ouverte 2.0** (Etalab).

---

## 👤 Auteur

**gunout**

- GitHub : [@gunout](https://github.com/gunout)

---

<div align="center">

**République Française**

*Liberté · Égalité · Fraternité*

[![Marianne](https://img.shields.io/badge/RF-Liberté%20Égalité%20Fraternité-000091?style=for-the-badge)](https://www.gouvernement.fr/)

</div>
