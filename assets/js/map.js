require('../css/map.scss');
import chartDrawing from './chart.js';
import { MapAPI } from './mapAPI.js';
// the class SmartPortMap which contain all the features of the map and extending HTMLElement to create a custom html tag
class SmartPortMap extends HTMLElement {
    
    constructor() {
        super();
        this.stations = new Array();
        this.markerObject = new Array();
        this.moment = require('moment');
    }

    connectedCallback() {
        this.initiateMap();
        this.createStations();
        this.wmsMap();
        this.generateWind();
        this.addMesureXHR();
        this.createUserMesures();
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
            minZoom: 6,
            maxZoom: 20,
            zoomControl: false
        });
       
        if(window.screen.width < 1000) this.iniZoom -= 2;
        
        if(window.screen.width < 1400) this.iniZoom -= 1;

        this.map.setView([43.7284, 5.9367], this.iniZoom);

        this.boatMarker = L.boatMarker([43.343693, 5.335189], {
            color: "#727272", 
            idleCircle: false	        
        }).bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><button id="modalBtn-scenario-pollution" type="button" class="btn btn-success w-100" data-toggle="modal" data-target="#mod-scenario-pollution"><i class="fas fa-chart-line mr-2"></i>Scénario Pollution</button></div>').addTo(this.map);

        this.boatMarker.setHeading(300);
    }

    async createStations() { 
        let geoJson = await new MapAPI().getStations(this.stations);
        
        this.showStations = await L.geoJSON(geoJson, {

            pointToLayer: (feature, latlng) => {
                let circle = new L.CircleMarker(latlng, {title: feature.nom});
                this.markerObject.push(circle);
                return circle;
            },
        
            onEachFeature: (feature, layer) => {
                
                layer.bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636">' + feature.nom +  '</h5><button style="color: #fff;background-color:#6BBA62" id="modalBtn'+feature.stationId+'" code='+feature.stationId+' lon='+feature.geometry.coordinates[0]+' lat='+feature.geometry.coordinates[1]+' type="button" class="btn w-100 dataNO2" data-toggle="modal" data-target=#mod-'+feature.stationId+'><i class="fas fa-chart-line mr-2"></i>Graphique des polluants</button></div>');
                
                layer.on('click', () => {
                    document.getElementById('NO-'+feature.stationId).click();
                });
                
                document.getElementById('modals-container').innerHTML += `
                <div style="z-index: 7000;" class="modal fade right" id="mod-`+feature.stationId+`" tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                    <div class="modal-dialog modal-full-height modal-right w-100" role="document" style="position: fixed !important;right: 0;height: 100%;top: 0;margin: 0;">
                        <div class="modal-content" style="height:100%">        
                            <div class="modal-header d-flex flex-column justify-content-center align-items-center">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 class="modal-title w-100" id="myModalLabel" style="text-align:center;">`+feature.nom+ `</h4>
                                <h4 id="`+feature.stationId+`">`+feature.stationId+`</h4>
                            </div>
                            <div class="modal-body">
                                <ul class="nav nav-tabs d-flex justify-content-center align-items-center mb-5" id="nav-`+feature.stationId+`">
                                    <li class="nav-item">
                                        <a id="NO-`+feature.stationId+`" class="NO2graph nav-link active" href="#" code="`+feature.stationId+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">NO2</a>
                                    </li>
                                    <li class="nav-item">
                                        <a id="O3-`+feature.stationId+`" class="O3graph nav-link" href="#" code="`+feature.stationId+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">O3</a>
                                    </li>
                                    <li class="nav-item">
                                        <a id="PM-`+feature.stationId+`" class="PM10graph nav-link" href="#" code="`+feature.stationId+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">PM10</a>
                                    </li>
                                    <li class="nav-item">
                                        <a id="SO-`+feature.stationId+`" class="SO2graph nav-link" href="#" code="`+feature.stationId+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">SO2</a>
                                    </li>
                                    <li class="nav-item">
                                        <a id="MP-`+feature.stationId+`" class="PM25graph nav-link" href="#" code="`+feature.stationId+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">PM2.5</a>
                                    </li>
                                </ul>
                                <div class="w-100 d-flex justify-content-center align-items-center" id="modal-`+feature.stationId+`">
                                </div>
                            </div>                          
                        </div>      
                    </div>     
                </div>`;
            } 
        }).addTo(this.map);

        this.bindEvents();
        this.searchStations();
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

    async wmsMap() {
        let data = await new MapAPI().getWmsMap();
        let flag = 0;

        this.azurPacaMulti = L.tileLayer.wms(data.url, {
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

        this.customMenu();

        setInterval(() => {
            if(new Date().getMinutes() == "00") location.reload();  
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

        if (nomPolluant == "NO2" || nomPolluant == "O3") {    
            let data  = await new MapAPI().getMesuresMaxJour(codePolluant, codeStation, 4);
            let previsionData = await new MapAPI().getPrevisions(lon, lat, nomPolluant); 
            
            for (const validator of data) {
                if(validator === -Infinity) {
                    modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i>Données momentanément indisponibles pour le polluant :'+' '+nomPolluant+'</div>';
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
                    modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i>Données momentanément indisponibles pour le polluant :'+' '+nomPolluant+'</div>';
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


    async searchStations() {
        let search = document.getElementById('search-tool-input');

        search.addEventListener('keyup', await new MapAPI().searchStationsXHR(this.markerObject, this.map, this.iniZoom));
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
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-wind fa-fw'></i></div> <p class='control-menu-text-content'>Vent</p><div class='check'></div></span>": this.wind
        }

        L.control.layers(this.baseLayers, controls, {collapsed: false, position: 'topleft'}).addTo(this.map);
        
        let controlMenu = document.getElementsByClassName('leaflet-control-layers')[0];   
        let controlMenuBtn = document.getElementById('toggle-btn-control-menu');
        let controlMenuBtnLeaver = document.createElement('div');
        let searchMenu = document.getElementById('search-results');
        let searchMenuBtn = document.getElementById('toggle-search');
        let searchMenuBtnLeaver = document.getElementById('search-leaver');
        let addMenu = document.getElementById('add-mesures');
        let addMenuBtn = document.getElementById('toggle-add');
        let addMenuBtnLeaver = document.getElementById('add-mesures-leaver');
        let checkboxContainer = document.querySelector('.leaflet-control-layers-overlays');
        let wind = document.querySelector('.leaflet-top.leaflet-right');
        let logo = document.createElement('img');

        controlMenu.classList.add('not-loaded');
        wind.setAttribute('id', 'wind-velocity-menu');
        controlMenuBtnLeaver.innerHTML = `<svg><g><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></g></svg>`;
        controlMenuBtnLeaver.setAttribute('id', 'dropdown-leaver');
        logo.setAttribute('id', 'control-menu-logo');
        logo.src = '/images/logo/facebook_cover_photo_1.png';
        logo.style.width = "95%";
         
        controlMenu.insertBefore(logo, document.getElementsByClassName('leaflet-control-layers-list')[0]);
        checkboxContainer.appendChild(wind);
        controlMenu.appendChild(controlMenuBtnLeaver);

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
            }, 500);
        };
    }

    static get Register()
    {
        customElements.define('smartport-map', SmartPortMap);
    }
}

SmartPortMap.Register;

