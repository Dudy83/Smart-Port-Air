#!/bin/bash

# Ce fichier permet de récupérer les fichiers de vent json à la date du jour
# il supprime le fichier d'il y'a un mois

ROOT="/home/it-airpaca/webapps/smartports.atmosud.org"
today=$(date +%Y%m%d)
lastMonth=$(date -d "-1 month" +%Y%m%d)

mv "/home/../../filer/transfertsatmosud/vent_json/$today" "$ROOT/uploads/wind"

cd "$ROOT/uploads/wind"

if [ "$lastMonth" ] ; then
    rm -r "$lastMonth"
fi

echo "les fichier de vent du $today ont bien été transférés. Suppression des fichiers du $lastMonth."



