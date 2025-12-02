<?php
require $_SERVER['DOCUMENT_ROOT'] . '/include/autoload.php';

error_log("=== REMPLACEMENT SIMPLE ===");

if (!isset($_FILES['fichier'], $_POST['nomFichier'])) {
    echo json_encode(['error' => 'Paramètres manquants']);
    exit;
}

$config = Document::getConfig();
$repertoire = RACINE . $config['repertoire'];
$fichierCible = $repertoire . '/' . $_POST['nomFichier'];

error_log("Remplacement: " . $_FILES['fichier']['name'] . " → " . $fichierCible);

// Méthode directe
if (move_uploaded_file($_FILES['fichier']['tmp_name'], $fichierCible)) {
    error_log("✅ Fichier remplacé avec succès");
    echo json_encode(['success' => 'Fichier remplacé avec succès']);
} else {
    error_log("❌ Échec move_uploaded_file");
    echo json_encode(['error' => 'Échec du remplacement']);
}