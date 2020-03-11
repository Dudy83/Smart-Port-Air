/**
 * Classe principale pour la map
 * Elle utilise la classe MapAPI qui effectue les requêtes et la classe chartDrawing qui trace les courbes.
 */
require('../css/map.scss');
import chartDrawing from './chart.js';
import { MapAPI } from './mapAPI.js';

class SmartPortMap extends HTMLElement {
    
    constructor() {
        super();
        this.stations = new Array();
        this.markerObject = new Array();
        this.moment = require('moment'); 
        new Plyr('#player', {
            controls: [
                'play',
                'progress',
                'mute',
                'volume',
                'play-large',
                'current-time',
                'fullscreen',
            ]
        });
    }

    async connectedCallback() {
        this.initiateMap();
        await this.createStations();
        await this.wmsMap('multi');
        await this.generateWind();
        await this.createUserMesures();
        await this.generateBoats();
        this.customMenu();
        this.addMesureXHR();
        this.refreshWmsMap();
        // remove the laoding animation when everything is loaded on the map
        document.getElementById('map__loader').classList.add('anim-not-loaded');

        setTimeout(function() {
            document.getElementById('map__loader').classList.remove('anim-not-loaded');
            document.getElementById('map__loader').classList.add('not-loaded');
        }, 1000)
        
    }

    initiateMap() {
        this.iniZoom = 9;

        this.darkMap = L.tileLayer("http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", { 
            attribution: '&copy;<a href="http://www.airpaca.org/"> ATMOSUD - 2020 </a>| © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | © <a href="https://www.mapbox.com/">Mapbox</a>'
        });
        
        this.mapboxMap = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: '&copy;<a href="http://www.airpaca.org/"> ATMOSUD - 2020 </a>| © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            accessToken: 'pk.eyJ1IjoiZHVkeTgzIiwiYSI6ImNrNW1pbTA1djA4MHIzZGw1NTBjZHh5dW8ifQ.jJ8WpKmBG9WSoc5hWGALag'
        });

        this.baseLayers = {
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-map-marked-alt fa-fw'></i></div> <p class='control-menu-text-content'>Normal</p><div class='radioCheck'></div></span>": this.mapboxMap,
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-map-marked-alt fa-fw'></i></div> <p class='control-menu-text-content'>Noir</p><div class='radioCheck'></div></span></span>": this.darkMap,
        };

        this.map = L.map('map', {
            layers: [ this.mapboxMap ],
            minZoom: 8,
            maxZoom: 20,
            zoomControl: false
        });
       
        if(window.screen.width < 1000) this.iniZoom -= 2;
        
        if(window.screen.width < 1400) this.iniZoom -= 1;

        this.map.setView([43.7284, 5.9367], this.iniZoom);
    }

    async createStations() { 
        
        let geoJson = await new MapAPI().getStations(this.stations);
        
        this.showStations = await L.geoJSON(geoJson, {

            pointToLayer: (feature, latlng) => {

              let customIcon = L.icon({
                iconUrl: 'images/Templatic-map-icons/science.png',
                iconSize:     [22, 33], 
                iconAnchor:   [11, 33],
                popupAnchor:  [0, -33] 
              });

              let circle =  new L.marker(latlng, { icon: customIcon, title: feature.properties.nom_station })
              this.markerObject.push(circle);

              return circle;
            },
        
            onEachFeature: (feature, layer) => {
                
                layer.bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636">' + feature.properties.nom_station +  '</h5><button style="color: #fff;background-color:#6BBA62" id="modalBtn'+feature.properties.code_station+'" code='+feature.properties.code_station+' lon='+feature.geometry.coordinates[0]+' lat='+feature.geometry.coordinates[1]+' type="button" class="btn w-100 dataNO2" data-toggle="modal" data-target=#mod-'+feature.properties.code_station+'><i class="fas fa-chart-line mr-2"></i>Graphique des polluants</button></div>');
                
                layer.on('click', () => {
                    document.getElementById('NO-'+feature.properties.code_station).click();
                });
                
                document.getElementById('modals-container').innerHTML += `
                <div style="z-index: 7000;" class="modal fade right" id="mod-`+feature.properties.code_station+`" tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                    <div class="modal-dialog modal-full-height modal-right w-100" role="document" style="position: fixed !important;right: 0;height: 100%;top: 0;margin: 0;">
                        <div class="modal-content" style="height:100%">        
                            <div class="modal-header d-flex flex-column justify-content-center align-items-center">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 class="modal-title w-100" id="myModalLabel" style="text-align:center;">`+feature.properties.nom_station+ `</h4>
                                <h4 id="`+feature.properties.code_station+`">`+feature.properties.code_station+`</h4>
                            </div>
                            <div class="modal-body">
                                <ul class="nav nav-tabs d-flex justify-content-center align-items-center mb-5" id="nav-`+feature.properties.code_station+`">
                                    <li class="nav-item">
                                        <a id="NO-`+feature.properties.code_station+`" class="NO2graph nav-link" code="`+feature.properties.code_station+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">NO<sub>2</sub></a>
                                    </li>
                                    <li class="nav-item">
                                        <a id="O3-`+feature.properties.code_station+`" class="O3graph nav-link" code="`+feature.properties.code_station+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">O<sub>3</sub></a>
                                    </li>
                                    <li class="nav-item">
                                        <a id="PM-`+feature.properties.code_station+`" class="PM10graph nav-link" code="`+feature.properties.code_station+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">PM10</a>
                                    </li>
                                    <li class="nav-item">
                                        <a id="SO-`+feature.properties.code_station+`" class="SO2graph nav-link" code="`+feature.properties.code_station+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">SO<sub>2</sub></a>
                                    </li>
                                    <li class="nav-item">
                                        <a id="MP-`+feature.properties.code_station+`" class="PM25graph nav-link" code="`+feature.properties.code_station+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">PM2.5</a>
                                    </li>
                                </ul>
                                <div class="w-100 d-flex justify-content-center align-items-center" id="modal-`+feature.properties.code_station+`">
                                </div>
                            </div>                          
                        </div>      
                    </div>     
                </div>`;
            } 
        }).addTo(this.map);

        this.bindEvents();

        let resultsContainer = document.getElementById('container-results-search');

        let baseTemplate = `
            <div class="w-100 d-flex align-items-center justify-content-center" style="margin-top:25vh;">
                <img src="/images/locationsearch.png" width="256px">
            </div>
            <div class=""w-100>
                <p style="text-align: center;">Rechercher par stations ou code stations !</p>
            </div>`;
        
        resultsContainer.innerHTML = baseTemplate;

        document.getElementById('search-tool-input').addEventListener('keyup', this.searchStations.bind(this));
    }

    async createUserMesures() {
        
      let data = await new MapAPI().getUserMesures();

        if(data == 500) return;

        for(let idx of data) {

            const [lon, lat, polluant, username, date] = idx;

            new L.circleMarker([lat, lon], {
                fillColor: "#B45151",
                color: "#B45151", 
            }).bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636"> Mesures : ' + polluant +  '</h5><button style="color: #fff;background-color:#6BBA62" id="modalBtn'+username+'" type="button" class="btn w-100 dataNO2" data-toggle="modal" data-target=#mod-'+username+'><i class="fas fa-chart-line mr-2"></i>Graphique des polluants</button></div>')
              .addTo(this.map);

            let getImgPolluant = polluant.substring(0, 2);

            if(polluant == 'PM25') getImgPolluant = 'MP';

            document.getElementById('modals-container').innerHTML += `
            <div style="z-index: 7000;" class="modal fade right" id="mod-`+username+`" tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                <div class="modal-dialog modal-full-height modal-right w-100" role="document" style="position: fixed !important;right: 0;height: 100%;top: 0;margin: 0;">
                    <div class="modal-content" style="height:100%"> 
                        <div class="modal-header d-flex flex-column justify-content-center align-items-center">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 class="modal-title w-100"  style="text-align:center;" id="`+username+`">Mesures personnelles de `+username+` en `+polluant+`</h4>
                        </div>                 
                        <div class="modal-body">
                            <div class="w-100 d-flex justify-content-center align-items-center" id="modal-`+username+`">
                                <img class="charts-legend" id="image-${username}" src="images/legend_${getImgPolluant}.png">
                                <canvas class="chartjs-render-monitor" id="canvas-${username}" width="600" height="600"></canvas>
                            </div>
                        </div>   
                    </div>
                </div>
            </div>`;

            this.bindEvents();
        }

        for(let idx of data) {
          const [lon, lat, polluant, username, date] = idx;
          await new chartDrawing(polluant, document.getElementById('canvas-'+username).getContext('2d')).drawUsersMesures(username, date.date);
        }
    }

    async wmsMap(polluant) {
        let data = new MapAPI().getWmsMap(polluant);
        let flag = 0;

        this.azurPacaMulti = await L.tileLayer.wms(data.url, {
            layers: data.result,
            format: 'image/png',
            transparent: true,
            opacity: 0.6
        }).addTo(this.map);

        this.azurPacaMulti.on('tileerror', () => {
            if(flag == 1) return;
            flag = 1;
            alert('Problème lors de l\'insertion de la carte de pollution. Veuillez réessayer.');
        });

        this.azurPacaMulti.on('add', () => {
            console.log('test');
            
            let layersContainer = document.querySelector('.leaflet-control-layers-overlays');

            let polluantChoices = document.createElement('div');

            polluantChoices.setAttribute('id', 'polluant__choices');

            polluantChoices.innerHTML = `
     
            <div class="form-group w-100 mb-0">
                <select id="select-polluant-wms" class="form-control">
                    <option value="multi">Multi Polluant</option>
                    <option value="no2">NO2</option>
                    <option value="pm10">PM10</option>
                    <option value="pm2_5">PM25</option>
                </select>
            </div>`;

           setTimeout(() => {
            layersContainer.insertBefore(polluantChoices, layersContainer.querySelectorAll('label')[2]);
            document.querySelector('#select-polluant-wms').selectedIndex = JSON.parse(sessionStorage.getItem('selectedIndex'));
            sessionStorage.clear();
            this.refreshWmsMap();
           }, 1);
        })
    } 

    refreshWmsMap() {
        document.querySelector('#select-polluant-wms').addEventListener('change', async (event) => {   
            sessionStorage.setItem('selectedIndex', JSON.stringify(document.querySelector('#select-polluant-wms').selectedIndex))
            let data = new MapAPI().getWmsMap(event.target.value);
            this.azurPacaMulti.wmsParams.layers = data.result;
            this.map.removeLayer(this.azurPacaMulti);
            this.map.addLayer(this.azurPacaMulti);
        })
    }

    async generateBoats() {

        let markers = new Array();
        let color;
        
        const svg = (color) => {
            return encodeURIComponent(`<svg width="100%" height="100%" viewBox="0 0 201.26 201.26" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="margin-top: 0px;margin-left: 0px;margin-right: 0px;fill: ${color};">
              <path d="M105.019 84.875c5.668 1.855 9.785 7.129 9.785 13.412 0 7.826-6.348 14.18-14.174 14.18-7.825 0-14.173-6.354-14.173-14.18 0-6.438 4.315-11.807 10.189-13.541V27.118l-31.449 75.55v81.517l36.371-31.353 34.496 31.353V98.589l-31.045-71.812v58.098z"></path>
              <path fill="rgba(0, 0, 0, .2)" d="M100.864.366L58.11 103.076v97.819l43.646-37.624 41.394 37.624V98.182L100.864.366zm35.199 183.818l-34.496-31.353-36.371 31.353v-81.517l31.449-75.55v57.628c-5.874 1.734-10.189 7.104-10.189 13.541 0 7.826 6.348 14.18 14.173 14.18 7.827 0 14.174-6.354 14.174-14.18 0-6.283-4.117-11.557-9.785-13.412V26.778l31.045 71.812v85.594z"></path>
            </svg>`);
        }
          
        const MARKER_URL = (color) => `data:image/svg+xml,${svg(color)}`;

        const BoatIcon = (color) => {
            return L.icon({
                iconUrl: MARKER_URL(color),
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, 0],
            });
        }

        let boatData = await new MapAPI().getIHS();

        const updateIconStyle = () => {        
            for(let i in markers) {
                markers[i]._icon.style.transform = `${markers[i]._icon.style.transform} rotateZ(${JSON.parse(boatData.results)[i][6] || 0}deg)`;
                markers[i]._icon.style.transformOrigin = 'center';
            }
        }
    
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
        
            let long = lon.substring(3, lon.length);
            let lati = lat.substring(3, lat.length);
            
            const marker =  L.marker([lat, lon], {
            icon: BoatIcon(color),
            }).bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><button style="color: #fff;background-color:#6BBA62" type="button" class="modal-btn-boat btn w-100" data-toggle="modal" data-target=#mod-'+long+lati+'><i class="fas fa-chart-line mr-2"></i>Graphique des émissions</button></div>')
            .addTo(this.map);

            document.getElementById('modals-boats-container').innerHTML += `
            <div style="z-index: 7000;" class="modal fade right" id="mod-`+long+lati+`" tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                <div class="modal-dialog modal-full-height modal-right w-100" role="document" style="position: fixed !important;right: 0;height: 100%;top: 0;margin: 0;">
                    <div class="modal-content" style="height:100%">        
                        <div class="modal-header d-flex flex-column justify-content-center align-items-center">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <p style="margin:0">Nom : ${name}</p><br><p style="margin:0">Type : ${vesselType}</p><br>
                            <p style="margin:0">Destination : ${destination}</p><br><p style="margin:0">Status : ${status}</p>
                        </div>
                        <div class="modal-body">
                            <div class="w-100 d-flex justify-content-center align-items-center" id="modal-`+long+lati+`">
                            <canvas class="chartjs-render-monitor chart-boat" id="canvas-${long}${lati}" width="600" height="600"></canvas>
                            </div>
                        </div>                          
                    </div>      
                </div>     
            </div>`;

            marker.on('click', () => {
                new chartDrawing('null', document.getElementById('canvas-'+long+lati).getContext('2d')).drawBoatEmissions()
            });
            
            markers.push(marker);

            marker._icon.setAttribute('data-heading', heading);
    
        }
          
        this.map.on('zoomend', updateIconStyle);
        this.map.on('viewreset', updateIconStyle);
        this.boat = L.layerGroup(markers);
        this.boat.on("add", updateIconStyle);
    }

    async generateWind() {
        let data = await new MapAPI().getWind();

        this.wind = L.velocityLayer({
            displayValues: true,
            displayOptions: {
                velocityType: 'Global Wind',
                displayPosition: 'bottomleftleft',
                displayEmptyString: 'No wind data',
                position: 'topright',
                speedUnit: 'kt'
            },
            data: data,
        }).addTo(this.map);

        setInterval(() => {
            if(new Date().getMinutes() == "01") location.reload();  
        }, 60000);
    }

    /**
     * @param {string} codeStation 
     * @param {string} nomPolluant 
     * @param {integer} codePolluant 
     * @param {float} lon 
     * @param {float} lat 
     */
    async drawGraph(codeStation, nomPolluant, codePolluant, lon, lat) {   
        let image = document.getElementById('image-'+codeStation);
        let spinner = document.getElementById('spinner-'+codeStation);
        let modalBody = document.getElementById('modal-'+codeStation);
        let ctx = document.getElementById('canvas-'+codeStation).getContext("2d");

        let chemicalNotation;

        switch (nomPolluant) {
            case 'NO2':
                chemicalNotation = `<p class="m-0">NO<sub>2</sub></p>`;
                break;
            
            case 'O3': 
                chemicalNotation = `<p class="m-0">O<sub>3</sub></p>`;
                break;

            case 'SO2':
                chemicalNotation = `<p class="m-0">SO<sub>2</sub></p>`; 
                break;
        }

        if (nomPolluant == "NO2" || nomPolluant == "O3") {    
            let data  = await new MapAPI().getMesuresMaxJour(codePolluant, codeStation, 4);
            let previsionData = await new MapAPI().getPrevisions(lon, lat, nomPolluant); 
            
            for (const validator of data) {
                if(validator === -Infinity) {
                    modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i>Données momentanément indisponibles pour le polluant :'+' '+chemicalNotation+'</div>';
                    return;
                }
            }   
            new chartDrawing(nomPolluant, ctx).drawMesureMaxAndPrevi(data, previsionData);
                
            spinner.style.visibility = "hidden";
            image.style.visibility = "visible";
            
        } else if (nomPolluant == "SO2") {
            let data = await new MapAPI().getMesuresMaxJour(codePolluant, codeStation, 7);
            
            for (const validator of data) {
                if(validator === -Infinity) {
                    modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i>Données momentanément indisponibles pour le polluant :'+' '+chemicalNotation+'</div>';
                    return;
                }
            }  
            new chartDrawing(nomPolluant, ctx).drawMesureMax(data);
    
            spinner.style.visibility = "hidden";
            image.style.visibility = "visible";
            
        } else if (nomPolluant == "PM10"){
            let data = await new MapAPI().getMesures(5, codeStation);
            let previsionData = await new MapAPI().getPrevisions(lon, lat, nomPolluant);
                
            if(data.length == 0) {  
                modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i>Données momentanément indisponibles pour le polluant :'+' '+nomPolluant+'</div>';
                return;
            }
            new chartDrawing(nomPolluant, ctx).drawMesureMoyAndPrevi(data, previsionData);
        
            spinner.style.visibility = "hidden";
            image.style.visibility = "visible";
 
        } else if (nomPolluant == "PM25") {
            let data = await new MapAPI().getMesures(6001, codeStation);
            let previsionData = await new MapAPI().getPrevisions(lon, lat, nomPolluant);

            if(data.length == 0) {  
                modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i>Données momentanément indisponibles pour le polluant :'+' '+nomPolluant+'</div>';
                return;
            }
            new chartDrawing(nomPolluant, ctx).drawMesureMoyAndPrevi(data, previsionData);
        
            spinner.style.visibility = "hidden";
            image.style.visibility = "visible";
        }
    }

    getGraph(e)
    {
        if(e.target.classList.contains('active')) return;
        e.preventDefault();

        let station = document.getElementById(e.target.id);
        let polluant = station.id.substring(0, 2);
        let lon = station.getAttribute('lon');
        let lat = station.getAttribute('lat');
        let codeStation = station.getAttribute('code');
        let modal = document.getElementById('mod-'+codeStation);
        let nav = modal.querySelector('#nav-'+codeStation);
        let container = modal.querySelector('#modal-'+codeStation);

        container.innerHTML = `<div id="spinner-${codeStation}" class="loader spinner-border"></div>`;

        nav.querySelector('#NO-'+codeStation).classList.remove('active');
        nav.querySelector('#O3-'+codeStation).classList.remove('active');
        nav.querySelector('#PM-'+codeStation).classList.remove('active');
        nav.querySelector('#SO-'+codeStation).classList.remove('active');
        nav.querySelector('#MP-'+codeStation).classList.remove('active');
        nav.querySelector('#'+polluant+'-'+codeStation).classList.add('active');

        container.innerHTML += `
        <img class="charts-legend" id="image-${codeStation}" src="images/legend_${polluant}.png">
        <canvas class="chartjs-render-monitor" id="canvas-${codeStation}" width="600" height="600"></canvas>`;
       
        let image = document.getElementById('image-'+codeStation);

        image.style.visibility = "hidden";

        switch(polluant) {
            case 'SO':
                this.drawGraph(codeStation, "SO2", 1);
                break;
            
            case 'PM':
                this.drawGraph(codeStation, "PM10", 5, lon, lat);
                break;

            case 'O3':
                this.drawGraph(codeStation, "O3", 7, lon, lat);
                break;
            
            case 'NO':
                this.drawGraph(codeStation, "NO2", 8, lon, lat);
                break;

            case 'MP':
                this.drawGraph(codeStation, "PM25", 6001, lon, lat);
                break;
        }
    }


    async searchStations(e) {

        let resultsContainer = document.getElementById('container-results-search');

        let baseTemplate = `<div class="w-100 d-flex align-items-center justify-content-center" style="margin-top:25vh;">
          <img src="/images/locationsearch.png" width="256px"></div>
        <div class=""w-100><p style="text-align: center;">Rechercher par stations ou code stations !</p></div>`;

        if(e.keyCode == 8 && e.target.value.length <= 0) {
          resultsContainer.innerHTML = baseTemplate;
          return;
        }

        if ((e.keyCode < 65 || e.keyCode > 90) && (e.keyCode < 97 || e.keyCode > 123) && e.keyCode != 32) {
          return;
        }
    
        document.getElementById('search-leaver').addEventListener('click', () => resultsContainer.innerHTML = baseTemplate);

        let searchResults = new Array();
        
        let stations = JSON.parse(localStorage.getItem('sites'));

        let childrenResults = '<div class="map-search-results w-100 d-flex flex-column align-items-center justify-content-center">';

        for(let i in stations) {
          if(stations[i].properties.nom_station.toLowerCase().match(e.target.value.toLowerCase()) || stations[i].properties.code_station.toLowerCase().match(e.target.value.toLowerCase())) {
            searchResults.push(stations[i]);
          }
        }

        if(searchResults.length <= 0) searchResults.push('null');
        
        for(let data in searchResults) {

          if(searchResults[data] == "null") {

            childrenResults += `<div id="error-search-results" class="w-100" style="border-bottom: 1px solid #dbdbdb; padding: 1rem;"><i class="fas fa-exclamation-circle mr-2"></i>Aucun résultat !</div>`;
            resultsContainer.innerHTML = childrenResults;

          } else {
    
            childrenResults += `<div class="searchResults w-100" style="border-bottom: 1px solid #dbdbdb; padding: 1rem;" id="${searchResults[data].properties.code_station}" station="${searchResults[data].properties.nom_station}" lon="${searchResults[data].geometry.coordinates[0]}" lat="${searchResults[data].geometry.coordinates[1]}">${searchResults[data].properties.nom_station} - ${searchResults[data].properties.code_station}</div>`;                
      
          }
        }

        childrenResults += '</div>';

        resultsContainer.innerHTML = childrenResults;

        document.getElementsByClassName('searchResults').forEach((element) => {
            
            element.addEventListener('click', () => {
            
                if(this.map.getZoom() >= 13) {
                    this.map.flyTo([43.7284, 5.9367], this.iniZoom, {
                        "animate": true,
                        "duration": 2 
                    });

                    setTimeout(() => {
                      this.map.flyTo([element.getAttribute('lat'), element.getAttribute('lon')], 14, {
                            "animate": true,
                            "duration": 2 
                        });
                    }, 2000);
                } else {
                    this.map.flyTo([element.getAttribute('lat'), element.getAttribute('lon')], 14, {
                        "animate": true,
                        "duration": 2 
                    });
                }
                
                document.getElementById('NO-'+element.getAttribute('id')).click();

                for (let i in this.markerObject) {
                    let markerID = this.markerObject[i].options.title;
                    if (markerID == element.getAttribute('station')) {
                        this.markerObject[i].openPopup();
                    };
                }
            });
        });
    }

    addMesureXHR() {

        let form = document.getElementById('form-add-mesures');

        let spinner = document.getElementById('spinner-add-mesures');

        const sendRequest = async (e) => {

            e.preventDefault();

            spinner.classList.remove('not-loaded');

            let data = await new MapAPI().sendMesuresForm();

            spinner.classList.add('not-loaded');
            
            if (data.status == 300) return alert('Veuillez renseigner des coordonnées au format WGS84');

            if (data.status == 450) return alert('Vous avez déjà envoyé vos données');

            if (data.status == 500) {
                let messageError = [];

                for(let message in data.error) {
                    messageError.push(data.error[message][0]);
                }

                let getMessage = "Erreur(s) : ";

                for(let idx of messageError) {
                    getMessage += idx + ", ";
                }
                getMessage = getMessage.substring(0, getMessage.length - 2);
                getMessage += " invalide(s)";

                return alert(getMessage);
            }

            alert('Vos données ont correctement été téléversées sur nos serveurs');

            this.createUserMesures();
        }

        form.addEventListener('submit', sendRequest);
    }

    bindEvents() {
        let self = this;

        let elements = [
            document.getElementsByClassName('O3graph'), 
            document.getElementsByClassName('NO2graph'), 
            document.getElementsByClassName('SO2graph'), 
            document.getElementsByClassName('PM10graph'), 
            document.getElementsByClassName('PM25graph') 
        ];
        
        elements.forEach((element) => {
            for(let index of element) {
                index.addEventListener('click', e => self.getGraph(e));
            }
        });
    }

    customMenu() {  
        let controls = {
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-map-marker-alt fa-fw'></i></div> <p class='control-menu-text-content'>Station</p><div class='check'></div></span>": this.showStations,
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-smog fa-fw'></i></div> <p class='control-menu-text-content'>Pollution</p><div class='check'></div></span>": this.azurPacaMulti,
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-ship'></i></div> <p class='control-menu-text-content'>Bateaux</p><div class='check'></div></span>": this.boat,
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-wind fa-fw'></i></div> <p class='control-menu-text-content'>Vent</p><div class='check'></div></span>": this.wind,
        }

        this.control = L.control.layers(this.baseLayers, controls, {collapsed: false, position: 'topleft'}).addTo(this.map);

        document.getElementsByClassName('leaflet-control-layers-selector')[4].click();
        document.getElementsByClassName('leaflet-control-layers-selector')[4].setAttribute('checked', 'true');
        
        let controlMenu = document.getElementsByClassName('leaflet-control-layers')[0];   
        let controlMenuBtn = document.getElementById('toggle-btn-control-menu');
        let controlMenuBtnLeaver = document.createElement('div');
        let searchMenu = document.getElementById('search-results');
        let layersContainer = document.querySelector('.leaflet-control-layers-overlays');
        let searchMenuBtn = document.getElementById('toggle-search');
        let searchMenuBtnLeaver = document.getElementById('search-leaver');
        let addMenu = document.getElementById('add-mesures');
        let addMenuBtn = document.getElementById('toggle-add');
        let addMenuBtnLeaver = document.getElementById('add-mesures-leaver');
        let wind = document.querySelector('.leaflet-top.leaflet-right');
        let logo = document.createElement('img');
        let btnScenario = document.createElement('div');
        let polluantChoices = document.createElement('div');
        polluantChoices.setAttribute('id', 'polluant__choices');
        polluantChoices.innerHTML = `
        <div class="form-group w-100 mb-0">
            <select id="select-polluant-wms" class="form-control">
                <option value="multi">Multi Polluant</option>
                <option value="no2">NO2</option>
                <option value="pm10">PM10</option>
                <option value="pm2_5">PM25</option>
            </select>
        </div>`;

        layersContainer.insertBefore(polluantChoices, layersContainer.querySelectorAll('label')[2])
        // controlMenu.appendChild(polluantChoices);

        btnScenario.innerHTML = `<button style="color:#fff;background-color:#6BBA62;margin-left:12.5%;margin-top:5rem" id="modalBtn-scenario-pollution" type="button" class="btn w-75" data-toggle="modal" data-target="#mod-scenario-pollution"><i class="fas fa-chart-line mr-2"></i>Scénario Pollution</button>`;
        controlMenu.classList.add('not-loaded');
        wind.setAttribute('id', 'wind-velocity-menu');
        controlMenuBtnLeaver.innerHTML = `<svg><g><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></g></svg>`;
        controlMenuBtnLeaver.setAttribute('id', 'dropdown-leaver');
        logo.setAttribute('id', 'control-menu-logo');
        logo.src = '/images/logo/facebook_cover_photo_1.png';
        logo.style.width = "95%";
         
        controlMenu.insertBefore(logo, document.getElementsByClassName('leaflet-control-layers-list')[0]);
        controlMenu.appendChild(wind);
        controlMenu.appendChild(controlMenuBtnLeaver);
        controlMenu.appendChild(btnScenario);

        controlMenuBtn.onclick = () => {
            if(searchMenu.classList.contains('dropdown-loaded') || addMenu.classList.contains('dropdown-loaded')) {
                searchMenu.classList.add('dropdown-not-loaded');
                addMenu.classList.add('dropdown-not-loaded')
                setTimeout(() => {
                    searchMenu.setAttribute('class', 'not-loaded');
                    addMenu.setAttribute('class', 'not-loaded');
                }, 500);
            }
            controlMenu.classList.remove('not-loaded');
            controlMenu.classList.add('dropdown-loaded');
        };

        controlMenuBtnLeaver.onclick = () => {
            controlMenu.classList.remove('dropdown-loaded');
            controlMenu.classList.add('dropdown-not-loaded');
            controlMenuBtn.removeAttribute('style');

            setTimeout(() => {
                controlMenu.classList.remove('dropdown-not-loaded');
                controlMenu.classList.add('not-loaded');
            }, 500);
        };

        searchMenuBtn.onclick = () => { 
            if(addMenu.classList.contains('dropdown-loaded') ) {
                addMenu.classList.add('dropdown-not-loaded');
                setTimeout(() => {
                    addMenu.setAttribute('class', 'not-loaded');
                }, 500);
            }
            searchMenu.setAttribute('class', 'dropdown-loaded') 
        };

        searchMenuBtnLeaver.onclick = () => {
            searchMenu.setAttribute('class', 'dropdown-not-loaded');

            setTimeout(() => {
                searchMenu.setAttribute('class', 'not-loaded');
                document.getElementById('search-tool-input').value = "";
            }, 500);
        };

        addMenuBtn.onclick = () => { 
            if(searchMenu.classList.contains('dropdown-loaded') ) {
                searchMenu.classList.add('dropdown-not-loaded');
                setTimeout(() => {
                    searchMenu.setAttribute('class', 'not-loaded');
                }, 500);
            }
            addMenu.setAttribute('class', 'dropdown-loaded') 
        };

        addMenuBtnLeaver.onclick = () => {
            addMenu.setAttribute('class', 'dropdown-not-loaded');
            setTimeout(() => {
              addMenu.setAttribute('class', 'not-loaded');
            }, 400);
        };
    }

    static get Register()
    {
        customElements.define('smartport-map', SmartPortMap);
    }
}

SmartPortMap.Register;

