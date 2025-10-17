"use strict";

// -----------------------------------------------------------------------------------
// Déclaration des variables globales
// -----------------------------------------------------------------------------------

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
// -----------------------------------------------------------------------------------
// Déclaration des variables globales
// -----------------------------------------------------------------------------------

/* global lesParametres */
let leFichier = null; // contient le fichier uploadé pour l'ajout

const fichier = document.getElementById('fichier');
const nomFichier = document.getElementById('nomFichier');
const titre = document.getElementById('titre');
const btnFichier = document.getElementById('btnFichier');
const btnAjouter = document.getElementById('btnAjouter');
const date = document.getElementById('date');

// -----------------------------------------------------------------------------------
// Procédures évènementielles
// -----------------------------------------------------------------------------------

// Déclencher le clic sur le champ de type file lors d'un clic sur le bouton btnFichier
btnFichier.onclick = () => fichier.click();


// Lancer la fonction controlerFichier si un fichier a été sélectionné dans l'explorateur
fichier.onchange = () => {
    if (fichier.files.length > 0) {
        controlerFichier(fichier.files[0]);
    }
};

btnAjouter.onclick = () => {
    effacerLesErreurs();
    // supprimer les espaces superflus dans le champ titre
    titre.value = titre.value.trim().replace(/\s+/g, ' ');
    if (leFichier === null) {
        afficherSousLeChamp('fichier', 'Veuillez sélectionner ou faire glisser un fichier pdf');
    } else if (donneesValides() ) {
        ajouter();
    }
};

// -----------------------------------------------------------------------------------
// Fonctions de traitement
// -----------------------------------------------------------------------------------

/**
 * Contrôle le document sélectionné au niveau de son extension et de sa taille
 * Affiche le nom du fichier dans la balise 'nomFichier' ou un message d'erreur sous le champ fichier
 * Renseigne la variable globale leFichier
 * @param file Objet file téléversé
 */
function controlerFichier(file) {
    effacerLesErreurs();
    if (fichierValide(file, lesParametres)) {
        nomFichier.textContent = file.name;
        leFichier = file;
        if (titre.value.length === 0) {
            titre.value = file.name.slice(0, -4);
        }
    } else {
        leFichier = null;
        nomFichier.textContent = '';
    }
}

/**
 * ajout d'un document dans la table document et du document pdf associé dans le répertoire correspondant
 * En cas de succès retour sur la page index
 */
function ajouter() {
    let formData = new FormData();
    formData.append('fichier', leFichier);
    formData.append('titre', titre.value);
    formData.append('date', date.value);
    appelAjax({
        url: 'ajax/ajouter.php',
        data: formData,
        success: () => {
                retournerVers("Classement ajouté", '.');
        }
    });
}

// -----------------------------------------------------------------------------------
// Programme principal
// -----------------------------------------------------------------------------------
// Contrôle des données
configurerFormulaire();

filtrerLaSaisie('titre', /[0-9A-Za-zÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ,' \-]/);

const max = getDateRelative("annee", 0); // aujourd'hui
configurerDate(date, {max: max, valeur: max});

// initialisation des données sur l'interface
fichier.accept = lesParametres.accept;

let label = document.querySelector(`label[for="nomFichier"]`);
label.innerText = lesParametres.label;