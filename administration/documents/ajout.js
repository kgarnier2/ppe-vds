"use strict";

// administration/documents/ajout.js
// Inspiré de administration/classement/ajout.js
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

        if (!leFichier) {
            afficherSousLeChamp('fichierDocument', 'Veuillez sélectionner un fichier.');
            return;
        }

        if (!donneesValides()) {
            // donneesValides() affichera les erreurs au besoin
            return;
        }

        // tout ok -> lancer ajout via AJAX
        ajouterDocument();
    });

    // fonction de contrôle du fichier
    function controlerFichier(file) {
        if (fichierValide(file, lesParametres)) {
            nomFichier.textContent = file.name;
            leFichier = file;
            // proposer un titre par défaut si vide
            if (inputTitre && inputTitre.value.length === 0) {
                // enlever extension si présente
                const name = file.name.replace(/\.[^/.]+$/, "");
                inputTitre.value = name;
            }
        } else {
            leFichier = null;
            nomFichier.textContent = '';
        }
    }

    // envoi via appelAjax (wrapper existant) vers administration/documents/ajax/ajouter.php
    function ajouterDocument() {
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
                        retournerVers("Document ajouté", '.');
                        // déclencher événement pour rafraîchir l'affichage public si présent
                        document.dispatchEvent(new Event('documents:updated'));
                    } else {
                        // si format différent, afficher message générique
                        afficherMessageErreur("Réponse inattendue du serveur");
                    }
                } catch (err) {
                    console.error(err);
                    afficherMessageErreur("Erreur lors du traitement de la réponse serveur");
                }
            },
            error: (err) => {
                // appelAjax devrait appeler Erreur::envoyerReponse en cas d'erreur,
                // mais ici on affiche un message clair.
                console.error('Erreur AJAX ajout:', err);
                afficherMessageErreur(err && err.message ? err.message : "Erreur serveur lors de l'ajout");
            }
        });
    }

    function afficherMessageErreur(text) {
        if (msgEl) {
            msgEl.textContent = text;
            msgEl.style.color = 'red';
        } else {
            alert(text);
        }
    }
}