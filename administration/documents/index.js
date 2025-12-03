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

// Containers
const containerPrincipal = document.querySelector('.row.g-4');
const containerClub = document.getElementById('documentClub');
const container4Saisons = document.getElementById('document4Saisons');
const containerPublic = document.getElementById('documentPublic');
const containerMembre = document.getElementById('documentMembre');

// Données originales
let documentsOriginaux = [];

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

function creerElementDocument(element, modeListe = false) {
    const div = document.createElement('div');
    div.className = modeListe ? 'list-group-item liste-mode-item' : 'list-group-item';
    div.id = `doc-${element.id}`;
    div.dataset.titre = element.titre.toLowerCase();
    div.dataset.categorie = element.type;
    div.dataset.date = element.date;
    
    const dateFormatee = formaterDate(element.date);
    
    if (modeListe) {
        // Mode liste - AVEC LE SELECT D'ÉDITION DE CATÉGORIE
        div.innerHTML = `
            <div class="document-item-liste">
                <div class="document-info-liste">
                    <div class="document-titre-liste">
                        <input type="text" 
                               class="form-control form-control-sm document-title-edit" 
                               value="${element.titre}" 
                               data-id="${element.id}" 
                               data-field="titre"
                               maxlength="200">
                    </div>
                    <div class="document-meta-liste">
                        <span class="document-date-liste text-muted small">
                            <i class="far fa-calendar-alt me-1"></i>${dateFormatee}
                        </span>
                        <div class="document-type-container-liste ms-2">
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
                </div>
                
                <div class="document-actions-liste">
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
    } else {
        // Mode carte
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
    }
    
    // Appliquer les couleurs aux selects
    const selects = div.querySelectorAll('.document-type-edit');
    selects.forEach(select => {
        appliquerCouleurSelect(select);
    });
    
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
    select.style.backgroundColor = couleur + '10'; // Version très claire
}

function ajouterMessageVide(container, message = 'Aucun document dans cette catégorie') {
    const existingMsg = container.querySelector('.empty-message');
    if (existingMsg) return;
    
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-message text-center py-5';
    emptyMsg.innerHTML = `<i class="fas fa-inbox fa-2x text-muted mb-3"></i><p class="text-muted">${message}</p>`;
    container.appendChild(emptyMsg);
}

// -----------------------------------------------------------------------------------
// Fonctions d'affichage
// -----------------------------------------------------------------------------------

function filtrerEtAfficherDocuments() {
    const recherche = rechercheInput.value.toLowerCase().trim();
    const categorie = filtreCategorie.value;
    const triDate = filtreDate.value;
    
    // Filtrer les documents
    let documentsFiltres = documentsOriginaux.filter(doc => {
        if (recherche && !doc.titre.toLowerCase().includes(recherche)) {
            return false;
        }
        
        if (categorie !== 'toutes' && doc.type !== categorie) {
            return false;
        }
        
        return true;
    });
    
    // Trier par date
    if (triDate === 'recent') {
        documentsFiltres.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (triDate === 'ancien') {
        documentsFiltres.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    // Afficher selon le mode
    if (categorie === 'toutes') {
        afficherModeCartes(documentsFiltres);
    } else {
        afficherModeListe(documentsFiltres, categorie);
    }
    
    // Mettre à jour les résultats
    const aFiltresActifs = recherche || categorie !== 'toutes' || triDate !== 'recent';
    
    if (aFiltresActifs) {
        resultatsRecherche.style.display = 'block';
        nombreResultats.textContent = documentsFiltres.length;
        if (nb) {
            nb.textContent = documentsFiltres.length;
            nb.style.color = '#dc3545';
        }
    } else {
        resultatsRecherche.style.display = 'none';
        if (nb) {
            nb.textContent = documentsOriginaux.length;
            nb.style.color = '#28a745';
        }
    }
}

function afficherModeCartes(documents) {
    // Masquer le conteneur de liste s'il existe
    const listeContainer = document.getElementById('conteneur-liste-unique');
    if (listeContainer) {
        listeContainer.style.display = 'none';
    }
    
    // Réinitialiser l'affichage des cartes
    [containerClub, container4Saisons, containerPublic, containerMembre].forEach(container => {
        if (container) {
            container.innerHTML = '';
            container.closest('.card').style.display = 'block';
        }
    });
    
    // Réinitialiser les compteurs
    const compteurs = {
        'club': 0,
        '4saisons': 0,
        'membre': 0,
        'public': 0
    };
    
    // Répartir les documents dans les cartes
    documents.forEach(element => {
        let container;
        switch(element.type) {
            case 'Club': container = containerClub; break;
            case '4saisons': container = container4Saisons; break;
            case 'Public': container = containerPublic; break;
            case 'Membre': container = containerMembre; break;
        }
        
        if (container) {
            const docElement = creerElementDocument(element, false);
            container.appendChild(docElement);
            compteurs[element.type.toLowerCase()]++;
        }
    });
    
    // Mettre à jour les badges
    ['club', '4saisons', 'membre', 'public'].forEach(type => {
        const badge = document.getElementById(`count-${type}`);
        const container = document.getElementById(`document${type.charAt(0).toUpperCase() + type.slice(1)}`);
        
        if (badge) badge.textContent = compteurs[type];
        if (container && container.children.length === 0) {
            ajouterMessageVide(container);
        }
    });
    
    // Masquer les cartes vides
    ['club', '4saisons', 'membre', 'public'].forEach(type => {
        const container = document.getElementById(`document${type.charAt(0).toUpperCase() + type.slice(1)}`);
        if (container && container.children.length === 0) {
            container.closest('.card').style.display = 'none';
        }
    });
}

function afficherModeListe(documents, categorie) {
    // Créer ou récupérer le conteneur de liste
    let listeContainer = document.getElementById('conteneur-liste-unique');
    
    if (!listeContainer) {
        listeContainer = document.createElement('div');
        listeContainer.id = 'conteneur-liste-unique';
        listeContainer.className = 'card border-0 shadow-sm mt-4';
        listeContainer.innerHTML = `
            <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                <h5 class="mb-0" id="titre-liste-categorie"></h5>
                <span class="badge" id="count-liste">0</span>
            </div>
            <div class="card-body p-0">
                <div class="list-group list-group-flush" id="liste-documents"></div>
            </div>
        `;
        
        // Insérer après le conteneur principal des cartes
        containerPrincipal.insertAdjacentElement('afterend', listeContainer);
    }
    
    // Masquer toutes les cartes
    [containerClub, container4Saisons, containerPublic, containerMembre].forEach(container => {
        if (container) {
            container.closest('.card').style.display = 'none';
        }
    });
    
    // Afficher le conteneur de liste
    listeContainer.style.display = 'block';
    
    // Mettre à jour le titre
    const titreCategorie = document.getElementById('titre-liste-categorie');
    const countListe = document.getElementById('count-liste');
    const listeDocuments = document.getElementById('liste-documents');
    
    if (titreCategorie) {
        const nomsCategories = {
            '4saisons': '4 saisons',
            'Club': 'Club',
            'Public': 'Public',
            'Membre': 'Membre'
        };
        titreCategorie.textContent = `Documents - ${nomsCategories[categorie] || categorie}`;
        
        // Appliquer la couleur au titre et au badge
        const couleurs = {
            '4saisons': '#28a745',
            'Club': '#007bff',
            'Public': '#17a2b8',
            'Membre': '#ffc107'
        };
        const couleur = couleurs[categorie] || '#000';
        
        titreCategorie.style.color = couleur;
        if (countListe) {
            countListe.style.backgroundColor = couleur;
            countListe.style.color = 'white';
        }
    }
    
    if (countListe) {
        countListe.textContent = documents.length;
    }
    
    // Vider et remplir la liste
    if (listeDocuments) {
        listeDocuments.innerHTML = '';
        
        if (documents.length === 0) {
            ajouterMessageVide(listeDocuments, `Aucun document dans la catégorie ${categorie}`);
            return;
        }
        
        documents.forEach(element => {
            const docElement = creerElementDocument(element, true);
            listeDocuments.appendChild(docElement);
        });
    }
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
            item.classList.add('fade-out');
            
            setTimeout(() => {
                appelAjax({
                    url: 'ajax/supprimer.php',
                    data: { id: id },
                    success: (response) => {
                        item.remove();
                        
                        documentsOriginaux = documentsOriginaux.filter(doc => doc.id !== id);
                        
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
                    
                    // Mettre à jour les données locales
                    const docIndex = documentsOriginaux.findIndex(doc => doc.id === parseInt(id));
                    if (docIndex !== -1) {
                        documentsOriginaux[docIndex].type = valeur;
                    }
                    
                    // Si on est en mode liste et qu'on change la catégorie, 
                    // l'élément ne devrait plus apparaître dans la liste actuelle
                    const categorieActive = filtreCategorie.value;
                    if (categorieActive !== 'toutes' && categorieActive !== valeur) {
                        // L'élément a changé de catégorie, on le retire de l'affichage
                        const item = element.closest('.list-group-item');
                        if (item) {
                            item.classList.add('fade-out');
                            setTimeout(() => {
                                item.remove();
                                filtrerEtAfficherDocuments();
                            }, 300);
                        }
                    } else {
                        // Sinon, on rafraîchit juste l'affichage
                        filtrerEtAfficherDocuments();
                    }
                } else if (field === 'titre') {
                    // Mettre à jour les données locales
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
                messageBox("Erreur lors de la modification", 'error');
            }
        });
    }, 800);
}

// -----------------------------------------------------------------------------------
// Gestion des événements - DELEGATION POUR LES NOUVEAUX ELEMENTS
// -----------------------------------------------------------------------------------

fichier.onchange = () => {
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

// Utiliser la délégation d'événements pour gérer les éléments créés dynamiquement
document.addEventListener('click', function(e) {
    // Remplacer
    if (e.target.closest('.btn-remplacer')) {
        const btn = e.target.closest('.btn-remplacer');
        nomFichier = btn.dataset.fichier;
        fichier.click();
    }
    
    // Supprimer
    if (e.target.closest('.btn-supprimer')) {
        const btn = e.target.closest('.btn-supprimer');
        const id = parseInt(btn.dataset.id);
        const item = btn.closest('.list-group-item');
        supprimerDocument(id, item);
    }
});

// Gestion des modifications - délégation aussi
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('document-title-edit')) {
        sauvegarderModification(e.target);
    }
});

document.addEventListener('change', function(e) {
    if (e.target.classList.contains('document-type-edit')) {
        sauvegarderModification(e.target);
    }
});

// Événements de recherche
rechercheInput.addEventListener('input', () => {
    filtrerEtAfficherDocuments();
});

filtreCategorie.addEventListener('change', () => {
    filtrerEtAfficherDocuments();
});

filtreDate.addEventListener('change', () => {
    filtrerEtAfficherDocuments();
});

btnEffacerRecherche.addEventListener('click', () => {
    rechercheInput.value = '';
    filtrerEtAfficherDocuments();
    rechercheInput.focus();
});

btnReinitialiserFiltres.addEventListener('click', reinitialiserFiltres);

rechercheInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        filtrerEtAfficherDocuments();
    }
});

// -----------------------------------------------------------------------------------
// Initialisation
// -----------------------------------------------------------------------------------

if (typeof lesDocuments !== 'undefined' && Array.isArray(lesDocuments)) {
    documentsOriginaux = lesDocuments;
    
    if (fichier && lesParametres && lesParametres.accept) {
        fichier.accept = lesParametres.accept;
    }
    
    filtrerEtAfficherDocuments();
    
    console.log('✅ Interface documents initialisée');
}
