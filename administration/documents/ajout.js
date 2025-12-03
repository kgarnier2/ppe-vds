"use strict";

// administration/documents/ajout.js
// Utilise appelAjax et les helpers existants pour valider et envoyer le fichier via ajax/ajouter.php

import {appelAjax} from "/composant/fonction/ajax.js";
import {retournerVers, afficherSousLeChamp} from '/composant/fonction/afficher.js';
import {
    configurerFormulaire, configurerDate,
    filtrerLaSaisie,
    donneesValides,
    fichierValide,
    effacerLesErreurs
} from "/composant/fonction/formulaire.js";

import {getDateRelative} from "/composant/fonction/date";

// GLOBALS fournis par ajout.php (lesParametres)
let leFichier = null; // fichier sélectionné pour l'ajout

const inputFichier = document.getElementById('fichierDocument');
const nomFichier = document.getElementById('nomFichier');
const inputTitre = document.getElementById('titreDocument');
const selectType = document.getElementById('typeDocument');
const inputDate = document.getElementById('dateDocument');
const textareaDescription = document.getElementById('descriptionDocument');
const form = document.getElementById('formAjoutDocument');
const btnChoisir = document.getElementById('btnChoisirFichier');
const msgEl = document.getElementById('msgAjoutDocument');

if (!form) {
    console.warn('formAjoutDocument introuvable');
} else {

    // Initialisation
    configurerFormulaire();

    // accepter les extensions paramétrées
    if (typeof lesParametres !== 'undefined' && inputFichier) {
        inputFichier.accept = lesParametres.accept;
    }

    // Valeur par défaut pour la date : aujourd'hui
    if (inputDate && !inputDate.value) {
        const d = new Date();
        inputDate.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // décorations / filtres similaires à classement
    filtrerLaSaisie('titreDocument', /[0-9A-Za-zÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ,' \-]/);

    // bouton custom pour sélectionner fichier
    if (btnChoisir && inputFichier) {
        btnChoisir.addEventListener('click', (e) => {
            e.preventDefault();
            inputFichier.click();
        });
    }

    // événement changement fichier
    if (inputFichier) {
        inputFichier.addEventListener('change', () => {
            effacerLesErreurs();
            if (inputFichier.files && inputFichier.files.length > 0) {
                controlerFichier(inputFichier.files[0]);
            } else {
                leFichier = null;
                nomFichier.textContent = '';
            }
        });
    }

    // validation et ajout au clic du bouton ou submit du form
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        effacerLesErreurs();

        // nettoyer titre
        inputTitre.value = inputTitre.value.trim().replace(/\s+/g, ' ');

        if (!validerFormulaire()) {
            return;
        }

        // tout ok -> lancer ajout via AJAX
        ajouterDocument();
    });

    // fonction de contrôle du fichier avec messages spécifiques
    function controlerFichier(file) {
        if (fichierValide(file, lesParametres)) {
            // Vérifier spécifiquement que c'est un PDF
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                afficherSousLeChamp('fichierDocument', '❌ Seuls les fichiers PDF sont acceptés.');
                leFichier = null;
                nomFichier.textContent = '';
                return;
            }
            
            // Vérifier la taille (1 Mo)
            if (file.size > 1024 * 1024) {
                afficherSousLeChamp('fichierDocument', '❌ Le fichier dépasse 1 Mo (taille max: 1 Mo).');
                leFichier = null;
                nomFichier.textContent = '';
                return;
            }
            
            nomFichier.textContent = file.name;
            leFichier = file;
            
            // proposer un titre par défaut si vide
            if (inputTitre && inputTitre.value.length === 0) {
                // enlever extension .pdf si présente
                const name = file.name.replace(/\.[^/.]+$/, "");
                inputTitre.value = name;
            }
        } else {
            leFichier = null;
            nomFichier.textContent = '';
        }
    }

    // Validation spécifique avant envoi avec messages clairs
    function validerFormulaire() {
        let erreurs = [];
        
        // Validation titre
        const titre = inputTitre.value.trim();
        if (titre.length === 0) {
            erreurs.push({ champ: 'titreDocument', message: '❌ Le titre est obligatoire' });
        } else if (titre.length < 10) {
            erreurs.push({ champ: 'titreDocument', message: '❌ Le titre doit faire au moins 10 caractères' });
        } else if (titre.length > 70) {
            erreurs.push({ champ: 'titreDocument', message: '❌ Le titre ne doit pas dépasser 70 caractères' });
        } else if (!/^[A-Za-z0-9 ,'\-]+[?!]?$/.test(titre)) {
            erreurs.push({ champ: 'titreDocument', message: '❌ Caractères non autorisés. Autorisés: lettres, chiffres, espaces, virgules, apostrophes, tirets. Peut finir par ? ou !' });
    }
        
        // Validation catégorie
        if (!selectType.value) {
            erreurs.push({ champ: 'typeDocument', message: '❌ La catégorie est obligatoire' });
        }
        
        // Validation date
        if (!inputDate.value) {
            erreurs.push({ champ: 'dateDocument', message: '❌ La date est obligatoire' });
        } else {
            // Vérifier que la date n'est pas dans le futur
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(inputDate.value);
        }
        
        // Validation fichier
        if (!leFichier) {
            erreurs.push({ champ: 'fichierDocument', message: '❌ Le fichier PDF est obligatoire' });
        }
        
        // Validation description (optionnelle mais avec limite)
        if (textareaDescription.value.length > 500) {
            erreurs.push({ champ: 'descriptionDocument', message: '❌ La description ne doit pas dépasser 500 caractères' });
        }
        
        // Afficher les erreurs
        erreurs.forEach(erreur => {
            afficherSousLeChamp(erreur.champ, erreur.message);
        });
        
        // Highlight des champs en erreur
        erreurs.forEach(erreur => {
            const element = document.getElementById(erreur.champ);
            if (element) {
                element.classList.add('error-border');
                setTimeout(() => element.classList.remove('error-border'), 3000);
            }
        });
        
        return erreurs.length === 0;
    }

    // envoi via appelAjax (wrapper existant) vers administration/documents/ajax/ajouter.php
    function ajouterDocument() {
        // Afficher l'indicateur de chargement
        const btnAjouter = document.getElementById('btnAjouter');
        const originalText = btnAjouter ? btnAjouter.innerHTML : 'Ajouter le document';
        
        if (btnAjouter) {
            btnAjouter.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Ajout en cours...';
            btnAjouter.disabled = true;
        }
        
        // construction du formData
        const fd = new FormData();
        fd.append('fichier', leFichier);
        fd.append('titre', inputTitre.value);
        fd.append('type', selectType.value);
        fd.append('date', inputDate.value);
        fd.append('description', textareaDescription.value);

        // utilisation d'appelAjax qui gère fetch + headers + erreur standard du projet
        appelAjax({
            url: 'ajax/ajouter.php',
            data: fd,
            // appelAjax gère JSON et success callback
            success: (response) => {
                // La réponse d'ajouter.php renvoie { success: <id> } en cas de succès
                // Afficher message et rediriger / mettre à jour UI
                try {
                    // si response contient success id
                    const id = response && response.success ? response.success : null;
                    if (id) {
                        // notifier et revenir à l'index
                        retournerVers("✅ Document ajouté avec succès", '.');
                        // déclencher événement pour rafraîchir l'affichage public si présent
                        document.dispatchEvent(new Event('documents:updated'));
                    } else {
                        // si format différent, afficher message générique
                        afficherMessageErreur("Réponse inattendue du serveur");
                    }
                } catch (err) {
                    console.error(err);
                    afficherMessageErreur("Erreur lors du traitement de la réponse serveur");
                } finally {
                    if (btnAjouter) {
                        btnAjouter.innerHTML = originalText;
                        btnAjouter.disabled = false;
                    }
                }
            },
            error: (err) => {
                // appelAjax devrait appeler Erreur::envoyerReponse en cas d'erreur,
                // mais ici on affiche un message clair.
                console.error('Erreur AJAX ajout:', err);
                
                // Afficher le message d'erreur spécifique s'il existe
                let message = "Erreur lors de l'ajout du document";
                if (err && err.message) {
                    // Nettoyer le message s'il contient du HTML
                    message = err.message.replace(/<[^>]*>/g, '');
                    
                    // Messages spécifiques connus
                    if (message.includes("Ce fichier est déjà présent")) {
                        message = "❌ Un fichier avec ce nom existe déjà. Renommez votre fichier ou choisissez-en un autre.";
                    } else if (message.includes("titre")) {
                        message = "❌ " + message;
                    } else if (message.includes("type")) {
                        message = "❌ " + message;
                    } else if (message.includes("date")) {
                        message = "❌ " + message;
                    } else if (message.includes("fichier")) {
                        message = "❌ " + message;
                    }
                }
                
                afficherMessageErreur(message);
                
                // Réactiver le bouton
                if (btnAjouter) {
                    btnAjouter.innerHTML = originalText;
                    btnAjouter.disabled = false;
                }
            }
        });
    }

    function afficherMessageErreur(text) {
        if (msgEl) {
            msgEl.innerHTML = `<div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>${text}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
            
            // Auto-dismiss après 5 secondes
            setTimeout(() => {
                const alert = msgEl.querySelector('.alert');
                if (alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, 5000);
        } else {
            alert(text);
        }
    }
}