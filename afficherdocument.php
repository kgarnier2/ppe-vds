<?php
/**
 * affichage d'un document
 */

require $_SERVER['DOCUMENT_ROOT'] . '/include/autoload.php';

// vérification du paramètre attendu :
if (!isset($_GET['id']) || empty($_GET['id'])) {
    Erreur::afficherReponse("Le document n'est pas précisé", 'global');
}

// récupération du paramètre attendu
$id = $_GET['id'];

// contrôle de la validité du paramètre
if (!preg_match('/^[0-9]+$/', $id)) {
    Erreur::bloquerVisiteur();
}

// récupération du document correspondant
// ADAPTE cette ligne selon ta classe Document
$document = Document::getById($id); 

// le document doit être présent dans la table document
if (!$document) {
    Erreur::afficherReponse("Le document demandé n'existe pas", 'global');
}

$id = $document['id'];
$titre = $document['titre'];
$fichier = $document['fichier'];

// CHEMIN CORRECT pour les documents
$cheminFichier = RACINE . "/data/document/" . $document['fichier'];
if (!is_file($cheminFichier)) {
    Erreur::afficherReponse("Le document demandé '$titre' n'a pas été trouvé.", 'global');
}

// comptabilisation de la demande si nécessaire
// Document::comptabiliserDemande($id);

// Transmission sécurisée du fichier PDF
$nomFichier = $titre . '.pdf';

header('Content-Type: application/pdf');
header("Content-Disposition: inline; filename=\"$nomFichier\"");
header('Content-Length: ' . filesize($cheminFichier));
readfile($cheminFichier);
exit;