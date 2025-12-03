<?php
/**
 * Configuration pour la gestion des documents PDF
 */

return [
    // Répertoire de stockage
    'repertoire' => '/data/document',
    
    // Contraintes sur le fichier
    'extensions' => ['pdf'],
    'types' => ['application/pdf'],
    'maxSize' => 1024 * 1024, // 1 Mo
    'require' => true,
    'rename' => false,
    'sansAccent' => true,
    'casse' => 'L',
    
    // Pour l'input HTML
    'accept' => '.pdf',
    'label' => 'Fichier PDF (1 Mo max)',
    
    // Validation du titre
    'titre' => [
        'minLength' => 10,
        'maxLength' => 70,
        'pattern' => "/^[A-Za-zÀ-ÿ0-9 ,'-]+[?!]?$/u"
    ]
];