<?php
class Document extends Table
{
    private const DIR = RACINE . '/data/document';
    
    public function __construct()
    {
        parent::__construct('document');
        
        // titre
        $input = new InputText();
        $input->Require = true;
        $input->MinLength = 10;
        $input->MaxLength = 70;
        $input->SupprimerEspaceSuperflu = true;
        $this->columns['titre'] = $input;
        
        // type
        $input = new InputText();
        $input->Require = true;
        $input->MaxLength = 100;
        $this->columns['type'] = $input;
        
        // date
        $input = new InputText();
        $input->Require = true;
        $this->columns['date'] = $input;
        
        // fichier
        $input = new InputText();
        $input->Require = false;
        $this->columns['fichier'] = $input;
        
        // description
        $input = new InputText();
        $input->Require = false;
        $input->MaxLength = 500;
        $this->columns['description'] = $input;
        
        $this->listOfColumns->Values = ['titre', 'type', 'date', 'description'];
    }
    
    public static function getConfig(): array
    {
        return [
            'repertoire' => '/data/document',
            'extensions' => ['pdf'],
            'types' => ['application/pdf'],
            'maxSize' => 1024 * 1024,
            'require' => true,
            'rename' => true,
            'sansAccent' => true,
            'casse' => 'L',
            'accept' => '.pdf',
            'label' => 'Fichier PDF (1 Mo max)'
        ];
    }
    
    public static function getAll(): array
    {
        $sql = "SELECT id, titre, type, date, fichier, 
                       COALESCE(description, '') as description 
                FROM document 
                ORDER BY id DESC";
        $select = new Select();
        $rows = $select->getRows($sql);
        
        foreach ($rows as &$r) {
            $r['present'] = $r['fichier'] && file_exists(self::DIR . '/' . $r['fichier']);
        }
        
        return $rows;
    }
    
    public static function getById(int $id): ?array
    {
        $sql = "SELECT id, titre, type, date, fichier, 
                       COALESCE(description, '') as description 
                FROM document 
                WHERE id = :id";
        $select = new Select();
        return $select->getRow($sql, ['id' => $id]);
    }
    
    public static function supprimer(int $id): void
    {
        $db = Database::getInstance();
        $sql = "DELETE FROM document WHERE id = :id";
        $cmd = $db->prepare($sql);
        $cmd->bindValue('id', $id);
        $cmd->execute();
    }
    
    public static function supprimerFichier(string $fichier): void
    {
        $chemin = self::DIR . '/' . $fichier;
        if (is_file($chemin)) {
            unlink($chemin);
        }
    }
}