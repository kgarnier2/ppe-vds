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

let nomFichier;
const fichier = document.getElementById('fichier');
const nb = document.getElementById('nb');

// Éléments de recherche
const rechercheInput = document.getElementById('rechercheInput');
const filtreCategorie = document.getElementById('filtreCategorie');
const filtreDate = document.getElementById('filtreDate');
const btnEffacerRecherche = document.getElementById('btnEffacerRecherche');
const resultatsRecherche = document.getElementById('resultatsRecherche');
const nombreResultats = document.getElementById('nombreResultats');
const btnReinitialiserFiltres = document.getElementById('btnReinitialiserFiltres');

// Données originales (pour réinitialiser)
let documentsOriginaux = [...lesDocuments];

// -----------------------------------------------------------------------------------
// Fonctions utilitaires
// -----------------------------------------------------------------------------------

function formaterDate(dateStr) {
    if (!dateStr) return 'Non définie';
    
    const str = String(dateStr);
    const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        return match[3] + '/' + match[2] + '/' + match[1];
    }
    
    return str;
}

function creerElementDocument(element) {
    const div = document.createElement('div');
    div.className = 'list-group-item';
    div.id = `doc-${element.id}`;
    div.dataset.titre = element.titre.toLowerCase();
    div.dataset.categorie = element.type;
    div.dataset.date = element.date;
    
    const dateFormatee = formaterDate(element.date);
    
    div.innerHTML = `
        <div class="document-item">
            <div class="document-info">
                <div class="mb-2">
                    <input type="text" 
                           class="form-control form-control-sm document-title-edit" 
                           value="${element.titre}" 
                           data-id="${element.id}" 
                           data-field="titre"
                           maxlength="200">
                </div>
                
                <div class="document-date text-muted small mb-2">
                    <i class="far fa-calendar-alt me-1"></i>${dateFormatee}
                </div>
                
                <div class="mb-2">
                    <select class="form-select form-select-sm document-type-edit" 
                            data-id="${element.id}" 
                            data-field="type"
                            style="max-width: 140px; font-weight: 500;">
                        <option value="4saisons" ${element.type === '4saisons' ? 'selected' : ''} style="color: #28a745; font-weight: 500;">4 saisons</option>
                        <option value="Club" ${element.type === 'Club' ? 'selected' : ''} style="color: #007bff; font-weight: 500;">Club</option>
                        <option value="Public" ${element.type === 'Public' ? 'selected' : ''} style="color: #17a2b8; font-weight: 500;">Public</option>
                        <option value="Membre" ${element.type === 'Membre' ? 'selected' : ''} style="color: #ffc107; font-weight: 500;">Membre</option>
                    </select>
                </div>
            </div>
            
            <div class="document-actions">
                ${element.present ? 
                    `<a href="afficherdocument.php?id=${element.id}" target="_blank" 
                       class="btn btn-sm btn-outline-primary" 
                       title="Voir le document">
                        <i class="fas fa-eye"></i>
                    </a>` : 
                    `<span class="btn btn-sm btn-outline-secondary" title="Document non trouvé">
                        <i class="fas fa-question"></i>
                    </span>`
                }
                <button class="btn btn-sm btn-outline-warning btn-remplacer" 
                        data-id="${element.id}" 
                        data-fichier="${element.fichier}"
                        title="Remplacer le fichier">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-supprimer" 
                        data-id="${element.id}"
                        title="Supprimer le document">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    const select = div.querySelector('.document-type-edit');
    if (select) {
        appliquerCouleurSelect(select);
    }
    
    return div;
}

function appliquerCouleurSelect(select) {
    const couleurs = {
        '4saisons': '#28a745',
        'Club': '#007bff',
        'Public': '#17a2b8',
        'Membre': '#ffc107'
    };
    
    const couleur = couleurs[select.value] || '#6c757d';
    select.style.color = couleur;
    select.style.borderColor = couleur;
}

function ajouterMessageVide(container) {
    const existingMsg = container.querySelector('.empty-message');
    if (existingMsg) return;
    
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-message';
    emptyMsg.textContent = 'Aucun document dans cette catégorie';
    container.appendChild(emptyMsg);
}

function getContainerForType(type) {
    const t = (type||'').toLowerCase().trim();
    if (t === '4saisons' || t === '4 saisons') return document.getElementById('document4Saisons');
    if (t === 'club' || t === 'administratif') return document.getElementById('documentClub');
    if (t === 'technique' || t === 'public') return document.getElementById('documentPublic');
    if (t === 'general' || t === 'membre') return document.getElementById('documentMembre');
    return null;
}

// -----------------------------------------------------------------------------------
// Fonctions de recherche et filtrage
// -----------------------------------------------------------------------------------

function filtrerEtAfficherDocuments() {
    const recherche = rechercheInput.value.toLowerCase().trim();
    const categorie = filtreCategorie.value;
    const triDate = filtreDate.value;
    
    // Filtrer les documents
    let documentsFiltres = documentsOriginaux.filter(doc => {
        // Filtre par recherche
        if (recherche && !doc.titre.toLowerCase().includes(recherche)) {
            return false;
        }
        
        // Filtre par catégorie
        if (categorie !== 'toutes' && doc.type !== categorie) {
            return false;
        }
        
        return true;
    });
    
    // Trier par date si demandé
    if (triDate === 'recent') {
        documentsFiltres.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (triDate === 'ancien') {
        documentsFiltres.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    // Mettre à jour l'affichage
    afficherDocumentsFiltres(documentsFiltres);
    
    // Afficher/masquer les résultats de recherche
    const aFiltresActifs = recherche || categorie !== 'toutes' || triDate !== 'recent';
    
    if (aFiltresActifs) {
        resultatsRecherche.style.display = 'block';
        nombreResultats.textContent = documentsFiltres.length;
        nb.textContent = documentsFiltres.length;
        nb.style.color = '#dc3545';
    } else {
        resultatsRecherche.style.display = 'none';
        nb.textContent = documentsOriginaux.length;
        nb.style.color = '#28a745';
    }
}

function afficherDocumentsFiltres(documents) {
    // Vider tous les conteneurs
    document.querySelectorAll('#documentClub, #document4Saisons, #documentPublic, #documentMembre').forEach(container => {
        container.innerHTML = '';
    });
    
    // Réinitialiser les compteurs
    const compteurs = {
        'club': 0,
        '4saisons': 0,
        'membre': 0,
        'public': 0
    };
    
    // Afficher les documents filtrés
    documents.forEach(element => {
        const container = getContainerForType(element.type);
        if (container) {
            const docElement = creerElementDocument(element);
            container.appendChild(docElement);
            
            const typeKey = element.type.toLowerCase();
            if (compteurs[typeKey] !== undefined) {
                compteurs[typeKey]++;
            }
        }
    });
    
    // Mettre à jour les badges de comptage
    Object.keys(compteurs).forEach(type => {
        const badge = document.getElementById(`count-${type}`);
        const container = document.getElementById(`document${type.charAt(0).toUpperCase() + type.slice(1)}`);
        
        if (badge) {
            badge.textContent = compteurs[type];
        }
        
        if (container && container.children.length === 0) {
            ajouterMessageVide(container);
        }
    });
}

function reinitialiserFiltres() {
    rechercheInput.value = '';
    filtreCategorie.value = 'toutes';
    filtreDate.value = 'recent';
    filtrerEtAfficherDocuments();
}

// -----------------------------------------------------------------------------------
// Fonction de suppression
// -----------------------------------------------------------------------------------

function supprimerDocument(id, item) {
    const titre = item.querySelector('.document-title-edit').value;
    
    confirmer(
        "Confirmation de suppression",
        `Êtes-vous sûr de vouloir supprimer le document "<strong>${titre}</strong>" ?<br><small class="text-danger">Cette action est irréversible.</small>`,
        () => {
            // Animation de sortie
            item.classList.add('fade-out');
            
            setTimeout(() => {
                appelAjax({
                    url: 'ajax/supprimer.php',
                    data: { id: id },
                    success: (response) => {
                        item.remove();
                        
                        // Mettre à jour les données originales
                        documentsOriginaux = documentsOriginaux.filter(doc => doc.id !== id);
                        
                        // Mettre à jour l'affichage filtré
                        filtrerEtAfficherDocuments();
                        
                        messageBox("Document supprimé avec succès", 'success');
                    },
                    error: (err) => {
                        item.classList.remove('fade-out');
                        console.error('Erreur suppression:', err);
                        messageBox("Erreur lors de la suppression: " + (err.message || 'Erreur inconnue'), 'error');
                    }
                });
            }, 300);
        }
    );
}

// -----------------------------------------------------------------------------------
// Fonction de remplacement de fichier
// -----------------------------------------------------------------------------------

function remplacer(file) {
    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('nomFichier', nomFichier);
    
    appelAjax({
        url: 'ajax/remplacer.php',
        data: formData,
        method: 'POST',
        processData: false,
        contentType: false,
        success: (response) => {
            if (response.success) {
                messageBox("✅ Fichier remplacé avec succès");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else if (response.error) {
                messageBox("❌ " + response.error, 'error');
            }
        },
        error: (err) => {
            messageBox("Erreur lors du remplacement du fichier", 'error');
        }
    });
}

// -----------------------------------------------------------------------------------
// Fonction de modification de document
// -----------------------------------------------------------------------------------

let timeoutSauvegarde = null;

function sauvegarderModification(element) {
    const id = element.dataset.id;
    const field = element.dataset.field;
    const valeur = element.value;
    
    if (field === 'titre' && valeur.trim().length < 3) {
        element.classList.add('error-border');
        setTimeout(() => element.classList.remove('error-border'), 2000);
        messageBox("Le titre doit faire au moins 3 caractères", 'error');
        return;
    }
    
    element.classList.add('saving');
    clearTimeout(timeoutSauvegarde);
    
    timeoutSauvegarde = setTimeout(() => {
        appelAjax({
            url: '/ajax/modifiercolonne.php',
            data: {
                table: 'document',
                colonne: field,
                valeur: valeur,
                id: parseInt(id)
            },
            success: (response) => {
                element.classList.remove('saving');
                element.classList.add('success-border');
                setTimeout(() => element.classList.remove('success-border'), 1000);
                
                if (field === 'type') {
                    appliquerCouleurSelect(element);
                    
                    // Mettre à jour les données originales
                    const docIndex = documentsOriginaux.findIndex(doc => doc.id === parseInt(id));
                    if (docIndex !== -1) {
                        documentsOriginaux[docIndex].type = valeur;
                    }
                    
                    // Re-filtrer pour refléter le changement
                    filtrerEtAfficherDocuments();
                } else if (field === 'titre') {
                    // Mettre à jour les données originales
                    const docIndex = documentsOriginaux.findIndex(doc => doc.id === parseInt(id));
                    if (docIndex !== -1) {
                        documentsOriginaux[docIndex].titre = valeur;
                    }
                }
            },
            error: (err) => {
                element.classList.remove('saving');
                element.classList.add('error-border');
                setTimeout(() => element.classList.remove('error-border'), 2000);
                console.error('Erreur modification:', err);
            }
        });
    }, 800);
}

// -----------------------------------------------------------------------------------
// Gestion des événements
// -----------------------------------------------------------------------------------

// sur la sélection d'un fichier
fichier.onchange = function() {
    effacerLesErreurs();
    if (fichier.files.length > 0) {
        let file = fichier.files[0];
        if (fichierValide(file, lesParametres)) {
            remplacer(file);
        } else {
            messageBox("Type de fichier non autorisé", 'error');
        }
    }
};

// Gestion des clics
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
        supprimerDocument(id, item);
    }
});

// Gestion des modifications inline
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('document-title-edit')) {
        sauvegarderModification(e.target);
    }
});

// Gestion du changement de type
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('document-type-edit')) {
        sauvegarderModification(e.target);
    }
});

// Événements de recherche
if (rechercheInput) {
    rechercheInput.addEventListener('input', function() {
        filtrerEtAfficherDocuments();
    });
}

if (filtreCategorie) {
    filtreCategorie.addEventListener('change', function() {
        filtrerEtAfficherDocuments();
    });
}

if (filtreDate) {
    filtreDate.addEventListener('change', function() {
        filtrerEtAfficherDocuments();
    });
}

if (btnEffacerRecherche) {
    btnEffacerRecherche.addEventListener('click', function() {
        rechercheInput.value = '';
        filtrerEtAfficherDocuments();
        rechercheInput.focus();
    });
}

if (btnReinitialiserFiltres) {
    btnReinitialiserFiltres.addEventListener('click', reinitialiserFiltres);
}

// Recherche avec Entrée
if (rechercheInput) {
    rechercheInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            filtrerEtAfficherDocuments();
        }
    });
}

// -----------------------------------------------------------------------------------
// Programme principal
// -----------------------------------------------------------------------------------

// Initialisation
if (fichier && lesParametres) {
    fichier.accept = lesParametres.accept;
}

// Afficher tous les documents initialement
if (typeof filtrerEtAfficherDocuments === 'function') {
    filtrerEtAfficherDocuments();
}

console.log('✅ Interface documents initialisée avec recherche et filtres');