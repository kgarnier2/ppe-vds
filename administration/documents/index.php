<?php
// activation du chargement dynamique des ressources
require $_SERVER['DOCUMENT_ROOT'] . '/include/autoload.php';

// chargement des données utilisées par l'interface
$titre = "Gestions des documents";
// Récupération des paramètres du téléversement
$lesParametres = json_encode(Document::getConfig());
$lesDocuments= json_encode(Document::getAll());

$head = <<<HTML
    <script>
        let lesDocuments= $lesDocuments;
        let lesParametres = $lesParametres;
    </script>
HTML;

// chargement interface
require RACINE . '/include/interface.php';