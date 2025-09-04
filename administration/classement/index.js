"use strict";

// -----------------------------------------------------------------------------------
// Import des fonctions nécessaires
// -----------------------------------------------------------------------------------

import {appelAjax, supprimerEnregistrement, modifierColonne} from "/composant/fonction/ajax.js";
import {confirmer, messageBox, corriger} from "/composant/fonction/afficher.js";
import {fichierValide, effacerLesErreurs} from "/composant/fonction/formulaire.js";

// -----------------------------------------------------------------------------------
// Déclaration des variables globales
// -----------------------------------------------------------------------------------

/* global data, lesParametres */

// conserver le nom du fichier à remplacer
let nomFichier;

// récupération des élements sur l'interface
const lesLignes = document.getElementById('lesLignes');
const fichier = document.getElementById('fichier');
const nb = document.getElementById('nb');

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
            messageBox("Opération réalisée avec succès");
        }
    });
}


// -----------------------------------------------------------------------------------
// Programme principal
// -----------------------------------------------------------------------------------

fichier.accept = lesParametres.accept;
nb.innerText = data.length;

// afficher le tableau des classements
for (const element of data) {
    let id = element.id;
    let tr = lesLignes.insertRow();
    tr.style.verticalAlign = 'middle';
    tr.id = element.id;

    // première colonne : les icônes de traitement : voir (si le fichier existe), supprimer, remplacer
    let td = tr.insertCell();
    if (element.present) {
        let a = document.createElement('a');
        a.href = "/afficherclassement.php?id=" + element.id;
        a.target = 'pdf';
        a.innerText = '📄';
        td.appendChild(a);
    } else {
        td.innerText = '❓';
        console.log("Le classement " + element.id + " n'a pas été trouvé");
    }

    // icône pour téléverser un nouveau classement
    const btnRemplacer = document.createElement('span');
    btnRemplacer.textContent = '♻️';
    btnRemplacer.style.paddingLeft = "10px";
    btnRemplacer.style.cursor = 'pointer';
    btnRemplacer.title = "Téléverser une nouvelle version du classement PDF";
    btnRemplacer.onclick = () => {
        nomFichier = element.fichier;
        fichier.click();
    };
    td.appendChild(btnRemplacer);

    // ajout de l'icone de suppression
    const btnSupprimer = document.createElement('span');
    btnSupprimer.textContent = '✘';
    btnSupprimer.style.paddingLeft = "10px";
    btnSupprimer.style.color = 'red';
    btnSupprimer.style.cursor = 'pointer';
    btnSupprimer.title = 'Supprimer';
    const success = () => document.getElementById(id)?.remove();
    const supprimer = () => supprimerEnregistrement('classement', id, success);
    btnSupprimer.onclick = () => confirmer(supprimer);
    td.appendChild(btnSupprimer);

    // seconde colonne la date
    let date = document.createElement("input");
    date.type = 'date';
    date.value = element.date;
    date.dataset.old = element.date;
    date.max = new Date().toISOString().split('T')[0];
    date.onblur = function () {
        // contrôle de la valeur
        if (this.value !== this.dataset.old) {
            if (this.checkValidity()) {
                const success = () => {
                    this.style.color = 'green';
                    // modifier l'ancienne valeur
                    this.dataset.old = this.value;
                };
                modifierColonne('classement', 'date', this.value, id, success);
            } else {
                corriger(this);
            }
        }
    };
    tr.insertCell().appendChild(date);

    // colonne titre (modifiable)
    let titre = document.createElement("input");
    titre.type = 'text';
    titre.maxLength = 100;
    titre.minLength = 10;
    titre.required = true;
    titre.value = element.titre;
    titre.dataset.old = element.titre;
    titre.onkeydown = (e) => !/[<>]/.test(e.key);
    titre.onchange = function () {
        // supprimer les espaces superflus
        this.value = this.value.trim().replace(/\s+/g, ' ');
        // contrôle de la valeur
        if (this.value !== this.dataset.old) {
            if (this.checkValidity()) {
                const success = () => {
                    this.style.color = 'green';
                    // modifier l'ancienne valeur
                    this.dataset.old = this.value;
                };
                modifierColonne('classement', 'titre', this.value, id, success);
            } else {
                corriger(this);
            }
        }
    };
    tr.insertCell().appendChild(titre);

    // quatrième colonne : Le nombre de demandes de téléchargement
    td = tr.insertCell();
    td.style.textAlign = 'right';
    td.style.paddingRight = '10px';
    td.innerText = element.nbDemande;
}