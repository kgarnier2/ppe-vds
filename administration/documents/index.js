"use strict";

// -----------------------------------------------------------------------------------
// Import des fonctions nécessaires
// -----------------------------------------------------------------------------------

import {appelAjax} from "/composant/fonction/ajax.js";
import {confirmer, messageBox} from "/composant/fonction/afficher.js";
import {
    fichierValide, effacerLesErreurs
} from "/composant/fonction/formulaire.js";

// -----------------------------------------------------------------------------------
// Déclaration des variables globales
// -----------------------------------------------------------------------------------

/* global lesClassements, lesParametres, lesDocuments */

// conserver le nom du fichier à remplacer
let nomFichier;

// récupération des élements sur l'interface
const fichier = document.getElementById('fichier');
const nb = document.getElementById('nb');

// -----------------------------------------------------------------------------------
// Fonctions utilitaires
// -----------------------------------------------------------------------------------

// Fonction pour formater la date
function formaterDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Fonction pour créer un élément de document
function creerElementDocument(element) {
    const div = document.createElement('div');
    div.className = 'list-group-item';
    div.id = `doc-${element.id}`;
    
    div.innerHTML = `
        <div class="document-item">
            <div class="document-info">
                <div class="document-title" title="${element.titre}">${element.titre}</div>
                <div class="document-date">${formaterDate(element.date)}</div>
                ${element.description ? `<div class="document-description small text-muted">${element.description}</div>` : ''}
            </div>
            <div class="document-actions">
                ${element.present ? 
    `<a href="afficherdocument.php?id=${element.id}" target="_blank" class="btn btn-sm btn-outline-primary btn-apercu" title="Voir le document" data-id="${element.id}">
        <i class="fas fa-eye"></i>
    </a>` : 
    `<span class="btn btn-sm btn-outline-secondary" title="Document non trouvé">
        <i class="fas fa-question"></i>
    </span>`
}
                <button class="btn btn-sm btn-outline-warning btn-remplacer" 
                        title="Remplacer le fichier" 
                        data-id="${element.id}" 
                        data-fichier="${element.fichier}">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-supprimer" 
                        title="Supprimer le document" 
                        data-id="${element.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// Fonction pour ajouter un message "vide" dans une catégorie
function ajouterMessageVide(container) {
    // Vérifier si un message vide existe déjà
    const existingMsg = container.querySelector('.empty-message');
    if (existingMsg) return;
    
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-message';
    emptyMsg.textContent = 'Aucun document dans cette catégorie';
    container.appendChild(emptyMsg);
}

// mapping type -> conteneur tiroir
function getContainerForType(type) {
    const t = (type||'').toLowerCase().trim();
    if (t === '4saisons' || t === '4 saisons') return document.getElementById('document4Saisons');
    if (t === 'club' || t === 'administratif') return document.getElementById('documentClub');
    if (t === 'technique' || t === 'public') return document.getElementById('documentPublic');
    if (t === 'general' || t === 'membre') return document.getElementById('documentMembre');
    return null;
}

// -----------------------------------------------------------------------------------
// Fonction de suppression
// -----------------------------------------------------------------------------------

function supprimerDocument(id, item) {
    // Animation de sortie
    item.classList.add('fade-out');
    
    setTimeout(() => {
        appelAjax({
            url: 'ajax/supprimer.php',
            data: { id: id },
            success: (response) => {
                item.remove();
                
                // Mettre à jour les compteurs
                const currentCount = parseInt(nb.innerText);
                nb.innerText = currentCount - 1;
                
                // Mettre à jour le compteur de la catégorie
                const categoryCard = item.closest('.card');
                if (categoryCard) {
                    const badge = categoryCard.querySelector('.badge');
                    if (badge) {
                        const categoryCount = parseInt(badge.textContent);
                        badge.textContent = Math.max(0, categoryCount - 1);
                    }
                    
                    // Si plus de documents, afficher message vide
                    const container = categoryCard.querySelector('.list-group');
                    if (container && container.children.length === 0) {
                        ajouterMessageVide(container);
                    }
                }
                
                messageBox("Document supprimé avec succès", 'success');
            },
            error: (err) => {
                // Annuler l'animation si erreur
                item.classList.remove('fade-out');
                console.error('Erreur suppression:', err);
                messageBox("Erreur lors de la suppression: " + (err.message || 'Erreur inconnue'), 'error');
            }
        });
    }, 300);
}

// -----------------------------------------------------------------------------------
// Procédures évènementielles
// -----------------------------------------------------------------------------------

// sur la sélection d'un fichier
fichier.onchange = () => {
    effacerLesErreurs();
    if (fichier.files.length > 0) {
        let file = fichier.files[0];
        if (fichierValide(file, lesParametres)) {
            remplacer(file);
        }
    }
};

// -----------------------------------------------------------------------------------
// Fonctions de traitement
// -----------------------------------------------------------------------------------

function remplacer(file) {
    // transfert du fichier vers le serveur dans le répertoire sélectionné
    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('nomFichier', nomFichier);
    appelAjax({
        url: 'ajax/remplacer.php',
        data: formData,
        success: () => {
            messageBox("Fichier remplacé avec succès");
        },
        error: (err) => {
            messageBox("Erreur lors du remplacement du fichier: " + (err.message || 'Erreur inconnue'), 'error');
        }
    });
}

/**
 * Demande de modification de la valeur d'une colonne
 * @param {string} colonne
 * @param {object} input balise input
 * @param {int} id identifiant du document à modifier
 */
function modifierColonne(colonne, input, id) {
    appelAjax({
        url: '/ajax/modifiercolonne.php',
        data: {
            table: 'document',
            colonne: colonne,
            valeur: input.value,
            id: id
        },
        success: () => {
            input.style.color = 'green';
            // modifier l'ancienne valeur
            input.dataset.old = input.value;
        },
        error: (err) => {
            messageBox("Erreur lors de la modification: " + (err.message || 'Erreur inconnue'), 'error');
        }
    });
}

// -----------------------------------------------------------------------------------
// Gestion des événements
// -----------------------------------------------------------------------------------

document.addEventListener('click', function(e) {
    // Remplacer un fichier
    if (e.target.closest('.btn-remplacer')) {
        const btn = e.target.closest('.btn-remplacer');
        nomFichier = btn.dataset.fichier;
        fichier.click();
    }
    
    // Supprimer un document
    if (e.target.closest('.btn-supprimer')) {
        const btn = e.target.closest('.btn-supprimer');
        const id = parseInt(btn.dataset.id);
        const item = btn.closest('.list-group-item');
        const titre = item.querySelector('.document-title').textContent;
        
        // Utilisation de la fonction confirmer avec interface graphique
        confirmer(
            "Confirmation de suppression",
            `Êtes-vous sûr de vouloir supprimer le document "<strong>${titre}</strong>" ?<br><small class="text-danger">Cette action est irréversible.</small>`,
            () => supprimerDocument(id, item) // Callback si confirmé
        );
    }
});

// -----------------------------------------------------------------------------------
// Programme principal
// -----------------------------------------------------------------------------------

// Initialisation
fichier.accept = lesParametres.accept;
nb.innerText = lesDocuments.length;

// Compteurs par catégorie
const compteurs = {
    'club': 0,
    '4saisons': 0,
    'membre': 0,
    'public': 0
};

// Afficher les documents par catégorie
lesDocuments.forEach(element => {
    const container = getContainerForType(element.type);
    if (container) {
        const docElement = creerElementDocument(element);
        container.appendChild(docElement);
        
        // Mettre à jour le compteur
        const typeKey = element.type.toLowerCase();
        if (compteurs[typeKey] !== undefined) {
            compteurs[typeKey]++;
        }
    }
});

// Mettre à jour les badges de comptage et gérer les catégories vides
Object.keys(compteurs).forEach(type => {
    const badge = document.getElementById(`count-${type}`);
    const container = document.getElementById(`document${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
    if (badge) {
        badge.textContent = compteurs[type];
    }
    
    // Ajouter message si catégorie vide
    if (container && compteurs[type] === 0) {
        ajouterMessageVide(container);
    }
});


// Fonction de confirmation personnalisée
function confirmationPersonnalisee(titre, message, callback) {
    // Créer la modal de confirmation
    const modalHtml = `
        <div class="modal fade" id="confirmationModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">
                            <i class="fas fa-exclamation-triangle me-2"></i>${titre}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-exclamation-circle text-warning fa-2x me-3"></i>
                            <div>${message}</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Annuler
                        </button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                            <i class="fas fa-trash me-2"></i>Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Supprimer toute modal existante
    const existingModal = document.getElementById('confirmationModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Ajouter la nouvelle modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Afficher la modal
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    modal.show();
    
    // Gérer la confirmation
    document.getElementById('confirmDeleteBtn').onclick = () => {
        modal.hide();
        callback();
    };
    
    // Nettoyer après fermeture
    document.getElementById('confirmationModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Remplacer la gestion des événements de suppression par :
document.addEventListener('click', function(e) {
    // Supprimer un document
    if (e.target.closest('.btn-supprimer')) {
        const btn = e.target.closest('.btn-supprimer');
        const id = parseInt(btn.dataset.id);
        const item = btn.closest('.list-group-item');
        const titre = item.querySelector('.document-title').textContent;
        
        confirmationPersonnalisee(
            "Confirmation de suppression",
            `Êtes-vous sûr de vouloir supprimer le document "<strong>${titre}</strong>" ?<br><small class="text-danger">Cette action est irréversible.</small>`,
            () => supprimerDocument(id, item)
        );
    }
});