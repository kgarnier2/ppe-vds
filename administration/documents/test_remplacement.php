<?php
// Activer l'affichage des erreurs
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<!DOCTYPE html>
<html lang='fr'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Test Remplacement Fichier</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        ul { background: #f5f5f5; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>";

echo "<h1>🔧 Test de remplacement de fichier</h1>";

try {
    echo "<h2>1. Chargement de l'autoload</h2>";
    
    $root = $_SERVER['DOCUMENT_ROOT'];
    echo "Document root: " . htmlspecialchars($root) . "<br>";
    
    $autoloadPath = $root . '/include/autoload.php';
    echo "Chemin autoload: " . htmlspecialchars($autoloadPath) . "<br>";
    
    if (!file_exists($autoloadPath)) {
        throw new Exception("Fichier autoload.php non trouvé");
    }
    
    require $autoloadPath;
    echo "<span class='success'>✅ Autoload chargé avec succès</span><br>";

    echo "<h2>2. Test de la classe Document</h2>";
    
    if (!class_exists('Document')) {
        throw new Exception("Classe Document non trouvée");
    }
    
    echo "<span class='success'>✅ Classe Document trouvée</span><br>";
    
    // Récupération du répertoire via la config
    $config = Document::getConfig();
    echo "Configuration: " . print_r($config, true) . "<br>";
    
    $repertoire = RACINE . $config['repertoire'];
    echo "Répertoire documents: " . htmlspecialchars($repertoire) . "<br>";

    echo "<h2>3. Test des permissions</h2>";
    echo "<ul>";
    echo "<li>Répertoire existe: " . (is_dir($repertoire) ? '<span class="success">✅ OUI</span>' : '<span class="error">❌ NON</span>') . "</li>";
    echo "<li>Est lisible: " . (is_readable($repertoire) ? '<span class="success">✅ OUI</span>' : '<span class="error">❌ NON</span>') . "</li>";
    echo "<li>Est inscriptible: " . (is_writable($repertoire) ? '<span class="success">✅ OUI</span>' : '<span class="error">❌ NON</span>') . "</li>";
    echo "</ul>";

    // Si le répertoire n'existe pas, tenter de le créer
    if (!is_dir($repertoire)) {
        echo "<h2>4. Tentative de création du répertoire</h2>";
        if (mkdir($repertoire, 0755, true)) {
            echo "<span class='success'>✅ Répertoire créé</span><br>";
        } else {
            echo "<span class='error'>❌ Impossible de créer le répertoire</span><br>";
        }
    }

    echo "<h2>5. Test création fichier</h2>";
    $fichierTest = 'test_remplacement_' . time() . '.txt';
    $cheminFichier = $repertoire . '/' . $fichierTest;
    
    $contenuInitial = "Contenu initial - " . date('Y-m-d H:i:s');
    $resultCreation = file_put_contents($cheminFichier, $contenuInitial);
    
    if ($resultCreation !== false) {
        echo "<span class='success'>✅ Création réussie</span><br>";
        echo "Fichier créé: " . htmlspecialchars($fichierTest) . "<br>";
        echo "Taille: " . filesize($cheminFichier) . " octets<br>";
    } else {
        echo "<span class='error'>❌ Échec de la création</span><br>";
        $cheminFichier = null;
    }

    if ($cheminFichier && file_exists($cheminFichier)) {
        echo "<h2>6. Test simulation remplacement</h2>";
        
        // Simuler les données $_FILES
        $_FILES = [
            'fichier' => [
                'name' => 'fichier_remplace.txt',
                'type' => 'text/plain', 
                'tmp_name' => $cheminFichier, // On réutilise le même fichier
                'error' => 0,
                'size' => filesize($cheminFichier)
            ]
        ];
        
        $_POST = [
            'nomFichier' => $fichierTest
        ];
        
        echo "Fichier à remplacer: " . htmlspecialchars($_POST['nomFichier']) . "<br>";
        echo "Nouveau fichier simulé: " . htmlspecialchars($_FILES['fichier']['name']) . "<br>";
        
        try {
            $file = new InputFile($_FILES['fichier'], $config);
            $file->Value = $_POST['nomFichier'];
            $file->Mode = 'update';
            
            echo "Validation: ";
            if ($file->checkValidity()) {
                echo "<span class='success'>✅ VALIDE</span><br>";
                
                echo "Tentative de copie...<br>";
                $resultatCopie = $file->copy();
                
                if ($resultatCopie) {
                    echo "<span class='success'>✅ Copie réussie</span><br>";
                    
                    // Vérifier le contenu après remplacement
                    $contenuApres = file_get_contents($cheminFichier);
                    echo "Contenu après remplacement: \"" . htmlspecialchars($contenuApres) . "\"<br>";
                    
                    if ($contenuApres !== $contenuInitial) {
                        echo "<span class='success'>✅ Le contenu a changé - remplacement effectif</span><br>";
                    } else {
                        echo "<span class='error'>❌ Le contenu n'a pas changé - problème de remplacement</span><br>";
                    }
                } else {
                    echo "<span class='error'>❌ Échec de la copie</span><br>";
                }
            } else {
                $messageErreur = $file->getValidationMessage();
                echo "<span class='error'>❌ INVALIDE: " . htmlspecialchars($messageErreur) . "</span><br>";
            }
            
        } catch (Exception $e) {
            echo "<span class='error'>❌ Exception lors du remplacement: " . htmlspecialchars($e->getMessage()) . "</span><br>";
        }
    }

    echo "<h2>7. Nettoyage</h2>";
    if ($cheminFichier && file_exists($cheminFichier)) {
        if (unlink($cheminFichier)) {
            echo "<span class='success'>✅ Fichier test supprimé</span><br>";
        } else {
            echo "<span class='error'>❌ Impossible de supprimer le fichier test</span><br>";
        }
    }

    echo "<h2>8. Liste des fichiers dans le répertoire</h2>";
    if (is_dir($repertoire)) {
        $fichiers = scandir($repertoire);
        echo "<ul>";
        $count = 0;
        foreach ($fichiers as $fichier) {
            if ($fichier !== '.' && $fichier !== '..') {
                $count++;
                $chemin = $repertoire . '/' . $fichier;
                $taille = filesize($chemin);
                $modif = date('Y-m-d H:i:s', filemtime($chemin));
                echo "<li>" . htmlspecialchars($fichier) . " ($taille octets) - Modifié: $modif</li>";
            }
        }
        if ($count === 0) {
            echo "<li>Aucun fichier</li>";
        }
        echo "</ul>";
    } else {
        echo "<span class='error'>Répertoire inaccessible</span><br>";
    }

} catch (Exception $e) {
    echo "<h2 style='color: red;'>❌ ERREUR CRITIQUE</h2>";
    echo "<p><strong>" . htmlspecialchars($e->getMessage()) . "</strong></p>";
}

echo "<hr>";
echo "<p><strong>Test terminé à " . date('H:i:s') . "</strong></p>";
echo "</body></html>";
?>