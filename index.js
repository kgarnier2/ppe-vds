"use strict";


// -----------------------------------------------------------------------------------
// Import des fonctions nécessaires
// -----------------------------------------------------------------------------------

import {initialiserToutesLesCartes, basculerToutesLesCartes} from "/composant/fonction/openclose.js?";
import {formatDateLong} from "/composant/fonction/date.js";

// -----------------------------------------------------------------------------------
// Déclaration des variables globales
// -----------------------------------------------------------------------------------

/* global prochaineEdition, lesClassements*/

// Récupération des éléments de l'interface
const detailClassement = document.getElementById('detailClassement');
const dateEpreuve = document.getElementById('dateEpreuve');
const descriptionEpreuve = document.getElementById('descriptionEpreuve');
const btnOuvrirToutes = document.getElementById('btnOuvrirToutes');
const btnFermerToutes = document.getElementById('btnFermerToutes');

// -----------------------------------------------------------------------------------
// Procédures évènementielles
// -----------------------------------------------------------------------------------

btnOuvrirToutes.onclick = () => basculerToutesLesCartes(true);
btnFermerToutes.onclick = () => basculerToutesLesCartes(false); // fermer


// -----------------------------------------------------------------------------------
// Programme principal
// -----------------------------------------------------------------------------------

// Mise en place du système d'ouverture/fermeture des cadres
initialiserToutesLesCartes();

// les informations

// affichage de la prochaine épreuve
dateEpreuve.innerText =  formatDateLong(prochaineEdition.date);
descriptionEpreuve.innerHTML = prochaineEdition.description;


// afficher les derniers classements pdf
for (const element of lesClassements) {
    let a = document.createElement('a');
    a.classList.add('lien'),
        a.href = "/afficherclassement.php?id=" + element.id;
    a.innerText = element.dateFr + ' ' + element.titre;
    detailClassement.appendChild(a);
}

// Ajoutez ce JS à la fin de votre fichier HTML ou dans un fichier JS lié
document.addEventListener('DOMContentLoaded', function () {
    const btnTiroir = document.getElementById('btnTiroir4Saisons');
    const tiroir = document.getElementById('tiroir4Saisons');
    btnTiroir.addEventListener('click', function () {
        if (tiroir.style.display === 'none' || tiroir.style.display === '') {
            tiroir.style.display = 'block';
            btnTiroir.textContent = 'Fermer "4 saisons"';
        } else {
            tiroir.style.display = 'none';
            btnTiroir.textContent = 'Voir "4 saisons"';
        }
    });
});





// map type -> conteneur DOM
function getContainerForType(type) {
    const t = (type || '').toLowerCase().trim();
    if (t === '4saisons' || t === '4 saisons') return document.getElementById('document4Saisons');
    if (t === 'club' || t === 'club') return document.getElementById('documentClub');
    if (t === 'public' || t === 'public') return document.getElementById('documentPublic');
    if (t === 'membre' || t === 'membre') return document.getElementById('documentMembre');
    return null; // type non reconnu
}

function insererDocumentSurAccueil(doc) {
    const container = getContainerForType(doc.type);
    if (!container) return;
    
    const a = document.createElement('a');
    a.className = 'lien';
    
    a.href = "/afficherdocument.php?id=" + doc.id;
    
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = doc.titre || 'Document';
    
    const wrapper = document.createElement('div');
    wrapper.appendChild(a);
    container.insertBefore(wrapper, container.firstChild);
    
    // FORCER l'affichage du nouveau lien
    console.log('✅ NOUVEAU LIEN GÉNÉRÉ:', a.href);
}

// parcours si la variable PHP a été injectée
if (typeof lesDocuments !== 'undefined' && Array.isArray(lesDocuments)) {
    for (const d of lesDocuments) {
        insererDocumentSurAccueil(d);
    }
}

// écoute d'un event pour insertion instantanée (optionnel)
document.addEventListener('document:added', (e) => {
    if (e && e.detail) insererDocumentSurAccueil(e.detail);
});













