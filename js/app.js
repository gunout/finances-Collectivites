

/* ============================================================
   CODE COULEUR ENDETTEMENT
   ============================================================ */

/* Boutons de sélection */
.commune-btn.dette-faible {
    border-left: 4px solid #18753C;
    background: linear-gradient(to right, rgba(24,117,60,.06), transparent 30%);
}
.commune-btn.dette-modere {
    border-left: 4px solid #B34000;
    background: linear-gradient(to right, rgba(179,64,0,.08), transparent 30%);
}
.commune-btn.dette-eleve {
    border-left: 4px solid #E1000F;
    background: linear-gradient(to right, rgba(225,0,15,.08), transparent 30%);
}
.commune-btn.dette-critique {
    border-left: 4px solid #8B0000;
    background: linear-gradient(to right, rgba(139,0,0,.12), transparent 30%);
    font-weight: 700;
}
.commune-btn.active.dette-faible,
.commune-btn.active.dette-modere,
.commune-btn.active.dette-eleve,
.commune-btn.active.dette-critique {
    background: #000091;
    border-left-color: #000091;
    color: #FFFFFF;
}

/* Légende */
.dette-legende {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: #F6F6F6;
    font-size: .8em;
    color: #666666;
    border-left: 3px solid #000091;
}
.dette-legende-item {
    display: flex;
    align-items: center;
    gap: 6px;
}
.dette-legende-item .pastille {
    width: 12px;
    height: 12px;
    display: inline-block;
}
.pastille.dette-faible { background: #18753C; }
.pastille.dette-modere { background: #B34000; }
.pastille.dette-eleve { background: #E1000F; }
.pastille.dette-critique { background: #8B0000; }

/* Cellules du tableau comparatif */
td.taux-faible { color: #18753C; font-weight: 700; }
td.taux-modere { color: #B34000; font-weight: 700; }
td.taux-eleve { color: #E1000F; font-weight: 700; }
td.taux-critique { color: #8B0000; font-weight: 700; }

/* Radar checkboxes colorés */
.commune-check.dette-faible { border-left: 3px solid #18753C; }
.commune-check.dette-modere { border-left: 3px solid #B34000; }
.commune-check.dette-eleve { border-left: 3px solid #E1000F; }
.commune-check.dette-critique { border-left: 3px solid #8B0000; }
