// ============================================================
// Dashboard Santé Financière — Régions + Départements
// ============================================================

var DATA_REGIONS = null;
var DATA_DEPARTEMENTS = null;
var DATA = null;
var niveau = 'regions';           // 'regions' ou 'departements'
var charts = {};
var EURO = '\u20AC';
var currentTab = 'accueil';
var selectedCode = '11';
var radarSelection = [];
var sortColumn = 'recettes';
var sortDirection = 'desc';

var COLORS = {
    bleu: '#0055A4', bleuClair: '#3B82C4', bleuPale: '#E8F0F9',
    rouge: '#EF4135', rougeFonce: '#C1272D', blanc: '#FFFFFF',
    vert: '#2A9D8F', orange: '#F9A602', violet: '#6A0572', gris: '#6B7280'
};

var RADAR_COLORS = [
    { border: '#0055A4', bg: 'rgba(0,85,164,.2)' },
    { border: '#EF4135', bg: 'rgba(239,65,53,.2)' },
    { border: '#2A9D8F', bg: 'rgba(42,157,143,.2)' }
];

var HEATMAP_COLORS = ['#E8F0F9','#B8D4EC','#88B8DF','#589CD2','#3B82C4','#1E5F9E','#0A3D70','#7B1E1E','#C1272D','#EF4135'];

var REGION_POSITIONS = {
    "32": { x: 50, y: 12 }, "11": { x: 47, y: 22 }, "44": { x: 68, y: 22 },
    "28": { x: 28, y: 20 }, "53": { x: 15, y: 28 }, "52": { x: 22, y: 38 },
    "24": { x: 42, y: 34 }, "27": { x: 60, y: 36 }, "75": { x: 25, y: 55 },
    "76": { x: 45, y: 62 }, "84": { x: 68, y: 52 }, "93": { x: 74, y: 72 },
    "94": { x: 85, y: 82 }
};

// ============================================================
// CHARGEMENT
// ============================================================
function loadData() {
    Promise.all([
        fetch('data/processed/regions_finances.json').then(function(r){ return r.json(); }),
        fetch('data/processed/departements_finances.json').then(function(r){ return r.json(); })
    ])
    .then(function(results) {
        DATA_REGIONS = results[0];
        DATA_DEPARTEMENTS = results[1];
        console.log('Régions:', DATA_REGIONS.meta.nb_regions);
        console.log('Départements:', DATA_DEPARTEMENTS.meta.nb_departements);
        switchNiveau('regions');
        renderAll();
    })
    .catch(function(err) {
        document.getElementById('mainContainer').innerHTML =
            '<div class="error"><strong>Erreur de chargement</strong><br>' + err.message + '</div>';
    });
}

// ============================================================
// FORMATAGE
// ============================================================
function formatNumber(v, d) {
    if (d === undefined) d = 0;
    if (v === null || v === undefined || isNaN(v)) return 'N/D';
    return v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function formatEuro(v, d) {
    if (d === undefined) d = 0;
    if (v === null || v === undefined || isNaN(v)) return 'N/D';
    return formatNumber(v, d) + ' ' + EURO;
}
function formatMEuro(v, d) {
    if (d === undefined) d = 2;
    if (v === null || v === undefined || isNaN(v)) return 'N/D';
    return formatNumber(v / 1e6, d) + ' M' + EURO;
}
function formatMdEuro(v, d) {
    if (d === undefined) d = 2;
    if (v === null || v === undefined || isNaN(v)) return 'N/D';
    return formatNumber(v / 1e9, d) + ' Md' + EURO;
}
function formatSmartEuro(v) {
    if (v === null || v === undefined || isNaN(v)) return 'N/D';
    var abs = Math.abs(v);
    if (abs >= 1e9) return formatMdEuro(v, 2);
    if (abs >= 1e6) return formatMEuro(v, 1);
    return formatEuro(v, 0);
}
function getLastYearData(entity) {
    if (!entity.donnees || entity.donnees.length === 0) return null;
    return entity.donnees[entity.donnees.length - 1];
}

// ============================================================
// BASCULE NIVEAU (régions / départements)
// ============================================================
function switchNiveau(n) {
    niveau = n;
    DATA = (n === 'regions') ? DATA_REGIONS : DATA_DEPARTEMENTS;
    // Sélection par défaut
    var keys = Object.keys(DATA.regions);
    if (keys.indexOf(selectedCode) === -1) selectedCode = keys[0];
    // Radar : prendre 2 entités par défaut (les plus grosses en recettes)
    radarSelection = keys.slice(0, 2);
    sortColumn = 'recettes';
    sortDirection = 'desc';
}

// ============================================================
// ONGLETS
// ============================================================
function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-view').forEach(function(v) {
        v.classList.remove('active');
    });
    var activeView = document.getElementById('view-' + tabName);
    if (activeView) activeView.classList.add('active');
    if (tabName === 'accueil' && DATA) selectEntity(selectedCode);
    if (tabName === 'comparaison' && DATA) {
        renderRadarSelector();
        if (niveau === 'regions') renderMap();
        renderComparisonTable();
    }
}

// ============================================================
// RENDU GLOBAL
// ============================================================
function renderAll() {
    var container = document.getElementById('mainContainer');
    var labelEntite = (niveau === 'regions') ? 'région' : 'département';
    var labelEntites = (niveau === 'regions') ? 'région' : 'département';

    container.innerHTML =
        '<div class="tab-view active" id="view-accueil">' +
            '<div class="selector-card">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px;margin-bottom:16px;">' +
                    '<h2 style="margin:0;">Sélectionnez un' + (niveau==='regions'?'e':'') + ' ' + labelEntite + '</h2>' +
                    '<div class="niveau-switch">' +
                        '<button class="niveau-btn' + (niveau==='regions'?' active':'') + '" data-niveau="regions">🏛️ Régions</button>' +
                        '<button class="niveau-btn' + (niveau==='departements'?' active':'') + '" data-niveau="departements">🏢 Départements</button>' +
                    '</div>' +
                '</div>' +
                '<div class="commune-grid" id="entityGrid"></div>' +
            '</div>' +
            '<div class="stats-grid" id="statsGrid"></div>' +
            '<div class="charts-grid">' +
                '<div class="chart-card full-width">' +
                    '<h3><span class="icon">📈</span> Évolution des recettes et dépenses (M' + EURO + ')</h3>' +
                    '<div class="chart-container tall"><canvas id="chartRevExp"></canvas></div>' +
                '</div>' +
                '<div class="chart-card">' +
                    '<h3><span class="icon">📊</span> Structure des recettes (2025)</h3>' +
                    '<div class="chart-container"><canvas id="chartRevStructure"></canvas></div>' +
                '</div>' +
                '<div class="chart-card rouge-top">' +
                    '<h3><span class="icon">📊</span> Structure des dépenses (2025)</h3>' +
                    '<div class="chart-container"><canvas id="chartExpStructure"></canvas></div>' +
                '</div>' +
                '<div class="chart-card">' +
                    '<h3><span class="icon">🏗️</span> Investissement annuel</h3>' +
                    '<div class="chart-container"><canvas id="chartInvest"></canvas></div>' +
                '</div>' +
                '<div class="chart-card rouge-top">' +
                    '<h3><span class="icon">💰</span> Dette et épargne</h3>' +
                    '<div class="chart-container"><canvas id="chartDebt"></canvas></div>' +
                '</div>' +
            '</div>' +
            '<div class="insights-section">' +
                '<h2><span class="icon">💡</span> Analyse financière — <span id="insightName">—</span></h2>' +
                '<div class="insights-grid" id="insightsGrid"></div>' +
            '</div>' +
            '<div class="table-section">' +
                '<h3>Données détaillées — <span id="tableName">—</span></h3>' +
                '<div style="overflow-x:auto">' +
                    '<table><thead><tr>' +
                        '<th>Année</th><th>Population</th><th>Recettes</th>' +
                        '<th>Dépenses</th><th>Épargne brute</th>' +
                        '<th>Investissement</th><th>Dette</th>' +
                    '</tr></thead><tbody id="dataTableBody"></tbody></table>' +
                '</div>' +
            '</div>' +
        '</div>' +

        '<div class="tab-view" id="view-comparaison">' +
            '<div class="section-card">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px;margin-bottom:20px;">' +
                    '<h2 style="margin:0;"><span class="icon">🎯</span> Radar comparatif</h2>' +
                    '<div class="niveau-switch">' +
                        '<button class="niveau-btn' + (niveau==='regions'?' active':'') + '" data-niveau="regions">🏛️ Régions</button>' +
                        '<button class="niveau-btn' + (niveau==='departements'?' active':'') + '" data-niveau="departements">🏢 Départements</button>' +
                    '</div>' +
                '</div>' +
                '<div style="margin-bottom:15px;font-size:.9em;color:#6B7280;">' +
                    'Sélectionnez 2 ou 3 ' + labelEntites + 's pour comparer leur profil financier.' +
                '</div>' +
                '<div class="radar-selector" id="radarSelector"></div>' +
                '<div class="chart-container tall"><canvas id="chartRadar"></canvas></div>' +
            '</div>' +

            (niveau === 'regions' ?
            '<div class="section-card">' +
                '<h2><span class="icon rouge">🗺️</span> Carte des régions</h2>' +
                '<select class="indicator-select" id="mapIndicator">' +
                    '<option value="recettes_fonctionnement">Recettes de fonctionnement</option>' +
                    '<option value="depenses_fonctionnement">Dépenses de fonctionnement</option>' +
                    '<option value="dette">Encours de dette</option>' +
                    '<option value="epargne_brute">Épargne brute</option>' +
                    '<option value="investissement">Investissement</option>' +
                    '<option value="recettes_fonctionnement_par_hab">Recettes par habitant</option>' +
                    '<option value="dette_par_hab">Dette par habitant</option>' +
                    '<option value="taux_endettement">Taux d\'endettement (%)</option>' +
                    '<option value="taux_epargne">Taux d\'épargne (%)</option>' +
                '</select>' +
                '<div class="map-container" id="mapContainer">' +
                    '<svg class="map-svg" id="mapSvg" viewBox="0 0 100 90" preserveAspectRatio="xMidYMid meet"></svg>' +
                    '<div class="map-tooltip" id="mapTooltip"></div>' +
                '</div>' +
                '<div class="map-legend">' +
                    '<span>Faible</span>' +
                    '<div class="legend-scale" id="legendScale"></div>' +
                    '<span>Élevé</span>' +
                '</div>' +
            '</div>' : '') +

            '<div class="table-section rouge-top">' +
                '<h2><span class="icon">📊</span> Tableau comparatif — 2025</h2>' +
                '<div class="btn-group">' +
                    '<button class="btn btn-export" onclick="exportCSV()">📥 Exporter en CSV</button>' +
                    '<button class="btn btn-reset" onclick="renderComparisonTable()">🔄 Réinitialiser le tri</button>' +
                '</div>' +
                '<div style="overflow-x:auto">' +
                    '<table id="comparisonTable">' +
                        '<thead><tr>' +
                            '<th class="sortable" data-sort="nom">Nom</th>' +
                            '<th class="sortable" data-sort="population">Population</th>' +
                            '<th class="sortable" data-sort="recettes">Recettes</th>' +
                            '<th class="sortable" data-sort="depenses">Dépenses</th>' +
                            '<th class="sortable" data-sort="dette">Dette</th>' +
                            '<th class="sortable" data-sort="epargne">Épargne brute</th>' +
                            '<th class="sortable" data-sort="investissement">Investissement</th>' +
                            '<th class="sortable" data-sort="recettes_hab">Recettes/hab</th>' +
                            '<th class="sortable" data-sort="dette_hab">Dette/hab</th>' +
                            '<th class="sortable" data-sort="taux_endettement">Taux endett.</th>' +
                        '</tr></thead>' +
                        '<tbody id="comparisonTableBody"></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>' +
        '</div>';

    renderEntityGrid();

    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { switchTab(btn.dataset.tab); });
    });
    document.querySelectorAll('.niveau-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            switchNiveau(btn.dataset.niveau);
            renderAll();
        });
    });

    var mapSel = document.getElementById('mapIndicator');
    if (mapSel) mapSel.addEventListener('change', renderMap);

    selectEntity(selectedCode);
    renderRadarSelector();
    if (niveau === 'regions') renderMap();
    renderComparisonTable();
}

function renderEntityGrid() {
    var grid = document.getElementById('entityGrid');
    grid.innerHTML = '';
    Object.keys(DATA.regions).forEach(function(code) {
        var e = DATA.regions[code];
        var btn = document.createElement('button');
        btn.className = 'commune-btn' + (code === selectedCode ? ' active' : '');
        btn.textContent = e.nom;
        btn.dataset.code = code;
        btn.addEventListener('click', function() { selectEntity(code); });
        grid.appendChild(btn);
    });
}

// ============================================================
// SÉLECTION
// ============================================================
function selectEntity(code) {
    selectedCode = code;
    document.querySelectorAll('.commune-btn').forEach(function(b) {
        b.classList.toggle('active', b.dataset.code === code);
    });
    var entity = DATA.regions[code];
    if (!entity) return;
    var n = document.getElementById('insightName');
    var t = document.getElementById('tableName');
    if (n) n.textContent = entity.nom;
    if (t) t.textContent = entity.nom;
    renderStats(entity);
    renderCharts(entity);
    renderInsights(entity);
    renderTable(entity);
}

function renderStats(e) {
    var grid = document.getElementById('statsGrid');
    var d = e.donnees;
    if (!d || d.length === 0) return;
    var last = d[d.length - 1];
    var first = d[0];
    var pop = last.population;
    var rec = last.recettes_fonctionnement;
    var dep = last.depenses_fonctionnement;
    var dette = last.dette;
    var eb = last.epargne_brute;
    var tauxEnd = last.taux_endettement;
    var evolRec = (first.recettes_fonctionnement && rec) ?
        ((rec / first.recettes_fonctionnement - 1) * 100) : null;
    var evolTxt = evolRec !== null ?
        'Évolution ' + first.annee + '-' + last.annee + ' : ' + (evolRec > 0 ? '+' : '') + formatNumber(evolRec, 1) + '%' : '';

    grid.innerHTML =
        '<div class="stat-card"><div class="label">Population (' + last.annee + ')</div>' +
        '<div class="value">' + formatNumber(pop) + '<span class="unit">hab</span></div>' +
        '<div class="note">Source OFGL / INSEE</div></div>' +
        '<div class="stat-card"><div class="label">Recettes (' + last.annee + ')</div>' +
        '<div class="value">' + formatNumber(rec / 1e9, 2) + '<span class="unit">Md' + EURO + '</span></div>' +
        '<div class="note">' + evolTxt + '</div></div>' +
        '<div class="stat-card bleu-clair"><div class="label">Dépenses (' + last.annee + ')</div>' +
        '<div class="value">' + formatNumber(dep / 1e9, 2) + '<span class="unit">Md' + EURO + '</span></div>' +
        '<div class="note">Charges de fonctionnement</div></div>' +
        '<div class="stat-card rouge"><div class="label">Dette (' + last.annee + ')</div>' +
        '<div class="value">' + formatNumber(dette / 1e9, 2) + '<span class="unit">Md' + EURO + '</span></div>' +
        '<div class="note">Taux : ' + (tauxEnd ? formatNumber(tauxEnd, 0) + '%' : 'N/D') + '</div></div>' +
        '<div class="stat-card rouge"><div class="label">Épargne brute (' + last.annee + ')</div>' +
        '<div class="value">' + formatNumber(eb / 1e6, 0) + '<span class="unit">M' + EURO + '</span></div>' +
        '<div class="note">Excédent brut</div></div>';
}

function renderCharts(e) {
    ['revExp','revStructure','expStructure','invest','debt'].forEach(function(k) {
        if (charts[k]) { charts[k].destroy(); delete charts[k]; }
    });
    var d = e.donnees;
    var years = d.map(function(x){return x.annee;});
    var last = d[d.length - 1];

    charts.revExp = new Chart(document.getElementById('chartRevExp'), {
        type: 'line',
        data: { labels: years, datasets: [
            { label: 'Recettes', data: d.map(function(x){return x.recettes_fonctionnement ? x.recettes_fonctionnement/1e6 : null;}),
              borderColor: COLORS.bleu, backgroundColor: 'rgba(0,85,164,.08)', fill: true, tension: 0.3, pointRadius: 5, borderWidth: 2.5 },
            { label: 'Dépenses', data: d.map(function(x){return x.depenses_fonctionnement ? x.depenses_fonctionnement/1e6 : null;}),
              borderColor: COLORS.rouge, backgroundColor: 'rgba(239,65,53,.08)', fill: true, tension: 0.3, pointRadius: 5, borderWidth: 2.5 }
        ] },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 15 } },
                tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ' : ' + formatNumber(ctx.parsed.y, 2) + ' M' + EURO; } } } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'M' + EURO }, grid: { color: 'rgba(0,85,164,.05)' } }, x: { grid: { display: false } } }
        }
    });

    var recStruct = [
        { label: 'TVA', value: last.tva || 0, color: COLORS.bleu },
        { label: 'TICPE', value: last.ticpe || 0, color: COLORS.rouge },
        { label: 'Impôts et taxes', value: last.impots_taxes || 0, color: COLORS.bleuClair },
        { label: 'DGF', value: last.dgf || last.dres || 0, color: COLORS.orange },
        { label: 'Subventions', value: last.subventions_recues || 0, color: COLORS.vert },
        { label: 'Autres', value: Math.max(0, (last.recettes_fonctionnement||0) - (last.tva||0) - (last.ticpe||0) - (last.impots_taxes||0) - (last.dgf||last.dres||0) - (last.subventions_recues||0)), color: COLORS.gris }
    ];
    charts.revStructure = new Chart(document.getElementById('chartRevStructure'), {
        type: 'doughnut',
        data: { labels: recStruct.map(function(x){return x.label;}),
            datasets: [{ data: recStruct.map(function(x){return x.value;}),
                backgroundColor: recStruct.map(function(x){return x.color;}), borderWidth: 2, borderColor: '#FFF' }] },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 10, font: { size: 10 } } },
                tooltip: { callbacks: { label: function(ctx) {
                    var t = ctx.dataset.data.reduce(function(a,b){return a+b;},0);
                    return ctx.label + ' : ' + formatSmartEuro(ctx.parsed) + ' (' + formatNumber(t>0?ctx.parsed/t*100:0, 1) + '%)';
                } } } }
        }
    });

    var expStruct = [
        { label: 'Personnel', value: last.personnel || 0, color: COLORS.bleu },
        { label: 'Achats', value: last.achats || 0, color: COLORS.rouge },
        { label: 'Intervention', value: last.depenses_intervention || 0, color: COLORS.orange },
        { label: 'Charges fin.', value: last.charges_financieres || 0, color: COLORS.vert },
        { label: 'Autres', value: Math.max(0, (last.depenses_fonctionnement||0) - (last.personnel||0) - (last.achats||0) - (last.depenses_intervention||0) - (last.charges_financieres||0)), color: COLORS.gris }
    ];
    charts.expStructure = new Chart(document.getElementById('chartExpStructure'), {
        type: 'doughnut',
        data: { labels: expStruct.map(function(x){return x.label;}),
            datasets: [{ data: expStruct.map(function(x){return x.value;}),
                backgroundColor: expStruct.map(function(x){return x.color;}), borderWidth: 2, borderColor: '#FFF' }] },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 10, font: { size: 10 } } },
                tooltip: { callbacks: { label: function(ctx) {
                    var t = ctx.dataset.data.reduce(function(a,b){return a+b;},0);
                    return ctx.label + ' : ' + formatSmartEuro(ctx.parsed) + ' (' + formatNumber(t>0?ctx.parsed/t*100:0, 1) + '%)';
                } } } }
        }
    });

    charts.invest = new Chart(document.getElementById('chartInvest'), {
        type: 'bar',
        data: { labels: years, datasets: [{ label: 'Investissement',
            data: d.map(function(x){return x.investissement ? x.investissement/1e6 : null;}),
            backgroundColor: COLORS.bleu, borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false },
                tooltip: { callbacks: { label: function(ctx) { return formatNumber(ctx.parsed.y, 2) + ' M' + EURO; } } } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'M' + EURO }, grid: { color: 'rgba(0,85,164,.05)' } }, x: { grid: { display: false } } }
        }
    });

    charts.debt = new Chart(document.getElementById('chartDebt'), {
        type: 'line',
        data: { labels: years, datasets: [
            { label: 'Dette', data: d.map(function(x){return x.dette ? x.dette/1e6 : null;}),
              borderColor: COLORS.rouge, backgroundColor: 'rgba(239,65,53,.1)', fill: true, tension: 0.3, pointRadius: 5, borderWidth: 2.5, yAxisID: 'y' },
            { label: 'Épargne brute', data: d.map(function(x){return x.epargne_brute ? x.epargne_brute/1e6 : null;}),
              borderColor: COLORS.bleu, backgroundColor: 'rgba(0,85,164,.1)', fill: true, tension: 0.3, pointRadius: 5, borderWidth: 2.5, yAxisID: 'y1' }
        ] },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 15 } },
                tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ' : ' + formatNumber(ctx.parsed.y, 2) + ' M' + EURO; } } } },
            scales: {
                y: { position: 'left', beginAtZero: true, title: { display: true, text: 'Dette (M' + EURO + ')' }, grid: { color: 'rgba(0,85,164,.05)' } },
                y1: { position: 'right', beginAtZero: true, title: { display: true, text: 'Épargne (M' + EURO + ')' }, grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderInsights(e) {
    var grid = document.getElementById('insightsGrid');
    var d = e.donnees;
    if (!d || d.length < 2) { grid.innerHTML = ''; return; }
    var first = d[0];
    var last = d[d.length - 1];
    var rec = last.recettes_fonctionnement;
    var dep = last.depenses_fonctionnement;
    var dette = last.dette;
    var eb = last.epargne_brute;
    var invest = last.investissement;
    var tauxEnd = last.taux_endettement;
    var tauxEpargne = last.taux_epargne;
    var partPers = last.part_personnel;
    var recHab = last.recettes_fonctionnement_par_hab;
    var detteHab = last.dette_par_hab;
    var periode = first.annee + '-' + last.annee;
    var evolRec = (first.recettes_fonctionnement && rec) ? ((rec / first.recettes_fonctionnement - 1) * 100) : null;
    var evolDep = (first.depenses_fonctionnement && dep) ? ((dep / first.depenses_fonctionnement - 1) * 100) : null;
    var evolDette = (first.dette && dette) ? ((dette / first.dette - 1) * 100) : null;

    var seuilEnd = (niveau === 'regions') ? 150 : 100;
    var diag1 = (tauxEnd && tauxEnd > seuilEnd) ? '⚠️ Endettement élevé<br>' : '✅ Endettement maîtrisé<br>';
    var diag2 = (tauxEpargne && tauxEpargne > 15) ? '✅ Bonne épargne<br>' : '⚠️ Épargne limitée<br>';
    var diag3 = (evolRec !== null && evolDep !== null && evolRec > evolDep) ? '✅ Recettes > dépenses' : '⚠️ Dépenses > recettes';

    // Bloc spécifique départements : APA + RSA
    var blocSocial = '';
    if (niveau === 'departements' && (last.apa || last.rsa)) {
        blocSocial =
            '<div class="insight-item"><h4>🤝 Action sociale</h4>' +
            '<p>APA : <span class="highlight">' + formatMEuro(last.apa) + '</span><br>' +
            'RSA : <span class="highlight">' + formatMEuro(last.rsa) + '</span><br>' +
            'Par hab : <span class="highlight">' + formatEuro((last.apa_par_hab||0) + (last.rsa_par_hab||0), 0) + '</span></p></div>';
    }

    grid.innerHTML =
        '<div class="insight-item"><h4>📈 Recettes</h4>' +
        '<p>Entre ' + periode + ' : <span class="highlight">' + (evolRec!==null?(evolRec>0?'+':'')+formatNumber(evolRec,1)+'%':'N/D') + '</span><br>' +
        'Recettes ' + last.annee + ' : <span class="highlight">' + formatSmartEuro(rec) + '</span><br>' +
        'Soit <span class="highlight">' + formatEuro(recHab, 0) + '/hab</span></p></div>' +
        '<div class="insight-item"><h4>📉 Dépenses</h4>' +
        '<p>Entre ' + periode + ' : <span class="highlight">' + (evolDep!==null?(evolDep>0?'+':'')+formatNumber(evolDep,1)+'%':'N/D') + '</span><br>' +
        'Dépenses ' + last.annee + ' : <span class="highlight">' + formatSmartEuro(dep) + '</span><br>' +
        'Personnel : <span class="highlight">' + (partPers?formatNumber(partPers,1)+'%':'N/D') + '</span></p></div>' +
        '<div class="insight-item rouge"><h4>💰 Endettement</h4>' +
        '<p>Dette ' + last.annee + ' : <span class="highlight">' + formatSmartEuro(dette) + '</span><br>' +
        'Évolution : <span class="highlight">' + (evolDette!==null?(evolDette>0?'+':'')+formatNumber(evolDette,1)+'%':'N/D') + '</span><br>' +
        'Taux : <span class="highlight">' + (tauxEnd?formatNumber(tauxEnd,1)+'%':'N/D') + '</span></p></div>' +
        '<div class="insight-item rouge"><h4>💵 Épargne / Investissement</h4>' +
        '<p>Épargne brute : <span class="highlight">' + formatSmartEuro(eb) + '</span><br>' +
        'Taux épargne : <span class="highlight">' + (tauxEpargne?formatNumber(tauxEpargne,1)+'%':'N/D') + '</span><br>' +
        'Investissement : <span class="highlight">' + formatSmartEuro(invest) + '</span></p></div>' +
        blocSocial +
        '<div class="insight-item"><h4>👥 Par habitant</h4>' +
        '<p>Recettes/hab : <span class="highlight">' + formatEuro(recHab, 0) + '</span><br>' +
        'Dette/hab : <span class="highlight">' + formatEuro(detteHab, 0) + '</span><br>' +
        'Population : <span class="highlight">' + formatNumber(last.population) + '</span></p></div>' +
        '<div class="insight-item rouge"><h4>📋 Diagnostic</h4>' +
        '<p>' + diag1 + diag2 + diag3 + '</p></div>';
}

function renderTable(e) {
    var tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';
    e.donnees.forEach(function(d) {
        var row = document.createElement('tr');
        row.innerHTML =
            '<td><strong>' + d.annee + '</strong></td>' +
            '<td>' + formatNumber(d.population) + '</td>' +
            '<td>' + formatSmartEuro(d.recettes_fonctionnement) + '</td>' +
            '<td>' + formatSmartEuro(d.depenses_fonctionnement) + '</td>' +
            '<td>' + formatSmartEuro(d.epargne_brute) + '</td>' +
            '<td>' + formatSmartEuro(d.investissement) + '</td>' +
            '<td>' + formatSmartEuro(d.dette) + '</td>';
        tbody.appendChild(row);
    });
}

// ============================================================
// RADAR
// ============================================================
function renderRadarSelector() {
    var container = document.getElementById('radarSelector');
    if (!container) return;
    container.innerHTML = '';
    Object.keys(DATA.regions).forEach(function(code) {
        var e = DATA.regions[code];
        var selected = radarSelection.indexOf(code) !== -1;
        var disabled = !selected && radarSelection.length >= 3;
        var label = document.createElement('label');
        label.className = 'commune-check' + (selected ? ' selected' : '') + (disabled ? ' disabled' : '');
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = selected;
        cb.disabled = disabled;
        cb.addEventListener('change', function() {
            if (cb.checked) { if (radarSelection.length < 3) radarSelection.push(code); }
            else { radarSelection = radarSelection.filter(function(c){return c!==code;}); }
            renderRadarSelector();
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(' ' + e.nom));
        container.appendChild(label);
    });
    renderRadarChart();
}

function renderRadarChart() {
    if (charts.radar) charts.radar.destroy();
    var canvas = document.getElementById('chartRadar');
    if (!canvas || radarSelection.length < 2) return;

    var indicators = ['recettes_fonctionnement','depenses_fonctionnement','dette','epargne_brute','investissement','personnel'];
    var labels = ['Recettes','Dépenses','Dette','Épargne','Investissement','Personnel'];
    var maxValues = {};
    indicators.forEach(function(ind) {
        var max = 0;
        Object.keys(DATA.regions).forEach(function(code) {
            var last = getLastYearData(DATA.regions[code]);
            if (last && last[ind] > max) max = last[ind];
        });
        maxValues[ind] = max || 1;
    });

    var datasets = radarSelection.map(function(code, i) {
        var e = DATA.regions[code];
        var last = getLastYearData(e);
        var color = RADAR_COLORS[i % RADAR_COLORS.length];
        return {
            label: e.nom,
            data: indicators.map(function(ind) {
                var v = (last && last[ind]) ? last[ind] : 0;
                return Math.round((v / maxValues[ind]) * 100);
            }),
            borderColor: color.border, backgroundColor: color.bg,
            pointBackgroundColor: color.border, pointBorderColor: '#FFF',
            pointRadius: 5, borderWidth: 2.5
        };
    });

    charts.radar = new Chart(canvas, {
        type: 'radar',
        data: { labels: labels, datasets: datasets },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
                tooltip: { callbacks: { label: function(ctx) {
                    var code = radarSelection[ctx.datasetIndex];
                    var last = getLastYearData(DATA.regions[code]);
                    return ctx.dataset.label + ' : ' + formatSmartEuro(last[indicators[ctx.dataIndex]]);
                } } } },
            scales: { r: { beginAtZero: true, max: 100, ticks: { display: false },
                grid: { color: 'rgba(0,85,164,.1)' }, angleLines: { color: 'rgba(0,85,164,.1)' },
                pointLabels: { font: { size: 12, weight: '600' }, color: '#0055A4' } } }
        }
    });
}

// ============================================================
// CARTE (régions uniquement)
// ============================================================
function getEntityValue(code, indicator) {
    var e = DATA.regions[code];
    if (!e) return null;
    var last = getLastYearData(e);
    if (!last) return null;
    return last[indicator] || null;
}
function getHeatmapColor(v, min, max) {
    if (v === null || v === undefined) return '#E5E7EB';
    if (max === min) return HEATMAP_COLORS[0];
    var r = (v - min) / (max - min);
    var idx = Math.min(HEATMAP_COLORS.length - 1, Math.floor(r * HEATMAP_COLORS.length));
    return HEATMAP_COLORS[idx];
}
function formatMapValue(v, ind) {
    if (v === null || v === undefined) return 'N/D';
    if (ind === 'taux_endettement' || ind === 'taux_epargne') return formatNumber(v, 1) + ' %';
    if (ind.indexOf('_par_hab') !== -1) return formatEuro(v, 0) + '/hab';
    return formatSmartEuro(v);
}
function renderMap() {
    if (niveau !== 'regions') return;
    var sel = document.getElementById('mapIndicator');
    if (!sel) return;
    var indicator = sel.value;
    var svg = document.getElementById('mapSvg');
    if (!svg) return;
    svg.innerHTML = '';

    var values = [];
    Object.keys(REGION_POSITIONS).forEach(function(code) {
        var v = getEntityValue(code, indicator);
        if (v !== null) values.push(v);
    });
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);

    var bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '5'); bg.setAttribute('y', '5');
    bg.setAttribute('width', '90'); bg.setAttribute('height', '85');
    bg.setAttribute('fill', '#F0F6FF'); bg.setAttribute('stroke', '#B8D4EC');
    bg.setAttribute('stroke-width', '0.5'); bg.setAttribute('rx', '3');
    svg.appendChild(bg);

    Object.keys(REGION_POSITIONS).forEach(function(code) {
        var pos = REGION_POSITIONS[code];
        var e = DATA.regions[code];
        if (!e) return;
        var v = getEntityValue(code, indicator);
        var color = getHeatmapColor(v, min, max);
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y);
        circle.setAttribute('r', '4.5');
        circle.setAttribute('fill', color); circle.setAttribute('class', 'commune-shape');
        circle.setAttribute('data-code', code);
        circle.setAttribute('data-name', e.nom);
        circle.setAttribute('data-value', v || '');
        circle.setAttribute('data-indicator', indicator);
        circle.addEventListener('mouseenter', showMapTooltip);
        circle.addEventListener('mousemove', moveMapTooltip);
        circle.addEventListener('mouseleave', hideMapTooltip);
        circle.addEventListener('click', function() { switchTab('accueil'); selectEntity(code); });
        g.appendChild(circle);

        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', pos.x); text.setAttribute('y', pos.y + 9);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '2.2');
        text.setAttribute('fill', '#1F2937');
        text.setAttribute('pointer-events', 'none');
        text.textContent = e.nom.length > 18 ? e.nom.substring(0, 16) + '…' : e.nom;
        g.appendChild(text);
        svg.appendChild(g);
    });

    var legend = document.getElementById('legendScale');
    if (legend) {
        legend.innerHTML = '';
        HEATMAP_COLORS.forEach(function(c) {
            var s = document.createElement('span');
            s.style.background = c;
            legend.appendChild(s);
        });
    }
}
function showMapTooltip(e) {
    var t = document.getElementById('mapTooltip');
    if (!t) return;
    var name = e.target.getAttribute('data-name');
    var value = e.target.getAttribute('data-value');
    var ind = e.target.getAttribute('data-indicator');
    var v = value ? parseFloat(value) : null;
    t.innerHTML = '<strong>' + name + '</strong><br>' + formatMapValue(v, ind);
    t.classList.add('visible');
}
function moveMapTooltip(e) {
    var t = document.getElementById('mapTooltip');
    var c = document.getElementById('mapContainer');
    if (!t || !c) return;
    var rect = c.getBoundingClientRect();
    t.style.left = (e.clientX - rect.left + 15) + 'px';
    t.style.top = (e.clientY - rect.top - 20) + 'px';
}
function hideMapTooltip() {
    var t = document.getElementById('mapTooltip');
    if (t) t.classList.remove('visible');
}

// ============================================================
// TABLEAU COMPARATIF
// ============================================================
function renderComparisonTable() {
    var tbody = document.getElementById('comparisonTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var rows = [];
    Object.keys(DATA.regions).forEach(function(code) {
        var e = DATA.regions[code];
        var last = getLastYearData(e);
        if (!last) return;
        rows.push({
            code: code, nom: e.nom,
            population: last.population,
            recettes: last.recettes_fonctionnement,
            depenses: last.depenses_fonctionnement,
            dette: last.dette,
            epargne: last.epargne_brute,
            investissement: last.investissement,
            recettes_hab: last.recettes_fonctionnement_par_hab,
            dette_hab: last.dette_par_hab,
            taux_endettement: last.taux_endettement
        });
    });
    rows.sort(function(a, b) {
        var va = a[sortColumn], vb = b[sortColumn];
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        if (typeof va === 'string') return sortDirection === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        return sortDirection === 'asc' ? va - vb : vb - va;
    });
    rows.forEach(function(row, i) {
        var tr = document.createElement('tr');
        if (i === 0) tr.className = 'top1';
        else if (i === 1) tr.className = 'top2';
        else if (i === 2) tr.className = 'top3';
        tr.innerHTML =
            '<td><strong>' + row.nom + '</strong></td>' +
            '<td>' + formatNumber(row.population) + '</td>' +
            '<td>' + formatSmartEuro(row.recettes) + '</td>' +
            '<td>' + formatSmartEuro(row.depenses) + '</td>' +
            '<td>' + formatSmartEuro(row.dette) + '</td>' +
            '<td>' + formatSmartEuro(row.epargne) + '</td>' +
            '<td>' + formatSmartEuro(row.investissement) + '</td>' +
            '<td>' + formatEuro(row.recettes_hab, 0) + '</td>' +
            '<td>' + formatEuro(row.dette_hab, 0) + '</td>' +
            '<td>' + (row.taux_endettement !== null ? formatNumber(row.taux_endettement, 1) + ' %' : 'N/D') + '</td>';
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', function() { switchTab('accueil'); selectEntity(row.code); });
        tbody.appendChild(tr);
    });
    document.querySelectorAll('#comparisonTable th.sortable').forEach(function(th) {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.getAttribute('data-sort') === sortColumn) {
            th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        }
        th.onclick = function() {
            var col = th.getAttribute('data-sort');
            if (col === sortColumn) sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            else { sortColumn = col; sortDirection = 'desc'; }
            renderComparisonTable();
        };
    });
}

// ============================================================
// EXPORT CSV
// ============================================================
function exportCSV() {
    var rows = [];
    rows.push(['Nom','Population','Recettes (Md€)','Dépenses (Md€)','Dette (Md€)','Épargne brute (M€)','Investissement (M€)','Recettes/hab (€)','Dette/hab (€)','Taux endettement (%)']);
    Object.keys(DATA.regions).forEach(function(code) {
        var e = DATA.regions[code];
        var last = getLastYearData(e);
        if (!last) return;
        rows.push([
            e.nom,
            last.population || '',
            last.recettes_fonctionnement ? (last.recettes_fonctionnement/1e9).toFixed(3) : '',
            last.depenses_fonctionnement ? (last.depenses_fonctionnement/1e9).toFixed(3) : '',
            last.dette ? (last.dette/1e9).toFixed(3) : '',
            last.epargne_brute ? (last.epargne_brute/1e6).toFixed(0) : '',
            last.investissement ? (last.investissement/1e6).toFixed(0) : '',
            last.recettes_fonctionnement_par_hab ? last.recettes_fonctionnement_par_hab.toFixed(0) : '',
            last.dette_par_hab ? last.dette_par_hab.toFixed(0) : '',
            last.taux_endettement ? last.taux_endettement.toFixed(1) : ''
        ]);
    });
    var csv = rows.map(function(row) {
        return row.map(function(c) {
            var s = String(c === null || c === undefined ? '' : c);
            if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
                return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
        }).join(';');
    }).join('\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'comparaison_' + niveau + '_2025.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

loadData();