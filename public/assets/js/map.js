/**
 * @author AtmoSud
 * @description ce fichier regroupe toutes les fonctions qui animent la carte Leaflet
 * 
 * @package Leaflet.js
 * @package moment.js
 * @package axios.js
 */


import chartDrawing from './chart.js';

/**
 * Initialisation variables et appel des fonctions
 */
moment.defaultFormat = "YYYY-MM-DD HH:mm";
let sliderDate = document.getElementById('slider__date');
let stationsArray = [];
let stationFilter = [];
let map;
let portMarseille = L.rectangle([[43.36796747943005,5.277392744628937],[43.269552680310994,5.451457380859406]], {color: "#ff7800", weight: 1});
let portFos = L.rectangle([[43.44578690866529,4.8413728471679995],[43.350993565930644,5.042216658203156]], {color: "#ff7800", weight: 1});
let portToulon = L.rectangle([[43.15294771593063,5.8301423784179995],[43.07525442169086,6.017939924804718]], {color: "#ff7800", weight: 1});
let portNice = L.rectangle([[43.634087,7.165146],[43.724467,7.358780]], {color: "#ff7800", weight: 1});
let wind, boat, showStations;

loadingScreen();
initMap();
hydrateSliders();
layerController();
rotatedMarker();


let date = sliderDate.noUiSlider.get().replace('/', '').replace('/', '');
let day = date.substring('0', '2');
let month = date.substring('2', '4');
let year = date.substring('4', '8');
let hours =  sliderDate.noUiSlider.get().substring('11', '13');
let heureLocal = moment(`${year}${month}${day} ${hours}`).subtract(2, 'hours').format('HH');;

/**
 * Créer la map Leaflet
 */
function initMap () {

    let iniZoom = 9;

    if(window.screen.width < 992) iniZoom -= 2
    if(window.screen.width < 1200) iniZoom -= 1;

    let mapLayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy;<a href="http://www.atmosud.org/"> ATMOSUD - 2020 </a>| &copy; OpenStreetMap',
    });

    map = L.map('map', {
        layers: [mapLayer],
        fullscreenControl: true
    });

    map.setView([43.7284, 5.9367], iniZoom);

    portMarseille.addTo(map);
    portFos.addTo(map)
    portToulon.addTo(map)
    portNice.addTo(map)

    document.getElementById('NO2__graph').addEventListener('click', async () => {
        for(let elm of document.querySelectorAll('.nav-graph')) {
            elm.classList.remove('active');
        }
        document.getElementById('NO2__graph').classList.toggle('active');
        await drawChart(document.body.getAttribute('station-selected'), 8, sliderDate.noUiSlider.get());
    });

    document.getElementById('O3__graph').addEventListener('click', async () => {
        for(let elm of document.querySelectorAll('.nav-graph')) {
            elm.classList.remove('active');
        }
        document.getElementById('O3__graph').classList.toggle('active');
        await drawChart(document.body.getAttribute('station-selected'), 7, sliderDate.noUiSlider.get());
    });

    document.getElementById('PM25__graph').addEventListener('click', async () => {
        for(let elm of document.querySelectorAll('.nav-graph')) {
            elm.classList.remove('active');
        }
        document.getElementById('PM25__graph').classList.toggle('active');
        await drawChart(document.body.getAttribute('station-selected'), 6001, sliderDate.noUiSlider.get());
    }); 
}

/**
 * Génère les dates sur la zone de slide et bind les events listeners du sliders.
 */
function hydrateSliders() {
    let actualScroll = 1;
    let sliderBack = document.getElementById('slider__back');
    let sliderNext = document.getElementById('slider__next');
    let dateArrayFilter = [];
    let dateArray = [];
    let flag = 0;
    const totalHours = 720+parseInt(moment().format('HH'));

    for(let i = 0; i != totalHours; i++) {
        if(i == 0) 
            dateArrayFilter.push(moment(new Date().setMinutes('0')).subtract(i, 'hours').format('DD/MM/YYYY'));

        if(flag == 24) {
            dateArrayFilter.push(moment(new Date().setMinutes('0')).subtract(i, 'hours').format('DD/MM/YYYY'));
            flag = 0;
        }

        dateArray.push(moment(new Date().setMinutes('0')).subtract(i, 'hours').format('DD/MM/YYYY HH:mm'));

        flag++;
    }

    const filterPips = (value) => {
        let goodValue = value-parseInt(moment().format('HH'));
        if(goodValue % 24 == 0) 
            return 2;
        return -1;
    }

    noUiSlider.create(sliderDate, {
        range: {
            'min': 0,
            'max': totalHours
        },
        step: 1,
        start: [0],
        orientation: 'horizontal',
        direction: 'rtl',
        connect: [true, false],
        tooltips: true,
        format: {
            to: function (value) {
                return moment(new Date().setMinutes('0')).subtract(value, 'hours').format('DD/MM/YYYY HH:mm');
            },
            from: function (value) {
                return value;
            }
        },
        pips: {
            mode: 'steps',
            density: 24,
            filter: filterPips,
            format: {
                to: function (value) {
                    return dateArrayFilter.shift();
                },
                from: function (value) {
                    return value;
                }
            },
        },
    });

    const triggerEvents = async () => {
        document.querySelectorAll('.nav-graph').forEach(elm => {
            if(elm.classList.contains('active')) elm.click();
        });

        if(!document.body.getAttribute('harbor-selected')) 
            return alert('Veuillez séléctionner un port');
        await selectPort(document.body.getAttribute('harbor-selected'), moment(`${year}${month}${day} ${hours}`).format(moment.defaultFormat));
    }

    sliderDate.noUiSlider.on('set', async () => {
        date = sliderDate.noUiSlider.get().replace('/', '').replace('/', '');
        day = date.substring('0', '2');
        month = date.substring('2', '4');
        year = date.substring('4', '8');
        hours =  sliderDate.noUiSlider.get().substring('11', '13');
        heureLocal = moment(`${year}${month}${day} ${hours}`).subtract(2, 'hours').format('HH');
        document.getElementById('error__data').innerHTML = ``; 
        await triggerEvents();
    });

    document.getElementById('slider__next__hours').addEventListener('click', () => {
        sliderDate.noUiSlider.set(dateArray.indexOf(sliderDate.noUiSlider.get())+1)
    });

    document.getElementById('slider__previous__hours').addEventListener('click', () => {
        sliderDate.noUiSlider.set(dateArray.indexOf(sliderDate.noUiSlider.get())-1)
    });

    sliderNext.addEventListener('click', () => {
        if(actualScroll >= 1) {
            if(sliderBack.classList.contains('hidden'));
                sliderBack.classList.remove('hidden');
        } 

        if(actualScroll == 8) {
            sliderBack.classList.add('hidden');
            actualScroll = 0;
        } 
        
        sliderDate.style = `    
        transform: translateX(${sliderDate.offsetWidth/8 * actualScroll}px);
        transition-property: transform;
        transition-duration: 0.6s;` 

        actualScroll++;
    });

    sliderBack.addEventListener('click', () => {

        if(actualScroll <= 2) {
            if(sliderBack.classList.contains('hidden'));
                sliderBack.classList.add('hidden');
        } 
        
        sliderDate.style = `    
        transform: translateX(${sliderDate.offsetWidth/8 * (actualScroll-2)}px);
        transition-property: transform;
        transition-duration: 0.6s;` 

        actualScroll--;
    })
}

/**
 * Appelle et génère tous les flux autour du port cliqué
 * @param {string} zone 
 * @param {datetime} date 
 */
async function selectPort(zone, date) {

    let coord;

    for(let port of [portFos, portMarseille, portToulon, portNice]) {
        map.removeLayer(port);
    }

    document.querySelector('.slider__container').classList.remove('hidden');
    document.querySelector('.slider__container').classList.add('visible');

    document.querySelector('#indice-echelle').classList.remove('hidden');
    document.querySelector('#indice-echelle').classList.add('visible');
    
    switch(zone) {
        case 'Fos':
            coord = [43.403084948404555,4.908693740323646];
            break;

        case 'Marseille':
            coord = [43.333077492491256,5.3441986536537645];
            break;
        
        case 'Toulon':
            coord = [43.111796653063614,5.9114446611894245];
            break;
        
        case 'Nice':
            coord = [43.693626044702576,7.285718289749963];
            break;
    }

    if(!document.body.getAttribute('harbor-selected') || map.getZoom() <= 12) {
        let zoom = 12;
        if(zone == 'Toulon') {
            zoom += 2;
        } 

        map.setView(coord, zoom);
    }

    document.body.setAttribute('harbor-selected', zone)
    document.getElementById('layer__loader').classList.remove('not-loaded');

    if(wind) 
        await refreshWind(moment(date).format('YYYYMMDD'), moment(date).format('HH'));
     else 
        await generateWind(moment(date).format('YYYYMMDD'), moment(date).format('HH'));

    // if(boat) 
    //     map.removeLayer(this.boat);

    // await generateBoats(`${moment(date).format('YYYYMMDD')} ${moment(date).format('HH')}`);

    if(showStations) 
        await refreshStations(`${moment(date).format('YYYYMMDD')} ${moment(date).format('HH')}`);
    else
        await createStations(`${moment(date).format('YYYYMMDD')} ${moment(date).format('HH')}`, zone);
    
    document.getElementById('layer__loader').classList.add('not-loaded');
}

async function generateWind(date, hours) {
    let response = await fetch(`uploads/wind/vent_json/${date}/wind_field_${hours}.json`, { cache: 'no-store' });

    if(!response.ok) {
        document.getElementById('error__data').innerHTML = ``;
        return document.getElementById('error__data').innerHTML = `
        <div style="z-index:99999999;text-align:center;" class="alert alert-warning alert-dismissible fade show mb-0" role="alert">
            <i class="fas fa-exclamation-triangle mr-2"></i> Problème lors de l'insertion du vent
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>`; 
    }

    let data = await response.json();

    wind = L.velocityLayer({
        displayValues: true,
        displayOptions: {
            velocityType: 'Global Wind',
            position: 'topright',
            angleConvention: "bearingCCW",
            speedUnit: 'k/h'
        },
        
        data: data,
        velocityScale: 0.001
    }).addTo(map);
}

/**
 * Met à jour les données de vent lorsque la date est changée
 * @param {datetime} date 
 * @param {datetime} hours 
 */
async function refreshWind(date, hours) {
    let response = await fetch(`uploads/wind/vent_json/${date}/wind_field_${hours}.json`, { cache: 'no-store' });

    if(!response.ok) {
        document.getElementById('error__data').innerHTML = ``;
        return document.getElementById('error__data').innerHTML = `
        <div style="z-index:99999999;text-align:center;" class="alert alert-warning alert-dismissible fade show mb-0" role="alert">
            <i class="fas fa-exclamation-triangle mr-2"></i> Problème lors de l'insertion du vent
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>`; 
    } 
        
    let result = await response.json();

    wind.setData(result);
}

/**
 * Est appelée dans la @function selectPort() et permet de générer la liste de stations et les valeurs associés aux polluants
 * @param {datetime} date 
 * @param {string} zone 
 */
async function createStations(date, zone) {

    let listeStations;
    
    switch(zone) {
        case 'Marseille':
            listeStations = `'FR03014', 'FR03043', 'FR03006', 'FR03015'`;
            break;

        case 'Toulon':
            listeStations = `'FR03060', 'FR03068', 'FR03071'`;
            break;

        case 'Nice':
            listeStations = `'FR24030', 'FR24011', 'FR24035', 'FR24036'`;
            break;

        case 'Fos':
            listeStations = `'FR02009', 'FR02008', 'FR02004', 'FR02029', 'FR02021'`;
            break;
    }

    let url = `https://geoservices.atmosud.org/geoserver/mes_sudpaca_horaire_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_horaire_poll_princ:mes_sudpaca_horaire&outputFormat=application%2Fjson&srsName=EPSG:4326&CQL_FILTER=code_station%20IN%20(${listeStations})%20AND%20date_debut%20>=%20%27${moment(date).subtract(5, 'hours').format('YYYY/MM/DD HH')}:00%27%20AND%20date_fin%20<=%20%27${moment(date).subtract(2, 'hours').format('YYYY/MM/DD HH')}:59%27`;

    let response = await fetch(url);
    
    if(!response.ok) {
        document.getElementById('error__data').innerHTML = ``;
        return document.getElementById('error__data').innerHTML = `
        <div style="z-index:99999999;text-align:center;" class="alert alert-warning alert-dismissible fade show mb-0" role="alert">
            <i class="fas fa-exclamation-triangle mr-2"></i> Problème lors de l'insertion des stations de mesures
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>`; 
    }

    let data = await response.json();

    const getIndice = (value, poll) => {
        value = Math.round(value);
       
        if(poll == 6001) {
            if(value >= 0 && value <= 10)
                return 'bon';
            else if(value >= 11 && value <= 20)
                return 'moyen';
            else if(value >= 21 && value <= 25)
                return 'degrade';
            else if(value >= 26 && value <= 50)
                return 'mauvais';
            else if(value >= 51 && value <= 75)
                return 'tres_mauvais';
            else 
                return 'extremement_mauvais'; 
        } else if(poll == 7) {
            if(value >= 0 && value <= 50)
                return 'bon';
            else if(value >= 51 && value <= 100)
                return 'moyen';
            else if(value >= 101 && value <= 130)
                return 'degrade';
            else if(value >= 131 && value <= 240)
                return 'mauvais';
            else if(value >= 240 && value <= 380)
                return 'tres_mauvais';
            else 
                return 'extremement_mauvais'; 
        } else if(poll == 8) {
            if(value >= 0 && value <= 40)
                return 'bon';
            else if(value >= 41 && value <= 90)
                return 'moyen';
            else if(value >= 91 && value <= 120)
                return 'degrade';
            else if(value >= 121 && value <= 230)
                return 'mauvais';
            else if(value >= 231 && value <= 340)
                return 'tres_mauvais';
            else 
                return 'extremement_mauvais'; 
        }
    }

    const findDuplicate = (arra1) => {
        let object = {};
        let result = [];

        arra1.forEach(function (item) {
          if(!object[item])
              object[item] = 0;
            object[item] += 1;
        })

        for(let prop in object) {
           if(object[prop] >= 2) {
               result.push(prop);
           }
        }

        return result;
    }

    for(let station of data.features) {
        stationsArray.push(station.properties.code_station)
    }

    stationFilter = findDuplicate(stationsArray);
    let stationValues = [];
    let stationObject = {};

    for(let i of stationFilter) {

        for(let station of data.features) {

            if(station.properties.code_station == i) {
                if(!stationObject[station.properties.code_station]) {
                    stationObject[station.properties.code_station] = {
                        'pm25': undefined,
                        'no2': undefined,
                        'o3': undefined
                    }
                }

                if(station.properties.id_poll_ue == 6001) {
                    stationObject[station.properties.code_station].pm25 = station.properties.valeur
                    
                } else if(station.properties.id_poll_ue == 8) {
                    stationObject[station.properties.code_station].no2 = station.properties.valeur
                  
                } else if(station.properties.id_poll_ue == 7) {
                    stationObject[station.properties.code_station].o3 = station.properties.valeur
                    
                }
            }
        }

        stationValues[i] = stationObject[i];
    }

    let indexFeatures = [];

    showStations = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {

            for(let validator of indexFeatures) {
                if(validator == feature.properties.code_station) {
                    return;
                }
            }

            indexFeatures.push(feature.properties.code_station);

            let circle =  new L.CircleMarker(latlng, { 
                radius: 5,
                fillColor: "rgb(80,204,170)",
                color: "rgb(80,204,170)",
                weight: 1,
                opacity: 1,
                title: feature.properties.nom_station 
            })

            return circle;
        },

        onEachFeature: async (feature, layer) => {
            let templateHtml = '';
            let pollEnabled = [];
            let className;

            if(stationValues[feature.properties.code_station].pm25 != undefined) {
                let pollValue = stationValues[feature.properties.code_station].pm25
                templateHtml += `
                <div class="popup__values__container">
                    <div style="text-align: center;" scope="col">PM25</div>
                    <div style="text-align: center;" id="${feature.properties.code_station}_6001" class="polluant__values ${getIndice(pollValue, 6001)}">
                        ${Math.round(pollValue)} 
                    </div>
                </div>`;

                pollEnabled.push('PM25');
            }

            if(stationValues[feature.properties.code_station].no2 != undefined) {
                let pollValue = stationValues[feature.properties.code_station].no2
                templateHtml += `
                <div class="popup__values__container">
                    <div style="text-align: center;" scope="col">NO<sub>2</sub></div>
                    <div style="text-align: center;" id="${feature.properties.code_station}_8" class="polluant__values ${getIndice(pollValue, 8)}">
                        ${Math.round(pollValue)} 
                    </div>
                </div>`;

                pollEnabled.push('NO2');
            }

            if(stationValues[feature.properties.code_station].o3 != undefined) {
                let pollValue = stationValues[feature.properties.code_station].o3
                templateHtml += `
                <div class="popup__values__container">
                    <div style="text-align: center;" scope="col">O<sub>3</sub></div>
                    <div style="text-align: center;" id="${feature.properties.code_station}_7" class="polluant__values ${getIndice(pollValue, 7)}">
                        ${Math.round(pollValue)}
                    </div>
                </div>`;

                pollEnabled.push('O3');
            }

            if(pollEnabled.length == 1) {
                className = 'one__value'
            } else if(pollEnabled.length == 2) {
                className = 'two__value'
            } else if(pollEnabled.length == 3) {
                className = 'three__value'
            }

            let popupContent = L.DomUtil.create('div', feature.properties.code_station);

            popupContent.innerHTML = `
            <div id="${feature.properties.code_station}" 
                 nomStation="${feature.properties.nom_station}"
                 data-target="#modal-chart" 
                 data-toggle="modal">

                <div class="${className}" style="position:relative;">
                    ${templateHtml}
                </div>
            </div>`

            let popup = L.popup({ className: 'popup-polluant', closeButton: false, closeOnClick: false, autoPan: false, autoClose: false, keepInView: true })
                .setContent(popupContent);

            if(!className) {
                layer.options.color = '#ff7800';
                layer.options.fillColor = '#ff7800';
            }

            L.DomEvent.addListener(popupContent, 'click', function(){
                document.getElementById('PM25__graph').style.setProperty('display', 'none');
                document.getElementById('NO2__graph').style.setProperty('display', 'none');
                document.getElementById('O3__graph').style.setProperty('display', 'none');
                document.body.setAttribute('station-selected', feature.properties.code_station);
                
                for(let poll of pollEnabled) {
                    document.getElementById(poll+'__graph').style.setProperty('display', 'block');
                }

                document.getElementById(pollEnabled[0]+'__graph').classList.toggle('active');
                
                document.getElementById(pollEnabled[0]+'__graph').click();
            });

            layer.bindPopup(popup).openPopup();

            layer.on('add', () => {
                layer.openPopup();
            })
        } 
    }).addTo(map);
}

/**
 * met a jour les valeurs des mesures aux stations lorsque l'heure change
 */
async function refreshStations() {
    
    const getIndice = (value, poll) => {
        value = Math.round(value);
       
        if(poll == 6001) {
            if(value >= 0 && value <= 10)
                return 'bon';
            else if(value >= 11 && value <= 20)
                return 'moyen';
            else if(value >= 21 && value <= 25)
                return 'degrade';
            else if(value >= 26 && value <= 50)
                return 'mauvais';
            else if(value >= 51 && value <= 75)
                return 'tres_mauvais';
            else 
                return 'extremement_mauvais'; 
        } else if(poll == 7) {
            if(value >= 0 && value <= 50)
                return 'bon';
            else if(value >= 51 && value <= 100)
                return 'moyen';
            else if(value >= 101 && value <= 130)
                return 'degrade';
            else if(value >= 131 && value <= 240)
                return 'mauvais';
            else if(value >= 240 && value <= 380)
                return 'tres_mauvais';
            else 
                return 'extremement_mauvais'; 
        } else if(poll == 8) {
            if(value >= 0 && value <= 40)
                return 'bon';
            else if(value >= 41 && value <= 90)
                return 'moyen';
            else if(value >= 91 && value <= 120)
                return 'degrade';
            else if(value >= 121 && value <= 230)
                return 'mauvais';
            else if(value >= 231 && value <= 340)
                return 'tres_mauvais';
            else 
                return 'extremement_mauvais'; 
        }
    }

    for(let station of stationFilter) {

        for(let activePoll of [6001, 8, 7]) {
            if(document.getElementById(station+'_'+activePoll)) {
                let data = await getLastMesuresHours(activePoll, station, `${moment(`${year}${month}${day} ${heureLocal}`).format('YYYY-MM-DD HH:mm')}`);
                let div = document.querySelector(`#${station}_${activePoll}`);
                
                div.setAttribute('class', `polluant__values ${getIndice(data, activePoll)}`);
                div.textContent = Math.round(data);
            }
        }
    }
}

/**
 * genère la position des données IHS 
 * @param {datetime} date 
 */
async function generateBoats(date) {

    if(boat) map.removeLayer(boat);

    let boatMarkers = [];
    let color;
    let json = {};
    
    const svg = (color) => {
        return encodeURIComponent(`<svg width="100%" height="100%" viewBox="0 0 201.26 201.26" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="margin-top: 0px;margin-left: 0px;margin-right: 0px;fill: ${color};">
          <path d="M105.019 84.875c5.668 1.855 9.785 7.129 9.785 13.412 0 7.826-6.348 14.18-14.174 14.18-7.825 0-14.173-6.354-14.173-14.18 0-6.438 4.315-11.807 10.189-13.541V27.118l-31.449 75.55v81.517l36.371-31.353 34.496 31.353V98.589l-31.045-71.812v58.098z"></path>
          <path fill="rgba(0, 0, 0, .2)" d="M100.864.366L58.11 103.076v97.819l43.646-37.624 41.394 37.624V98.182L100.864.366zm35.199 183.818l-34.496-31.353-36.371 31.353v-81.517l31.449-75.55v57.628c-5.874 1.734-10.189 7.104-10.189 13.541 0 7.826 6.348 14.18 14.173 14.18 7.827 0 14.174-6.354 14.174-14.18 0-6.283-4.117-11.557-9.785-13.412V26.778l31.045 71.812v85.594z"></path>
        </svg>`);
    }
      
    const BoatIcon = (color) => {
        return L.icon({
            iconUrl: `data:image/svg+xml,${svg(color)}`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, 0],
        });
    }


    json.value = moment(date).format('YYYY-MM-DD HH:mm:ss');

    if(toTimestamp(date) > toTimestamp(moment().format('YYYY-MM-DD HH:mm:ss'))) {
        return alert('Date invalide pour les données maritimes');
    }

    let response = await fetch('/smartport/api.ihs.php', {
        method: 'POST',
        mode: "same-origin",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
            dateIhs: moment(date).format('YYYY-MM-DD HH:mm:ss')
        })
    });

    if(!response.ok) {
        document.getElementById('error__data').innerHTML = '';
        return document.getElementById('error__data').innerHTML = `
        <div style="z-index:99999999;text-align:center;" class="alert alert-warning alert-dismissible fade show mb-0" role="alert">
            <i class="fas fa-exclamation-triangle mr-2"></i> Problème lors de l'insertion des données maritimes
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>`; 
    }

    let boatData = await response.json();

    if(boatData.code == 400) throw new Error('An error occured during the request');

    for(let data of JSON.parse(boatData.results)) {
    
        const [name, lon, lat, vesselType, destination, status, heading, width] = data;

        switch (vesselType) {
            
            case 'Cargo':
            color = 'lightgreen';
            break;

            case 'Tanker':
            color = 'red';
            break;

            case 'Passenger':
            color = 'blue';
            break;
            
            case 'High Speed Craft':
            color = 'yellow';
            break;

            case 'Tug':
            color = 'cyan';
            break;

            case 'Fishing':
            color = 'rgb(255, 160, 122)';
            break;

            case 'Pilot Boat':
            color = 'green';
            break;

            case 'Search And Rescue':
            color = 'lightblue';
            break;

            default: 
            color = 'grey';
            break;
        }
        
        let marker =  L.marker([lat, lon], {
            icon: BoatIcon(color),
            rotationAngle: heading
        })
            .bindPopup(`<div class="d-flex flex-column justify-content-center align-items-center">
                <p style="margin:0">Nom : ${name}</p><br><p style="margin:0">Type : ${vesselType}</p><br>
                <p style="margin:0;
                ">Destination : ${destination}</p><br><p style="margin:0">Status : ${status}</p>
            </div>`, {
                className: 'boat-popup'
            })
            marker.addTo(map);

        boatMarkers.push(marker);
    }

    boat = L.layerGroup(boatMarkers).addTo(map);
}

/**
 * Cette fonction trâce une courbes des 24h dernières heures ou des 24h glissantes si la date sélectionnée est inférieure à maintenant - 12 heures
 * @package Chart.js
 * @param {string} codeStation 
 * @param {integer} polluant 
 */
async function drawChart(codeStation, polluant) {       
    
    let pollName;

    switch (polluant) {
        case 6001:
            pollName = 'PM25';
            break;
        
        case 7:
            pollName = 'O3';
            break;

        case 8: 
            pollName = 'NO2';
            break;
    }

    if(window.screen.width >= 992) {
        document.getElementById('modal-canvas').innerHTML = `
        <img id='legend__graph' src='./images/legend_${pollName}.png'/>
        <canvas id="canvas-${codeStation}" class="chartjs-render-monitor" width="675" height="675"></canvas>`;
    } else {
        document.getElementById('modal-canvas').innerHTML = `
        <canvas id="canvas-${codeStation}" class="chartjs-render-monitor" width="675" height="675"></canvas>`;
    }

    let canvas = document.querySelector('#canvas-'+codeStation).getContext('2d');

    let data = await getMesuresHoraireGlissantes(polluant, codeStation, `${moment(`${year}${month}${day} ${heureLocal}`).format('YYYY-MM-DD HH:mm')}`);

    if(data.length < 24) {
        data = await getMesuresHoraireJour(polluant, codeStation, `${moment(`${year}${month}${day} ${heureLocal}`).format('YYYY-MM-DD HH:mm')}`);
        new chartDrawing(pollName, canvas).drawMesureHoraire(data, `${moment(`${year}${month}${day} ${hours}`).format('HH')}`);
    } else {
        new chartDrawing(pollName, canvas).drawMesureHoraireGlissante(data, `${moment(`${year}${month}${day} ${hours}`).format('HH')}`);
    }

    if(!data || data.length <= 0) {
        return document.getElementById('graph__title').innerHTML = `
        <div class="alert alert-warning w-100" role="alert" style="font-size: 1rem">
        <i class="fas fa-exclamation-triangle mr-2"></i>Pas de données pour la date du ${moment(`${year}${month}${day} ${hours}`).format('YYYY-MM-DD HH:mm')}
        </div>`;
    }

    if(document.getElementById(codeStation)) {
        document.getElementById('graph__title').innerHTML = `
        ${codeStation} | ${document.getElementById(codeStation).getAttribute('nomStation')}
        <br>
        ${moment(`${year}${month}${day} ${hours}`).format('YYYY-MM-DD HH:mm')}`;
    }
}

/**
 * Cette fonction récupère les 24 dernières heures de mesures à la station voulue
 * @param {integer} polluantId 
 * @param {string} codeStation 
 * @param {datetime} date 
 * @returns Promise 
 */
function getMesuresHoraireJour(polluantId, codeStation, date) {
    return new Promise((resolve, reject) => {
        
        const createRequests = () => {

            console.log(heureLocal)
            
            const results = []; 

            const dateDebut = moment(`${year}${month}${day} ${heureLocal}`).subtract(1, 'day').format('YYYY/MM/DD HH');
            const dateFin = moment(`${year}${month}${day} ${heureLocal}`).format('YYYY/MM/DD HH');
            let url = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_horaire_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_horaire_poll_princ:mes_sudpaca_horaire&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27" + dateDebut + ":00" + "%27%20AND%20id_poll_ue%20=%20"+polluantId+"%20AND%20code_station%20=%20%27"+codeStation+"%27%20AND%20date_fin<=%27"+ dateFin +":59" + "%27";
            const request = axios.get(url);
            results.push(request); 

            return results;
        }

        if(polluantId && codeStation && date) {

            const requests = createRequests();

            Promise.all(requests).then(responseS => {
                const data = responseS.map(response => response.data.features.map(feature => feature.properties.valeur));
                const clearData = data[0];
                resolve(clearData);
            })
        } else {
            reject();
        }
    })
}

/**
 * Cette fonction récupère les 24 heures glissantes de mesures à la station voulue
 * @param {integer} polluantId 
 * @param {string} codeStation 
 * @param {datetime} date 
 * @returns Promise 
 */
function getMesuresHoraireGlissantes(polluantId, codeStation, date) {
    
    return new Promise((resolve, reject) => {
        
        const createRequests = () => {
            
            const results = []; 

            const dateDebut = moment(`${year}${month}${day} ${heureLocal}`).subtract(12, 'hours').format('YYYY/MM/DD HH');
            const dateFin = moment(`${year}${month}${day} ${heureLocal}`).add(12, 'hours').format('YYYY/MM/DD HH');

            let url = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_horaire_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_horaire_poll_princ:mes_sudpaca_horaire&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27" + dateDebut + ":00" + "%27%20AND%20id_poll_ue%20=%20"+polluantId+"%20AND%20code_station%20=%20%27"+codeStation+"%27%20AND%20date_fin<=%27"+ dateFin +":59" + "%27";
            const request = axios.get(url);
            results.push(request); 


            return results;
        }

        if(polluantId && codeStation && date) {

            const requests = createRequests();

            Promise.all(requests).then(responseS => {
                const data = responseS.map(response => response.data.features.map(feature => feature.properties.valeur));
                const clearData = data[0];
                resolve(clearData);
            })
        } else {
            reject();
        }
    })
}

/**
 * Cette fonction récupère la dernière valeur en base des mesures à la station voulue
 * @param {integer} polluantId 
 * @param {string} codeStation 
 * @param {datetime} date 
 * @returns Promise 
 */
function getLastMesuresHours(polluantId, codeStation, date) {
    return new Promise((resolve, reject) => {
        
        const createRequests = () => {
            
            const results = []; 

            const dateDebut = moment(`${year}${month}${day} ${heureLocal}`).format('YYYY/MM/DD HH');
            const dateFin = moment(`${year}${month}${day} ${heureLocal}`).format('YYYY/MM/DD HH');
            let url = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_horaire_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_horaire_poll_princ:mes_sudpaca_horaire&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27" + dateDebut + ":00" + "%27%20AND%20id_poll_ue%20=%20"+polluantId+"%20AND%20code_station%20=%20%27"+codeStation+"%27%20AND%20date_fin<=%27"+ dateFin +":59" + "%27";
            console.log(codeStation, polluantId, url);
            const request = axios.get(url);
            results.push(request); 

            return results;
        }

        if(polluantId && codeStation && date) {

            const requests = createRequests();

            Promise.all(requests).then(responseS => {
                const data = responseS.map(response => response.data.features.map(feature => feature.properties.valeur));
                const clearData = data[0];
                resolve(clearData);
            })
        } else {
            reject();
        }
    })
}

/**
 * Permet d'afficher les ports ou les données du port choisi en fonction du niveau de zoom.
 */
function layerController() {

    const removePortLayers = () => {
        for(let port of [portFos, portMarseille, portToulon, portNice]) {
            if(port) map.removeLayer(port);
        }
    }

    const addPortLayers = () => {
        for(let port of [portFos, portMarseille, portToulon, portNice]) {
            if(port) map.addLayer(port);
        }
    }

    const removeLayers = () => {
        for(let layer of [showStations, wind, boat]) {
            if(layer) map.removeLayer(layer);
        }
    }

    const addLayers = () => {
        for(let layer of [showStations, wind, boat]) {
            if(layer) {
                map.addLayer(layer);
            }
        }
    }

    map.on('zoom', () => {
        let z = map.getZoom();
    
        if (z > 0 && z < 12) {
            removeLayers();
            addPortLayers();
        } else {
            addLayers()
            removePortLayers();
        }
    });


    for(let port of [
        { layer: portFos, name: 'Fos'}, 
        { layer: portMarseille, name: 'Marseille'}, 
        { layer: portToulon, name: 'Toulon'}, 
        { layer: portNice, name: 'Nice'}
       ]) 
    {
        port.layer.on('click', () => {
            selectPort(port.name, moment(`${year}${month}${day} ${hours}`).format(moment.defaultFormat));
        })
    }
}

/**
 * Plugin Leaflet qui permet de rajouter un paramètre 'rotationAngle' aux L.Markers. Utilisé pour orienter les bateaux
 */
function rotatedMarker() {

    var proto_initIcon = L.Marker.prototype._initIcon;
    var proto_setPos = L.Marker.prototype._setPos;

    var oldIE = (L.DomUtil.TRANSFORM === 'msTransform');

    L.Marker.addInitHook(function () {
        var iconOptions = this.options.icon && this.options.icon.options;
        var iconAnchor = iconOptions && this.options.icon.options.iconAnchor;
        if (iconAnchor) {
            iconAnchor = (iconAnchor[0] + 'px ' + iconAnchor[1] + 'px');
        }
        this.options.rotationOrigin = this.options.rotationOrigin || iconAnchor || 'center bottom' ;
        this.options.rotationAngle = this.options.rotationAngle || 0;

        
        this.on('drag', function(e) { e.target._applyRotation(); });
    });

    L.Marker.include({
        _initIcon: function() {
            proto_initIcon.call(this);
        },

        _setPos: function (pos) {
            proto_setPos.call(this, pos);
            this._applyRotation();
        },

        _applyRotation: function () {
            if(this.options.rotationAngle) {
                this._icon.style[L.DomUtil.TRANSFORM+'Origin'] = this.options.rotationOrigin;

                if(oldIE) {
                    this._icon.style[L.DomUtil.TRANSFORM] = 'rotate(' + this.options.rotationAngle + 'deg)';
                } else {
                    this._icon.style[L.DomUtil.TRANSFORM] += ' rotateZ(' + this.options.rotationAngle + 'deg)';
                }
            }
        },

        setRotationAngle: function(angle) {
            this.options.rotationAngle = angle;
            this.update();
            return this;
        },

        setRotationOrigin: function(origin) {
            this.options.rotationOrigin = origin;
            this.update();
            return this;
        }
    });
}

/**
 * Ecran de chargement lors du chargement de la page
 */
function loadingScreen() {
    document.getElementById('map__loader').classList.add('anim-not-loaded');
    setTimeout(function() {
        document.getElementById('map__loader').classList.remove('anim-not-loaded');
        document.getElementById('map__loader').classList.add('not-loaded');
    }, 1000);
}

/**
 * Retourne une date au format timestamp
 * @param {datetime} strDate 
 */
function toTimestamp(strDate) {
    return (Date.parse(strDate)/1000);
}


















