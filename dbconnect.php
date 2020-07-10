<?php
// Ce fichier permet d'établir la connexion à la db Ihs 

class DbConnect {

    public function __construct() {
        $this->db = pg_connect("host=78.153.226.3 port=5432 dbname=ihs user=readonly password=GNQ4$3");

        if (!$this->db) exit();
    }

    public function close() {
        pg_close($this->db);
    }

    public function getRows($sql) {
        $result = pg_query($this->db, $sql);

        if(pg_last_error()) exit(pg_last_error());

        $this->num_rows = pg_num_rows($result);

        $rows = array();
        
        while ($item = pg_fetch_object($result)) {
            $rows[] = $item;
        }
        
        return $rows;
    }
}
