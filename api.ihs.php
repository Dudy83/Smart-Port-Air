<?php
// ce fichier requête la db ihs en fonction de la date récupérée en Ajax et renvoie la réponse à javascript

require('dbconnect.php');

$db = new DbConnect();

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if($contentType === "application/json") {

    $content = trim(file_get_contents("php://input"));

    $decoded = json_decode($content, true);

    $date = $decoded['dateIhs'];

    $sql = "SELECT \"Name\", \"Lon\", \"Lat\", \"VesselType\", \"Destination\", \"Status\", \"Heading\", \"Width\" 
    FROM loc.horaire 
    WHERE upload_hour = '$date' 
    AND \"VesselType\" != 'Vessel'";

    $data = $db->getRows($sql);

    echo json_decode($data);

    $db->close();
}
