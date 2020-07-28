#!/bin/bash

# exporte les données des bateaux en json
Root="/home/it-airpaca/webapps/smartports.atmosud.org/uploads/ihs"
dateSql=$(date +"%Y-%m-%d %H")":00:00"
dateFile=$(date +"%Y%m%d_%H")

results=`psql -t -A -h 10.0.1.3 -U readonly -d ihs -c "
select array_to_json(array_agg(row_to_json (r))) FROM (
    select 
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
    from loc.horaire as f
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
             upload_hour = '$dateSql' and
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
       upload_hour = '$dateSql' and
       to_timestamp(replace(replace(f.\"MessageTimestamp\", '/Date(',''), ')/','')::bigint/1000) AT TIME ZONE 'UTC' = a.\"MessageTimestamp\"
       and a.\"MessageTimestamp\" > b.\"MessageTimestamp\" 
) r"` 

echo $results > $Root/$dateFile.json

