<?php

/**
 * Classe gérant les documents déposés par l'administrateur
 *
 * Table 'document' (voir documentdb.sql) :
 *  - id : identifiant
 *  - titre : titre du document
 *  - type : catégorie (ex: 4saisons, Club, Public, Membre...)
 *  - date : date du document
 *  - fichier : nom du fichier stocké (chemin relatif /nomfichier)
 *  - description : (optionnel) description courte
 *
 * Inspirée de la classe Classement, fournit méthodes utilitaires pour
 * récupérer, supprimer et obtenir la configuration côté client.
 */
class Document extends Table
{
    /**
     * Configuration centralisée des paramètres liés à la gestion des fichiers
     * et aux contraintes de validation des colonnes.
     */
    private const CONFIG = [
        // Répertoire relatif de stockage des fichiers (côté serveur utiliser RACINE . 'repertoire')
        'repertoire'  => '/data/document',
        // Extensions autorisées (adapter si nécessaire)
        'extensions'  => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'odt'],
        // Types MIME acceptés (liste indicative)
        'types'       => [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'application/vnd.oasis.opendocument.text'
        ],
        // Taille maximale autorisée (en octets) : 5 Mo par défaut
        'maxSize'     => 5 * 1024 * 1024,
        // Le fichier est-il obligatoire ?
        'require'     => true,
        // Renommer en cas de doublon ?
        'rename'      => true,
        // Supprimer les accents dans le nom de fichier si true
        'sansAccent'  => true,
        // Forcer la casse des noms de fichiers ('L' = minuscule, 'U' = majuscule)
        'casse'       => 'L',
        // Extensions acceptées pour l'input HTML
        'accept'      => '.pdf,.doc,.docx,.xls,.xlsx,.txt,.odt',
        // Label pour l'input de fichier
        'label'       => 'Fichier (5 Mo max)',
    ];

    private const DIR = RACINE . self::CONFIG['repertoire'];

    public function __construct()
    {
        parent::__construct('document');

        // titre
        $input = new InputText();
        $input->Require = true;
        $input->MinLength = 3;
        $input->MaxLength = 200;
        $input->SupprimerEspaceSuperflu = true;
        $this->columns['titre'] = $input;

        // type (catégorie)
        $input = new InputText();
        $input->Require = true;
        $input->MaxLength = 100;
        $this->columns['type'] = $input;

        // date
        $input = new InputText();
        $input->Require = true;
        $this->columns['date'] = $input;

        // fichier (stocke le nom/chemin relatif)
        $input = new InputText();
        $input->Require = false;
        $this->columns['fichier'] = $input;

        // description (optionnel)
        $input = new InputText();
        $input->Require = false;
        $input->MaxLength = 500;
        $this->columns['description'] = $input;

        // Colonnes modifiables directement via API si nécessaire
        $this->listOfColumns->Values = ['titre', 'type', 'date', 'description'];
    }

    /**
     * Récupère tous les documents triés par id descendant
     *
     * @return array<int, array{id:int,titre:string,type:string,date:string,fichier:string,description:string}>
     */
    public static function getAll(): array
    {
        $sql = <<<SQL
            SELECT id, titre, type, date, fichier, COALESCE(description, '') AS description
            FROM document
            ORDER BY id DESC;
SQL;
        $select = new Select();
        $rows = $select->getRows($sql);

        // Si besoin, ajouter l'URL publique (le préfixe doit être adapté côté serveur)
        $uploadsBase = '/uploads/';
        foreach ($rows as &$r) {
            $r['url'] = $r['fichier'] ? $uploadsBase . $r['fichier'] : null;
            // Ajouter un flag pour indiquer si le fichier est présent
            $r['present'] = $r['fichier'] && file_exists(self::DIR . '/' . $r['fichier']);
        }
        unset($r);

        return $rows;
    }

    /**
     * Récupère tous les documents SAUF ceux de type "Membre"
     * Utile pour l'affichage public sans connexion
     *
     * @return array<int, array{id:int,titre:string,type:string,date:string,fichier:string,description:string}>
     */
    public static function getAllSaufMembre(): array
    {
        $sql = <<<SQL
            SELECT id, titre, type, date, fichier, COALESCE(description, '') AS description
            FROM document
            WHERE type != 'Membre'
            ORDER BY id DESC;
SQL;
        $select = new Select();
        $rows = $select->getRows($sql);

        $uploadsBase = '/uploads/';
        foreach ($rows as &$r) {
            $r['url'] = $r['fichier'] ? $uploadsBase . $r['fichier'] : null;
            $r['present'] = $r['fichier'] && file_exists(self::DIR . '/' . $r['fichier']);
        }
        unset($r);

        return $rows;
    }

    /**
     * Récupère les documents d'un type/catégorie donné
     *
     * @param string $type
     * @return array<int, array{id:int,titre:string,type:string,date:string,fichier:string,description:string}>
     */
    public static function getByType(string $type): array
    {
        $sql = <<<SQL
            SELECT id, titre, type, date, fichier, COALESCE(description, '') AS description
            FROM document
            WHERE LOWER(type) = LOWER(:type)
            ORDER BY id DESC;
SQL;
        $select = new Select();
        $rows = $select->getRows($sql, ['type' => $type]);

        $uploadsBase = '/uploads/';
        foreach ($rows as &$r) {
            $r['url'] = $r['fichier'] ? $uploadsBase . $r['fichier'] : null;
            $r['present'] = $r['fichier'] && file_exists(self::DIR . '/' . $r['fichier']);
        }
        unset($r);

        return $rows;
    }

    /**
     * Récupère un document par son identifiant
     *
     * @param int $id
     * @return array|null
     */
    public static function getById(int $id): ?array
    {
        $sql = <<<SQL
            SELECT id, titre, type, date, fichier, COALESCE(description, '') AS description
            FROM document
            WHERE id = :id;
SQL;
        $select = new Select();
        $row = $select->getRow($sql, ['id' => $id]);

        if ($row) {
            $row['url'] = $row['fichier'] ? '/uploads/' . $row['fichier'] : null;
            $row['present'] = $row['fichier'] && file_exists(self::DIR . '/' . $row['fichier']);
        }

        return $row;
    }

    /**
     * Supprime le fichier physique associé à un document
     *
     * @param string $fichier
     * @return void
     */
    public static function supprimerFichier(string $fichier): void
    {
        $chemin = self::DIR . '/' . $fichier;
        if (is_file($chemin)) {
            unlink($chemin);
        }
    }

    /**
     * Supprime l'enregistrement en base (et optionnellement le fichier physique si présent)
     *
     * @param int $id
     * @param bool $deleteFile
     * @return void
     */
    public static function supprimer(int $id): void
    {
        $db = Database::getInstance();
        $sql = "delete from document  where id = :id;";
        $cmd = $db->prepare($sql);
        $cmd->bindValue('id', $id);
        $cmd->execute();
    }

    /**
     * Retourne la configuration (utilisée côté client pour validation)
     *
     * @return array
     */
    public static function getConfig(): array
    {
        return self::CONFIG;
    }
}