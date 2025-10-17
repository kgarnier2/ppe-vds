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
const detailClub = document.getElementById('detailClub');
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
    detailClub.appendChild(a);
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

// Configuration de l'API - À ADAPTER selon ton backend
const API_CONFIG = {
    baseUrl: 'http://localhost:3000/api', // Remplace par ton URL
    endpoints: {
        documents: '/documents'
    }
};

// Fonction pour récupérer les documents depuis l'API
async function chargerDocuments() {
    try {
        showLoadingDocuments(true);

        // ICI : Remplace cette URL par ton endpoint réel
        const response = await fetch(API_CONFIG.baseUrl + API_CONFIG.endpoints.documents);

        if (!response.ok) {
            throw new Error('Erreur lors du chargement des documents');
        }

        const documents = await response.json();
        organiserDocumentsParCategorie(documents);

    } catch (error) {
        console.error('Erreur:', error);
        showErrorDocuments('Impossible de charger les documents: ' + error.message);
    } finally {
        showLoadingDocuments(false);
    }
}

// Fonction pour organiser les documents par type/catégorie
function organiserDocumentsParCategorie(documents) {
    // Grouper les documents par type
    const documentsParType = {};

    documents.forEach(doc => {
        if (!documentsParType[doc.type]) {
            documentsParType[doc.type] = [];
        }
        documentsParType[doc.type].push({
            id: doc.id,
            nom: doc.titre,
            fichier: doc.fichier,
            date: formaterDate(doc.date_creation) || 'Date inconnue'
        });
    });

    // Convertir en format pour l'affichage
    const categories = Object.keys(documentsParType).map((type, index) => {
        return {
            id: index + 1,
            nom: type,
            icone: getIconePourType(type),
            documents: documentsParType[type]
        };
    });

    // Si aucun document, créer une catégorie vide
    if (categories.length === 0) {
        categories.push({
            id: 1,
            nom: "Aucun document",
            icone: "📁",
            documents: []
        });
    }

    genererCardsDocuments(categories);
}

// Fonction pour obtenir une icône selon le type
function getIconePourType(type) {
    const icones = {
        'printemps': '🌸',
        'été': '☀️',
        'automne': '🍂',
        'hiver': '❄️',
        'administratif': '📊',
        'technique': '🔧',
        'general': '📄',
        '4saisons': '🍃'
    };
    return icones[type.toLowerCase()] || '📁';
}

// Fonction pour formater la date
function formaterDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

// Fonction pour générer les cards dynamiquement
function genererCardsDocuments(categories) {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';

    categories.forEach(categorie => {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'card-wrapper';
        cardWrapper.innerHTML = `
            <div class="card-document">
                <div class="card-title-document">
                    <span>${categorie.icone}</span>
                    ${categorie.nom}
                </div>
                <button class="btn-consulter" onclick="toggleDocuments(${categorie.id})">
                    Consulter (${categorie.documents.length})
                </button>
            </div>
            <div class="documents-list" id="documentsList${categorie.id}">
                <div class="documents-header">
                    ${categorie.nom}
                </div>
                ${genererDocumentsHTML(categorie.documents)}
            </div>
        `;
        container.appendChild(cardWrapper);
    });
}

// Fonction pour générer la liste des documents
function genererDocumentsHTML(documents) {
    if (documents.length === 0) {
        return '<div class="document-item">Aucun document disponible</div>';
    }

    return documents.map(doc => `
        <div class="document-item" onclick="ouvrirDocument(${doc.id}, '${doc.fichier}')">
            <span class="document-name">
                <span class="document-icon">📄</span>
                ${doc.nom}
            </span>
            <span class="document-date">${doc.date}</span>
        </div>
    `).join('');
}

// Fonction pour ouvrir/télécharger un document
function ouvrirDocument(docId, fichier) {
    // ICI : Adapte cette URL selon ton API de téléchargement
    const urlDownload = `${API_CONFIG.baseUrl}/documents/${docId}/download`;

    // Pour l'instant, on ouvre dans un nouvel onglet
    window.open(urlDownload, '_blank');

    console.log(`Ouverture du document ${docId}: ${fichier}`);
}

// Fonctions d'affichage
function showLoadingDocuments(show) {
    const loading = document.getElementById('loadingMessage');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

function showErrorDocuments(message) {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = `<div class="error">${message}</div>`;
}

// Fonction pour ouvrir/fermer les documents d'une catégorie
function toggleDocuments(categorieId) {
    // Fermer tous les autres tiroirs
    document.querySelectorAll('.documents-list').forEach(list => {
        if (list.id !== `documentsList${categorieId}`) {
            list.style.display = "none";
        }
    });

    // Basculer le tiroir actuel
    const currentList = document.getElementById(`documentsList${categorieId}`);
    if (currentList.style.display === "none" || currentList.style.display === "") {
        currentList.style.display = "block";
    } else {
        currentList.style.display = "none";
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Attendre que le cadre "Les Documents" soit ouvert
    const cadreDocuments = document.querySelector('.card-header.entete');
    cadreDocuments.addEventListener('click', function() {
        // Charger les documents seulement quand le cadre est ouvert
        setTimeout(() => {
            if (this.parentElement.querySelector('div').style.display !== 'none') {
                chargerDocuments();
            }
        }, 300);
    });
});

// Fonction pour rafraîchir manuellement
function rafraichirDocuments() {
    chargerDocuments();
}









