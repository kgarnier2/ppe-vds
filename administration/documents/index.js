"use strict";

import {appelAjax} from "/composant/fonction/ajax.js";
import {messageBox} from "/composant/fonction/afficher.js";
import {fichierValide, effacerLesErreurs} from "/composant/fonction/formulaire.js";

// Variables globales
let nomFichier;
const fichier = document.getElementById('fichier');
const nb = document.getElementById('nb');
const rechercheInput = document.getElementById('rechercheInput');
const filtreCategorie = document.getElementById('filtreCategorie');
const filtreDate = document.getElementById('filtreDate');
const btnEffacerRecherche = document.getElementById('btnEffacerRecherche');
const resultatsRecherche = document.getElementById('resultatsRecherche');
const nombreResultats = document.getElementById('nombreResultats');
const btnReinitialiserFiltres = document.getElementById('btnReinitialiserFiltres');
const containerPrincipal = document.querySelector('.row.g-4');
const containerClub = document.getElementById('documentClub');
const container4Saisons = document.getElementById('document4Saisons');
const containerPublic = document.getElementById('documentPublic');
const containerMembre = document.getElementById('documentMembre');

let documentsOriginaux = [];
let timeoutSauvegarde = null;

// -----------------------------------------------------------------------------------
// FONCTION DE CONFIRMATION GRAPHIQUE
// -----------------------------------------------------------------------------------
function confirmationGraphique(titre, message) {
    return new Promise((resolve) => {
        const modalId = 'confirmation-modal-' + Date.now();
        
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-triangle me-2"></i>${titre}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="d-flex align-items-start mb-3">
                                <div class="me-3">
                                    <i class="fas fa-question-circle fa-2x text-warning"></i>
                                </div>
                                <div>
                                    ${message}
                                    <div class="alert alert-warning mt-3 mb-0">
                                        <i class="fas fa-exclamation-circle me-2"></i>
                                        <small>Cette action est irréversible</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>Annuler
                            </button>
                            <button type="button" class="btn btn-danger" id="btnConfirmerSuppression">
                                <i class="fas fa-trash me-2"></i>Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement);
        
        document.getElementById('btnConfirmerSuppression').addEventListener('click', function() {
            modal.hide();
            setTimeout(() => {
                modalContainer.remove();
                resolve(true);
            }, 300);
        });
        
        modalElement.addEventListener('hidden.bs.modal', function() {
            setTimeout(() => {
                modalContainer.remove();
                resolve(false);
            }, 300);
        });
        
        modal.show();
    });
}

// -----------------------------------------------------------------------------------
// FONCTIONS UTILITAIRES
// -----------------------------------------------------------------------------------
function formaterDate(dateStr) {
    if (!dateStr) return 'Non définie';
    const str = String(dateStr);
    const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) return match[3] + '/' + match[2] + '/' + match[1];
    return str;
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
    select.style.backgroundColor = couleur + '10';
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
// CRÉATION DES ÉLÉMENTS DOCUMENT
// -----------------------------------------------------------------------------------
function creerElementDocument(element, modeListe = false) {
    const div = document.createElement('div');
    div.className = modeListe ? 'list-group-item liste-mode-item' : 'list-group-item';
    div.id = `doc-${element.id}`;
    div.dataset.titre = element.titre.toLowerCase();
    div.dataset.categorie = element.type;
    div.dataset.date = element.date;
    
    const dateFormatee = formaterDate(element.date);
    const description = element.description || '';
    
    if (modeListe) {
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
                    <div class="document-description-liste mt-2">
                        <textarea class="form-control form-control-sm document-description-edit"
                                  data-id="${element.id}"
                                  data-field="description"
                                  rows="2"
                                  maxlength="500"
                                  placeholder="Description (optionnelle)">${description}</textarea>
                        <small class="text-muted">${description.length}/500</small>
                    </div>
                    <div class="document-meta-liste mt-2">
                        <span class="document-date-liste text-muted small">
                            <i class="far fa-calendar-alt me-1"></i>${dateFormatee}
                        </span>
                        <div class="document-type-container-liste ms-2">
                            <select class="form-select form-select-sm document-type-edit" 
                                    data-id="${element.id}" 
                                    data-field="type">
                                <option value="4saisons" ${element.type === '4saisons' ? 'selected' : ''}>4 saisons</option>
                                <option value="Club" ${element.type === 'Club' ? 'selected' : ''}>Club</option>
                                <option value="Public" ${element.type === 'Public' ? 'selected' : ''}>Public</option>
                                <option value="Membre" ${element.type === 'Membre' ? 'selected' : ''}>Membre</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="document-actions-liste">
                    ${element.present ? 
                        `<a href="afficherdocument.php?id=${element.id}" target="_blank" 
                           class="btn btn-sm btn-outline-primary" title="Voir">
                            <i class="fas fa-eye"></i>
                        </a>` : 
                        `<span class="btn btn-sm btn-outline-secondary" title="Non trouvé">
                            <i class="fas fa-question"></i>
                        </span>`
                    }
                    <button class="btn btn-sm btn-outline-warning btn-remplacer" 
                            data-id="${element.id}" data-fichier="${element.fichier}"
                            title="Remplacer">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-supprimer" 
                            data-id="${element.id}" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    } else {
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
                    <div class="mb-2">
                        <textarea class="form-control form-control-sm document-description-edit"
                                  data-id="${element.id}"
                                  data-field="description"
                                  rows="2"
                                  maxlength="500"
                                  placeholder="Description (optionnelle)">${description}</textarea>
                        <small class="text-muted">${description.length}/500</small>
                    </div>
                    <div class="document-date text-muted small mb-2">
                        <i class="far fa-calendar-alt me-1"></i>${dateFormatee}
                    </div>
                    <div class="mb-2">
                        <select class="form-select form-select-sm document-type-edit" 
                                data-id="${element.id}" 
                                data-field="type">
                            <option value="4saisons" ${element.type === '4saisons' ? 'selected' : ''}>4 saisons</option>
                            <option value="Club" ${element.type === 'Club' ? 'selected' : ''}>Club</option>
                            <option value="Public" ${element.type === 'Public' ? 'selected' : ''}>Public</option>
                            <option value="Membre" ${element.type === 'Membre' ? 'selected' : ''}>Membre</option>
                        </select>
                    </div>
                </div>
                <div class="document-actions">
                    ${element.present ? 
                        `<a href="afficherdocument.php?id=${element.id}" target="_blank" 
                           class="btn btn-sm btn-outline-primary" title="Voir">
                            <i class="fas fa-eye"></i>
                        </a>` : 
                        `<span class="btn btn-sm btn-outline-secondary" title="Non trouvé">
                            <i class="fas fa-question"></i>
                        </span>`
                    }
                    <button class="btn btn-sm btn-outline-warning btn-remplacer" 
                            data-id="${element.id}" data-fichier="${element.fichier}"
                            title="Remplacer">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-supprimer" 
                            data-id="${element.id}" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    div.querySelectorAll('.document-type-edit').forEach(select => {
        appliquerCouleurSelect(select);
    });
    
    return div;
}

// -----------------------------------------------------------------------------------
// FONCTIONS D'AFFICHAGE
// -----------------------------------------------------------------------------------
function filtrerEtAfficherDocuments() {
    const recherche = rechercheInput.value.toLowerCase().trim();
    const categorie = filtreCategorie.value;
    const triDate = filtreDate.value;
    
    let documentsFiltres = documentsOriginaux.filter(doc => {
        if (recherche && !doc.titre.toLowerCase().includes(recherche)) return false;
        if (categorie !== 'toutes' && doc.type !== categorie) return false;
        return true;
    });
    
    if (triDate === 'recent') {
        documentsFiltres.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (triDate === 'ancien') {
        documentsFiltres.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    if (categorie === 'toutes') {
        afficherModeCartes(documentsFiltres);
    } else {
        afficherModeListe(documentsFiltres, categorie);
    }
    
    const aFiltresActifs = recherche || categorie !== 'toutes' || triDate !== 'recent';
    if (aFiltresActifs) {
        resultatsRecherche.style.display = 'block';
        nombreResultats.textContent = documentsFiltres.length;
        if (nb) nb.textContent = documentsFiltres.length;
    } else {
        resultatsRecherche.style.display = 'none';
        if (nb) nb.textContent = documentsOriginaux.length;
    }
}

function afficherModeCartes(documents) {
    const listeContainer = document.getElementById('conteneur-liste-unique');
    if (listeContainer) listeContainer.style.display = 'none';
    
    [containerClub, container4Saisons, containerPublic, containerMembre].forEach(container => {
        if (container) {
            container.innerHTML = '';
            container.closest('.card').style.display = 'block';
        }
    });
    
    const compteurs = { 'club': 0, '4saisons': 0, 'membre': 0, 'public': 0 };
    
    documents.forEach(element => {
        let container;
        switch(element.type) {
            case 'Club': container = containerClub; break;
            case '4saisons': container = container4Saisons; break;
            case 'Public': container = containerPublic; break;
            case 'Membre': container = containerMembre; break;
        }
        if (container) {
            container.appendChild(creerElementDocument(element, false));
            compteurs[element.type.toLowerCase()]++;
        }
    });
    
    ['club', '4saisons', 'membre', 'public'].forEach(type => {
        const badge = document.getElementById(`count-${type}`);
        const container = document.getElementById(`document${type.charAt(0).toUpperCase() + type.slice(1)}`);
        if (badge) badge.textContent = compteurs[type];
        if (container && container.children.length === 0) {
            ajouterMessageVide(container);
        }
    });
    
    ['club', '4saisons', 'membre', 'public'].forEach(type => {
        const container = document.getElementById(`document${type.charAt(0).toUpperCase() + type.slice(1)}`);
        if (container && container.children.length === 0) {
            container.closest('.card').style.display = 'none';
        }
    });
}

function afficherModeListe(documents, categorie) {
    let listeContainer = document.getElementById('conteneur-liste-unique');
    if (!listeContainer) {
        listeContainer = document.createElement('div');
        listeContainer.id = 'conteneur-liste-unique';
        listeContainer.className = 'card border-0 shadow-sm mt-4';
        listeContainer.innerHTML = `
            <div class="card-header bg-white border-bottom">
                <h5 class="mb-0" id="titre-liste-categorie"></h5>
                <span class="badge" id="count-liste">0</span>
            </div>
            <div class="card-body p-0">
                <div class="list-group list-group-flush" id="liste-documents"></div>
            </div>
        `;
        containerPrincipal.insertAdjacentElement('afterend', listeContainer);
    }
    
    [containerClub, container4Saisons, containerPublic, containerMembre].forEach(container => {
        if (container) container.closest('.card').style.display = 'none';
    });
    
    listeContainer.style.display = 'block';
    
    const titreCategorie = document.getElementById('titre-liste-categorie');
    const countListe = document.getElementById('count-liste');
    const listeDocuments = document.getElementById('liste-documents');
    
    if (titreCategorie) {
        const nomsCategories = {
            '4saisons': '4 saisons', 'Club': 'Club', 'Public': 'Public', 'Membre': 'Membre'
        };
        titreCategorie.textContent = `Documents - ${nomsCategories[categorie] || categorie}`;
        const couleurs = {
            '4saisons': '#28a745', 'Club': '#007bff', 'Public': '#17a2b8', 'Membre': '#ffc107'
        };
        const couleur = couleurs[categorie] || '#000';
        titreCategorie.style.color = couleur;
        if (countListe) {
            countListe.style.backgroundColor = couleur;
            countListe.style.color = 'white';
        }
    }
    
    if (countListe) countListe.textContent = documents.length;
    
    if (listeDocuments) {
        listeDocuments.innerHTML = '';
        if (documents.length === 0) {
            ajouterMessageVide(listeDocuments, `Aucun document dans ${categorie}`);
            return;
        }
        documents.forEach(element => {
            listeDocuments.appendChild(creerElementDocument(element, true));
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
// SUPPRESSION DE DOCUMENT
// -----------------------------------------------------------------------------------
async function supprimerDocument(id, item) {
    const titre = item.querySelector('.document-title-edit').value;
    
    const confirme = await confirmationGraphique(
        "Confirmation de suppression",
        `Êtes-vous sûr de vouloir supprimer "<strong>${titre}</strong>" ?`
    );
    
    if (confirme) {
        item.classList.add('fade-out');
        setTimeout(() => {
            appelAjax({
                url: 'ajax/supprimer.php',
                data: { id: id },
                success: (response) => {
                    item.remove();
                    documentsOriginaux = documentsOriginaux.filter(doc => doc.id !== id);
                    filtrerEtAfficherDocuments();
                    messageBox("✅ Document supprimé", 'success');
                },
                error: (err) => {
                    item.classList.remove('fade-out');
                    messageBox("❌ Erreur: " + (err.message || 'Erreur'), 'error');
                }
            });
        }, 300);
    }
}

// -----------------------------------------------------------------------------------
// REMPLACEMENT DE FICHIER
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
                messageBox("✅ Fichier remplacé");
                setTimeout(() => window.location.reload(), 1500);
            } else if (response.error) {
                messageBox("❌ " + response.error, 'error');
            }
        },
        error: (err) => {
            messageBox("❌ Erreur remplacement", 'error');
        }
    });
}

// -----------------------------------------------------------------------------------
// MODIFICATION DE DOCUMENT
// -----------------------------------------------------------------------------------
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
    
    if (field === 'description' && element.tagName === 'TEXTAREA') {
        const counter = element.parentElement.querySelector('small');
        if (counter) {
            counter.textContent = `${valeur.length}/500 caractères`;
        }
    }
    
    // Ajouter l'indicateur de sauvegarde en cours
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
                // Retirer l'indicateur de sauvegarde
                element.classList.remove('saving');
                
                // Ajouter l'encadré vert pour SUCCÈS
                element.classList.add('success-border');
                
                // Pour le TITRE uniquement, garder le bord vert un peu plus longtemps
                // et ajouter un effet visuel spécifique
                if (field === 'titre') {
                    // Animation plus visible pour le titre
                    element.style.transition = 'all 0.3s ease';
                    element.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.3)';
                    
                    // Créer un petit indicateur de succès à côté du titre
                    const successIcon = document.createElement('span');
                    successIcon.className = 'saved-indicator ms-2';
                    successIcon.innerHTML = '<i class="fas fa-check text-success"></i>';
                    successIcon.style.fontSize = '0.8rem';
                    
                    // Vérifier si un indicateur existe déjà
                    const existingIcon = element.parentElement.querySelector('.saved-indicator');
                    if (existingIcon) {
                        existingIcon.remove();
                    }
                    
                    // Ajouter l'icône après le champ titre
                    element.parentElement.appendChild(successIcon);
                    
                    // Retirer l'icône après 3 secondes
                    setTimeout(() => {
                        if (successIcon.parentElement) {
                            successIcon.remove();
                        }
                    }, 3000);
                }
                
                // Retirer l'encadré vert après 2 secondes
                setTimeout(() => {
                    element.classList.remove('success-border');
                    if (field === 'titre') {
                        element.style.boxShadow = '';
                    }
                }, 2000);
                
                // Mettre à jour les données locales
                const docIndex = documentsOriginaux.findIndex(doc => doc.id === parseInt(id));
                if (docIndex !== -1) {
                    documentsOriginaux[docIndex][field] = valeur;
                }
                
                // Actions spécifiques par champ
                if (field === 'type') {
                    appliquerCouleurSelect(element);
                    filtrerEtAfficherDocuments();
                }
            },
            error: (err) => {
                // Retirer l'indicateur de sauvegarde
                element.classList.remove('saving');
                
                // Ajouter l'encadré rouge pour ERREUR
                element.classList.add('error-border');
                
                // Pour le TITRE uniquement, effet d'erreur plus visible
                if (field === 'titre') {
                    element.style.transition = 'all 0.3s ease';
                    element.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.3)';
                }
                
                // Retirer l'encadré rouge après 3 secondes
                setTimeout(() => {
                    element.classList.remove('error-border');
                    if (field === 'titre') {
                        element.style.boxShadow = '';
                    }
                }, 3000);
                
                messageBox("Erreur lors de la modification", 'error');
            }
        });
    }, 800);
}

// -----------------------------------------------------------------------------------
// ÉVÉNEMENTS
// -----------------------------------------------------------------------------------
fichier.onchange = () => {
    effacerLesErreurs();
    if (fichier.files.length > 0) {
        let file = fichier.files[0];
        if (fichierValide(file, lesParametres)) {
            remplacer(file);
        } else {
            messageBox("❌ Fichier non autorisé", 'error');
        }
    }
};

document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-remplacer')) {
        const btn = e.target.closest('.btn-remplacer');
        nomFichier = btn.dataset.fichier;
        fichier.click();
    }
    
    if (e.target.closest('.btn-supprimer')) {
        const btn = e.target.closest('.btn-supprimer');
        const id = parseInt(btn.dataset.id);
        const item = btn.closest('.list-group-item');
        if (id && item) {
            supprimerDocument(id, item);
        }
    }
});

document.addEventListener('input', function(e) {
    if (e.target.classList.contains('document-title-edit') || 
        e.target.classList.contains('document-description-edit')) {
        sauvegarderModification(e.target);
    }
});

document.addEventListener('change', function(e) {
    if (e.target.classList.contains('document-type-edit')) {
        sauvegarderModification(e.target);
    }
});

rechercheInput.addEventListener('input', filtrerEtAfficherDocuments);
filtreCategorie.addEventListener('change', filtrerEtAfficherDocuments);
filtreDate.addEventListener('change', filtrerEtAfficherDocuments);

btnEffacerRecherche.addEventListener('click', () => {
    rechercheInput.value = '';
    filtrerEtAfficherDocuments();
    rechercheInput.focus();
});

btnReinitialiserFiltres.addEventListener('click', reinitialiserFiltres);
rechercheInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') filtrerEtAfficherDocuments();
});

// -----------------------------------------------------------------------------------
// INITIALISATION
// -----------------------------------------------------------------------------------
if (typeof lesDocuments !== 'undefined' && Array.isArray(lesDocuments)) {
    documentsOriginaux = lesDocuments;
    if (fichier && lesParametres && lesParametres.accept) {
        fichier.accept = lesParametres.accept;
    }
    filtrerEtAfficherDocuments();
}