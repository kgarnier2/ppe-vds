DROP TABLE IF EXISTS `document`;
CREATE TABLE IF NOT EXISTS `document` (
                                          `id` int NOT NULL AUTO_INCREMENT,
                                          `titre` varchar(100) NOT NULL,
                                          `type` varchar(100) NOT NULL,
                                          `fichier` varchar(100) NOT NULL,
                                          `description` TEXT NULL,
                                          `date` DATE NOT NULL DEFAULT (CURRENT_DATE),
                                          PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
COMMIT;

select * from document;

insert into document(id, titre, type, fichier, description, date) values
                                                                      (1,'Autorisation parentale 4 saisons','4 saisons','data/document/Autorisation parentale 4 saisons.pdf', null, CURDATE()),
                                                                      (2,"Autorisation parentale pour l'adhésion",'Club','data/document/Autorisation parentale pour adhesion.pdf', null, CURDATE()),
                                                                      (3,'Les minimas pour les championnats de France','Public','data/document/Les minimas pour les championnats de France.pdf', null, CURDATE()),
                                                                      (4,'Tableau des allures pour les séances de VS','Membre','data/document/Tableau des allures pour séances de VS.pdf', null, CURDATE());

update document
set fichier = 'data/document/Tableau des allures pour séances de VS.pdf'
WHERE id=4;