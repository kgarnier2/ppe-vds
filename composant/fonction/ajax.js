"use strict";

// Version 2025.5
// Date version : 04/08/2025
// Détection erreur 404
// Le message d'erreur est affiché avec genererMessage si la balise msg existe, sinon avec messageBox

import {messageBox, afficherSousLeChamp, afficherToast, genererMessage} from '/composant/fonction/afficher.js';

/**
 * Envoie une requête AJAX (GET ou POST) à l'URL spécifiée avec les données fournies.
 *
 * Fonction compatible avec `async/await` (retourne une promesse), mais supporte aussi les callbacks `success` et `error`
 * pour compatibilité avec du code existant.
 *
 * ### Fonctionnalités :
 * - Gère les erreurs réseau, de parsing, et les erreurs métier (retour `result.error`)
 * - Supporte les méthodes `GET` et `POST`
 * - Les données (`data`) peuvent être fournies sous forme de :
 *   - `FormData`
 *   - `URLSearchParams`
 *   - Objet JavaScript simple (converti automatiquement en `FormData`)
 * - Pour les requêtes `GET`, les paramètres sont automatiquement ajoutés à l'URL
 * - Le type de réponse peut être : `json` (par défaut), `text`, ou `blob`
 * - Appelle automatiquement les fonctions de gestion d'erreur visuelle (`messageBox`, `afficherSousLeChamp`, etc.)
 *
 * @param {Object} options - Objet contenant les paramètres de la requête
 * @param {string} options.url - L'URL du script ou de la ressource à appeler
 * @param {FormData|URLSearchParams|Object|null} [options.data=null] - Données à envoyer (POST dans le corps, GET dans l'URL)
 * @param {string} [options.method='POST'] - Méthode HTTP à utiliser : 'GET' ou 'POST'
 * @param {'json'|'text'|'blob'} [options.responseType='json'] - Type de contenu attendu dans la réponse
 * @param {function(any):void} [options.success=null] - Fonction appelée si la requête réussit (reçoit la réponse)
 * @param {function(Error|Object):void} [options.error=null] - Fonction appelée en cas d'erreur réseau, parsing, ou métier
 * @returns {Promise<any>} Une promesse contenant la réponse parsée selon le `responseType`.
 *                         Elle est rejetée en cas d’erreur réseau, parsing ou erreur métier (si `json.error` est défini).
 */
export async function appelAjax({
                                    url,
                                    data = null,
                                    method = 'POST',
                                    success = null,
                                    error = null,
                                    dataType = 'json'
                                }) {
    method = method.toUpperCase();
    dataType = dataType.toLowerCase();

    // Vérification de l'URL
    if (!url || typeof url !== 'string') {
        messageBox("L'URL fournie est invalide.", 'error');
        console.warn(url);
        return null;
    }

    // Vérification de la méthode
    if (method !== 'GET' && method !== 'POST') {
        console.warn("La méthode HTTP n'est pas valide : " + method);
        console.warn("La méthode POST sera utilisée");
        method = 'POST';
    }

    // vérifiation du type de réponse
    if (!['json', 'text', 'blob'].includes(dataType)) {
        messageBox("Le type de réponse demandé n'est pas valide : " + dataType, 'error');
        console.warn("La réponse sera attendue en JSON");
        dataType = 'json';
    }

    // Si data est un objet, on le convertit en FormData

    if (data && typeof data === 'object' && !(data instanceof FormData) && !(data instanceof URLSearchParams)) {
        const formData = new FormData();
        for (const key in data) {
            formData.append(key, data[key]);
        }
        data = formData;
    }

    // Si la méthode est GET et que data est un FormData, on le convertit en URLSearchParams
    if (method === 'GET' && data instanceof FormData) {
        const params = new URLSearchParams();
        for (const [key, value] of data.entries()) {
            params.append(key, value);
        }
        const separateur = url.includes('?') ? '&' : '?';
        url += separateur + params.toString();
        data = null;
    }

    // Envoi de la requête AJAX
    let objResponse;
    try {
        objResponse = await fetch(url, {
            method,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                ...(data instanceof URLSearchParams && {'Content-Type': 'application/x-www-form-urlencoded'})
            },
            body: method === 'POST' ? data : null
        });

        // ✅ Vérification explicite des erreurs HTTP
        if (!objResponse.ok) {
            // const statusText = objResponse.statusText || 'Erreur inconnue';
            // const message = `Erreur HTTP ${objResponse.status} : ${statusText}`;
            // const message = getErreurHttp(objResponse.status);
            const libelle = getErreurHttp(objResponse.status);
            const message = objResponse.status === 404 ? `Page non trouvée : ${objResponse.url}` : `${libelle} (code ${objResponse.status})`;
            messageBox(libelle, 'error');
            console.warn(message);
            if (error) {
                error(new Error(message));
            }
            return null;
        }

    } catch (fetchError) {
        const message = (
            fetchError instanceof TypeError && fetchError.message.includes('fetch') ?
                "Erreur réseau ou violation CORS : serveur inaccessible ou réponse bloquée." :
                "Erreur lors de l'exécution de la requête AJAX."
        );

        messageBox(message, 'error');
        console.warn(fetchError);
        if (error) {
            error(fetchError);
        }
        return null;
    }


    // Récupération de la réponse du serveur (le body) en fonction du type de réponse demandé
    let reponse;
    try {
        const contentType = objResponse.headers.get("Content-Type") || '';

        if (dataType === 'text') {
            reponse = await objResponse.text();
        } else if (dataType === 'blob') {
            reponse = await objResponse.blob();
        } else {
            // Avant de parser en JSON, vérifie que le content-type est bien celui attendu
            if (!contentType.includes("application/json")) {
                const texte = await objResponse.text(); // lis quand même la réponse pour diagnostic
                const erreurLecture = "Le serveur n'a pas renvoyé de réponse dans le format attendu (JSON).";
                messageBox(erreurLecture, 'error');
                console.warn(erreurLecture);
                console.warn("Contenu reçu :", texte);
                if (error) {
                    error(new SyntaxError(erreurLecture));
                }
                return null;
            }

            reponse = await objResponse.json();
        }
    } catch (parseError) {
        messageBox("Erreur lors de la lecture de la réponse du serveur.", 'error');
        console.warn(parseError);
        if (error) {
            error(parseError);
        }
        return null;
    }


    // Si la réponse est au format JSON et contient une erreur, on la traite
    if (dataType === 'json' && reponse.error) {
        for (const key in reponse.error) {
            const message = reponse.error[key];
            if (key === 'system') {
                messageBox('Une erreur est survenue, veuillez consulter le journal des erreurs pour en savoir plus', 'error');
            } else if (key === 'global') {
                // Affichage d'un message d'erreur global dans la div avec l'ID 'msg' si elle existe ou dans une fenêtre modale sinon
                const msg = document.getElementById('msg');
                if (msg) {
                    msg.innerHTML = genererMessage(message, 'error');
                    // msg.innerText = message;
                    // msg.style.color = 'red';
                    // msg.style.fontSize = '0.9rem';
                    // msg.style.fontWeight = 'bold';
                    // msg.style.margin = '5px';
                } else {
                    messageBox(message, 'error');
                }
            } else {
                // Affichage d'une erreur de saisie pour un champ spécifique : le message est affiché sous le champ
                afficherSousLeChamp(key, message);
            }
        }
        // si une fonction d'erreur est fournie, on l'appelle avec l'erreur
        if (error) {
            error(reponse.error);
        }
        return null;
    }
    // Si tout s'est bien passé, on appelle la fonction de succès si elle est définie
    if (success) {
        success(reponse);
    }
    return reponse;
}

/**
 * Version simplifiée de appelAjax pour appels externes (type API publique)
 * - Méthode GET uniquement
 * - Sans en-têtes personnalisés (évite les préflight CORS)
 * - Lecture JSON uniquement
 * - Affichage d'erreur via console ou messageBox si disponible
 *
 * @param {string} url - URL à interroger
 * @param {Function} success - Fonction appelée avec les données JSON
 */
export async function appelAjaxSimple({ url, success}) {
    try {
        const response = await fetch(url); // requête GET sans options, donc sans preflight

        if (!response.ok) {
            const msg = `Erreur HTTP ${response.status} : ${response.statusText}`;
            console.warn(msg);
            messageBox(msg, 'error');
            return;
        }

        const reponse = await response.json();
        if (reponse.error) {
            for (const key in reponse.error) {
                const message = reponse.error[key];
                if (key === 'system') {
                    messageBox('Une erreur est survenue, veuillez consulter le journal des erreurs pour en savoir plus', 'error');
                } else if (key === 'global') {
                    // Affichage d'un message d'erreur global dans la div avec l'ID 'msg' si elle existe ou dans une fenêtre modale sinon
                    const msg = document.getElementById('msg');
                    if (msg) {
                        msg.innerText = message;
                        msg.style.color = 'red';
                        msg.style.fontSize = '0.9rem';
                        msg.style.fontWeight = 'bold';
                        msg.style.margin = '5px';
                    } else {
                        messageBox(message, 'error');
                    }
                } else {
                    // Affichage d'une erreur de saisie pour un champ spécifique : le message est affiché sous le champ
                    afficherSousLeChamp(key, message);
                }
            }
            return null;
        }
        success(reponse);

    } catch (e) {
        const msg = "Erreur réseau ou violation CORS.";
        console.warn(msg, e);
        messageBox(msg, 'error');
    }
}

function getErreurHttp(codeHttp) {
    const libelles = {
        400: "Requête incorrecte",
        401: "Erreur d'authentification",
        403: "Demande interdite par les règles administratives. Veuillez vous assurer que votre demande comporte un en-tête User-Agent.",
        404: "Page non trouvée",
        405: "Méthode non autorisée",
        408: "Temps d'attente d'une requête dépassé",
        500: "Erreur interne du serveur",
        502: "Mauvaise passerelle",
        503: "Service indisponible",
        504: "Temps d'attente de la passerelle dépassé"
    };

    return libelles[codeHttp] || `Erreur HTTP ${codeHttp}`;
}


/**
 * Demande de suppression
 * @param {string} table nom de la table
 * @param {int} id id de l'enregistrement
 * @param success {function|null} fonction à appeler en cas de succès
 */
export function supprimerEnregistrement(table, id, success = null) {
    appelAjax({
        url: '/ajax/supprimer.php',
        data: {
            table: table,
            id: id
        },
        success: reponse => {
            afficherToast(reponse.success, 'success', 'top-right', 1500);
            success?.();
        }
    });
}


/**
 * Demande de modification de la valeur d'une colonne
 * @param {string} table nom de la table
 * @param {string} colonne nom de la colonne à modifier
 * @param {string|int} valeur nouvelle valeur de la colonne
 * @param {int} id identifiant de l'enregistrement concerné
 * @param {function|null} success fonction à appeler en cas de succès
 */
export function modifierColonne(table, colonne, valeur, id, success = null) {
    appelAjax({
        url: '/ajax/modifiercolonne.php',
        data: {
            table: table,
            colonne: colonne,
            valeur: valeur,
            id: id,
        },
        success: reponse => {
            afficherToast(reponse.success, 'success', 'top-right', 1500);
            success?.();
        }
    });
}

/**
 * Demande de modification d'un enregistrement
 * @param {string} table nom de la table
 * @param {int} id identifiant de l'enregistrement concerné
 * @param {Object} lesValeurs objet contenant les paires clé/valeur des colonnes à modifier
 * @param {function|null} success fonction à appeler en cas de succès
 *
 */
export function modifierEnregistrement(table, id, lesValeurs, success = null) {
    appelAjax({
        url: '/ajax/modifier.php',
        data: {
            table: table,
            id: id,
            lesValeurs: JSON.stringify(lesValeurs)
        },
        success: reponse => {
            afficherToast(reponse.success, 'success', 'top-right', 1500);
            success?.();
        }
    });
}