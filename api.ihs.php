<?php
// ce fichier requête la db ihs en fonction de la date récupérée en Ajax et renvoie la réponse à javascript

require('dbconnect.php');

$db = new DbConnect();

$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if($contentType === "application/json") {

    $content = trim(file_get_contents("php://input"));

    $decoded = json_decode($content, true);

    $date = $decoded['dateIhs'];

    // $sql = "SELECT \"Name\", \"Lon\", \"Lat\", \"VesselType\", \"Destination\", \"Status\", \"Heading\", \"Width\" 
    // FROM loc.horaire 
    // WHERE upload_hour = '$date' 
    // AND \"VesselType\" != 'Vessel'";

    $sql = "SELECT 
    f.upload_hour
    , to_timestamp(replace(replace(f.\"MessageTimestamp\", '/Date(',''), ')/','')::bigint/1000) AT TIME ZONE 'UTC' as \"MessageTimestamp\"
    , f.\"AgeMinutes\"
    , f.\"Heading\"
    , f.\"Name\"
    , f.\"IMO\"
    , f.\"MMSI\"
    , f.\"VesselType\" 
    , f.\"Lon\"
    , f.\"Lat\"
    , f.\"Destination\"
    , f.\"Status\"
    , st_setsrid(st_makepoint(f.\"Lon\"::double precision, f.\"Lat\"::double precision), 4326) as geom 
    FROM loc.horaire as f
    left join (
        -- Dernière heure connue en zone portuaire 
        select 
            \"MMSI\"
            , max(to_timestamp(replace(replace(\"MessageTimestamp\", '/Date(',''), ')/','')::bigint/1000) AT TIME ZONE 'UTC') as \"MessageTimestamp\"
        from loc.horaire as a 
        left join (
            select * 
            from loc.zones
            where id_zone = 2 
        ) as b on st_intersects(st_setsrid(st_makepoint(\"Lon\"::double precision, \"Lat\"::double precision), 4326), b.geom)
        where 
                upload_hour = '$date' and
            b.id_zone = 2 -- Les bâteaux en zone portuaire
        group by 
            \"MMSI\"
    ) as a using(\"MMSI\") 
    left join (
        -- Dernière heure connue hors zone portuaire 
        select 
            \"MMSI\"
            , max(to_timestamp(replace(replace(\"MessageTimestamp\", '/Date(',''), ')/','')::bigint/1000) AT TIME ZONE 'UTC') as \"MessageTimestamp\"
        from loc.horaire as a 
        left join (
            select * 
            from loc.zones
            where id_zone = 2 
        ) as b on st_intersects(st_setsrid(st_makepoint(\"Lon\"::double precision, \"Lat\"::double precision), 4326), b.geom)
        where  
            id_zone is null 
        group by 
            \"MMSI\"       
    ) as b using (\"MMSI\")
    where 
        upload_hour = '$date' and
        to_timestamp(replace(replace(f.\"MessageTimestamp\", '/Date(',''), ')/','')::bigint/1000) AT TIME ZONE 'UTC' = a.\"MessageTimestamp\"
        and a.\"MessageTimestamp\" > b.\"MessageTimestamp\" ";

    $data = $db->getRows($sql);

    echo json_encode($data);

    $db->close();
}
