<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20200123105615 extends AbstractMigration
{
    public function getDescription() : string
    {
        return '';
    }

    public function up(Schema $schema) : void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() !== 'mysql', 'Migration can only be executed safely on \'mysql\'.');

       
        $this->addSql('ALTER TABLE user ADD confirmation_token VARCHAR(255) DEFAULT NULL, ADD account_activated TINYINT(1) DEFAULT \'0\' NOT NULL');
    }

    public function down(Schema $schema) : void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() !== 'mysql', 'Migration can only be executed safely on \'mysql\'.');

        $this->addSql('CREATE TABLE chimie_stations2 (id VARCHAR(7) DEFAULT NULL COLLATE utf8_general_ci, nom_complet VARCHAR(33) DEFAULT NULL COLLATE utf8_general_ci, nom VARCHAR(33) DEFAULT NULL COLLATE utf8_general_ci, nomcourt VARCHAR(10) DEFAULT NULL COLLATE utf8_general_ci, surv INT DEFAULT NULL, lon VARCHAR(10) DEFAULT NULL COLLATE utf8_general_ci, lat VARCHAR(10) DEFAULT NULL COLLATE utf8_general_ci, x_l93 VARCHAR(7) DEFAULT NULL COLLATE utf8_general_ci, y_l93 VARCHAR(7) DEFAULT NULL COLLATE utf8_general_ci, alt VARCHAR(4) DEFAULT NULL COLLATE utf8_general_ci, aasqa VARCHAR(16) DEFAULT NULL COLLATE utf8_general_ci, typo VARCHAR(2) DEFAULT NULL COLLATE utf8_general_ci, id83 VARCHAR(5) DEFAULT NULL COLLATE utf8_general_ci) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = MyISAM COMMENT = \'\' ');
        $this->addSql('ALTER TABLE user DROP confirmation_token, DROP account_activated');
    }
}
