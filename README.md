
<img src= "https://github.com/airpaca/Smart-Port-Air/blob/master/public/images/logo/logo_transparent.png"> 

# SMART PORT APP

### Map Leaflet :

#### Plugins :
- axios (Ajax requests)
- API Géoloc (prévisions data)
- API Géoservices (mesures data)
- Leaflet-velocity (wind)
- Chart.js (graphs)

### Usefull functions :

Fonctions pour récupérer les prévisions et les mesures (moyenne ou max journaliers) :

Le code de ces fonctions se trouve dans : ./assets/js/map.js

```js
// Cette fonction retourne les 5 derniers jours de mesures (moyenne) selon le polluant et la station souhaités.

// @Params(code_polluant, code_station)
get_mesures(8, "FR24018").then((data) =>
{
    console.log(data)
})

// Valeur de retour : [9.3, 15.5, 18.9, 17.6, 15]
```

```js
// Cette fonction retourne les mesures (max) selon la date, l'échéance, le polluant et la station souhaités.

// @Params(year, month, day, code_polluant, code_station, échéance)
get_mesures_max_jour(2019, 11, 16, 8, "FR24018", 5).then((data) =>
{
    console.log(data)
})

// Valeur de retour : [27.7, 21.1, 40, 37.1, 47.5, 43]
```

```js
// Cette fonction retourne les prévisions selon le polluant et les coordonnées souhaité.

// @Params(longitude, latitude, nom_polluant)
get_previsions(7.20194387, 43.6577454, "NO2").then((data) =>
{
    console.log(data);
})

// Valeur de retour : ["67", "67", "67"]
```
