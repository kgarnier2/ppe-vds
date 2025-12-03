<?php
// ACTIVER LES ERREURS
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require $_SERVER['DOCUMENT_ROOT'] . '/include/autoload.php';

// LOG
error_log("=== DÉBUT SUPPRESSION ===");
error_log("POST: " . print_r($_POST, true));

if (!isset($_POST['id'])) {
    error_log("❌ ID manquant");
    Erreur::envoyerReponse("Paramètre manquant", 'global');
}

$id = (int)$_POST['id'];
error_log("ID à supprimer: $id");

// 1. Récupérer le document
$ligne = Document::getById($id);
if (!$ligne) {
    error_log("❌ Document $id non trouvé en BDD");
    Erreur::envoyerReponse("Ce document n'existe pas", 'global');
}

error_log("Document trouvé: " . $ligne['titre']);
error_log("Fichier associé: " . $ligne['fichier']);

// 2. Vérifier le fichier physique
$cheminFichier = RACINE . '/data/document/' . $ligne['fichier'];
error_log("Chemin complet: $cheminFichier");
error_log("Fichier existe: " . (file_exists($cheminFichier) ? 'OUI' : 'NON'));
error_log("Est un fichier: " . (is_file($cheminFichier) ? 'OUI' : 'NON'));

// 3. Tenter la suppression BDD
try {
    error_log("Tentative suppression BDD...");
    Document::supprimer($id);
    error_log("✅ Suppression BDD OK");
} catch (Exception $e) {
    error_log("❌ Erreur BDD: " . $e->getMessage());
    Erreur::envoyerReponse("Erreur BDD: " . $e->getMessage(), 'global');
}

// 4. Tenter la suppression fichier
try {
    error_log("Tentative suppression fichier...");
    Document::supprimerFichier($ligne['fichier']);
    error_log("✅ Suppression fichier OK");
} catch (Exception $e) {
    error_log("⚠️ Erreur fichier (peut être normal si absent): " . $e->getMessage());
}

// 5. Réponse
$reponse = ['success' => "Document supprimé: " . $ligne['titre']];
error_log("✅ Envoi réponse: " . json_encode($reponse));

header('Content-Type: application/json');
echo json_encode($reponse, JSON_UNESCAPED_UNICODE);

error_log("=== FIN SUPPRESSION ===");