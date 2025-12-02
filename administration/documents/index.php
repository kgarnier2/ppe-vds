<?php
// activation du chargement dynamique des ressources
require $_SERVER['DOCUMENT_ROOT'] . '/include/autoload.php';

// chargement des données utilisées par l'interface
$titre = "Gestion des documents";

// Récupération des données
$lesParametres = Document::getConfig();
$lesDocuments = Document::getAll();

// Vérifier et nettoyer les données pour JSON
$lesParametresJson = json_encode($lesParametres, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT);
$lesDocumentsJson = json_encode($lesDocuments, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT);

// Vérifier si le JSON est valide
if ($lesParametresJson === false) {
    error_log("Erreur JSON lesParametres: " . json_last_error_msg());
    $lesParametresJson = '{}';
}

if ($lesDocumentsJson === false) {
    error_log("Erreur JSON lesDocuments: " . json_last_error_msg());
    $lesDocumentsJson = '[]';
}

$head = <<<HTML
    <script>
        let lesDocuments = $lesDocumentsJson;
        let lesParametres = $lesParametresJson;
        
        // Debug
        console.log('Paramètres chargés:', lesParametres);
        console.log('Documents chargés:', lesDocuments);
    </script>
HTML;

// chargement interface
require RACINE . '/include/interface.php';