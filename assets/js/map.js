require('../css/map.scss');
import chartDrawing from './chart.js';
// the class SmartPortMap which contain all the features of the mapn and extending HTMLElement to create a custom html tag
class SmartPortMap extends HTMLElement 
{
    constructor() {
        super();
        this.stations = new Array();
        this.markerObject = new Array();
        this.moment = require('moment');
    }

    connectedCallback()
    {
        this.initiateMap();
        this.createStations();
        this.wmsMap();
        this.generateWind();
    }

    initiateMap()
    {
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

    createStations()
    {
        fetch('/api/map').then((response) => {
            
            return response.json().then((data) => {
                
                if(response.ok) {

                    JSON.parse(data.results).forEach((station) => {
                        let feature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [station.lon, station.lat],
                            },
                            nom: station.nom,
                            stationId: station.id,
                        } 

                        this.stations.push(feature);
                    });

                    let geoJson = { type: 'FeatureCollection', features: this.stations };
                           
                    // use result array with the leaflet geoJSON function to show all the stations.
                    this.showStations = L.geoJSON(geoJson, {
            
                        pointToLayer: (feature, latlng) => 
                        {
                            let circle = new L.CircleMarker(latlng, {title: feature.nom});
                            this.markerObject.push(circle);
                            return circle;
                        },
                    
                        onEachFeature: (feature, layer) =>
                        {
                            // add a popup on every feature which contains a button bounded to a modal
                            layer.bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636">' + feature.nom +  '</h5><button id="modalBtn'+feature.stationId+'" code='+feature.stationId+' lon='+feature.geometry.coordinates[0]+' lat='+feature.geometry.coordinates[1]+' type="button" class="btn btn-success w-100 dataNO2" data-toggle="modal" data-target=#mod-'+feature.stationId+'><i class="fas fa-chart-line mr-2"></i>Graphique des polluants</button></div>');
                            
                            // add eventListener onclick of the popup button. It will open the modal and call getNO2() method to draw the graph in the modal
                            layer.on('click', () => {
                                document.getElementById('NO-'+feature.stationId).click();
                            });
                            
                            // Create a modal for each stations
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
                } else {
                    throw new Error(': Ajax Request failed... response status :' + response.status);
                }

            }).then(() => {
                this.bindEvents();
                this.searchStations();
            });

        });
    }

    wmsMap()
    {
        let wmsAdress = 'https://geoservices.atmosud.org/geoserver/azurjour/wms?';
        let result;

        if(new Date().getHours() >= "11") 
            result = `paca-multi-${this.toTimestamp(this.moment().format('YYYY MM DD'))}-1`;
        else 
            result = `paca-multi-${this.toTimestamp(this.moment().subtract(1, 'days').format('YYYY MM DD'))}-2`;

        this.azurPacaMulti = L.tileLayer.wms(wmsAdress, {
            layers: result,
            format: 'image/png',
            transparent: true,
            opacity: 0.6
        }).addTo(this.map);

        this.azurPacaMulti.on('tileerror', (error, tile) => {
            console.log(error);
            console.log(tile);
        });
    }

    generateWind()
    {
        fetch(`cdn/js/wind_${this.moment().format('DDMMYYYY')}_${this.moment().format('HH')}.json`).then((response) => {
            
            return response.json().then((data) => {
                
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
                    if(new Date().getMinutes() == "00") {
                        this.generateWind();
                        console.log("wind has been correctly generated");
                    } else {
                        console.log("wind will be generated at "+ (new Date().getHours()+1) + ":00");
                    }
                }, 60000);
            })
        });  
    }

    /**
     * @param {number} codeStation 
     * @param {string} nomPolluant 
     * @param {number} codePolluant 
     * @param {number} lon 
     * @param {number} lat 
     */
    drawGraph(codeStation, nomPolluant, codePolluant, lon, lat)
    {   
        let image = document.getElementById('image-'+codeStation);
        let spinner = document.getElementById('spinner-'+codeStation);
        let modalBody = document.getElementById('modal-'+codeStation);
        let ctx = document.getElementById('canvas-'+codeStation).getContext("2d");

        if(nomPolluant == "NO2" || nomPolluant == "O3") {    
            
            this.getMesuresMaxJour(codePolluant, codeStation, 4).then((data) => { 
                
                for (const validator of data) {
                    if(validator === -Infinity) {
                        modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i> Cette station ne mesure pas le polluant :'+' '+nomPolluant+'</div>';
                        return;
                    }
                }   

                this.getPrevisions(lon, lat, nomPolluant).then((PrevisionData) => {
                    new chartDrawing(nomPolluant, ctx).drawMesureMaxAndPrevi(data, PrevisionData);
                });

                spinner.style.visibility = "hidden";
                image.style.visibility = "visible";
            });
            
        } else if (nomPolluant == "SO2") {

            this.getMesuresMaxJour(codePolluant, codeStation, 7).then((data) => {
            
                for (const validator of data) {
                    if(validator === -Infinity) {
                        modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i> Cette station ne mesure pas le polluant :'+' '+nomPolluant+'</div>';
                        return;
                    }
                }  
                    
                new chartDrawing(nomPolluant, ctx).drawMesureMax(data);
        
                spinner.style.visibility = "hidden";
                image.style.visibility = "visible";
                                    
            });

        } else if (nomPolluant == "PM10"){

            this.getMesures(5, codeStation).then((data) => {
                
                if(data.length == 0) {  
                    modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i> Cette station ne mesure pas le polluant :'+' '+nomPolluant+'</div>';
                    return;
                }

                this.getPrevisions(lon, lat, nomPolluant).then((previsionData) => {
                    new chartDrawing(nomPolluant, ctx).drawMesureMoyAndPrevi(data, previsionData);
                });

                spinner.style.visibility = "hidden";
                image.style.visibility = "visible";
 
            });
        } else if (nomPolluant == "PM25") {

            this.getMesures(6001, codeStation).then((data) => {

                if(data.length == 0) {  
                    modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i> Cette station ne mesure pas le polluant:'+' '+nomPolluant+'</div>';
                    return;
                }

                this.getPrevisions(lon, lat, nomPolluant).then((previsionData) => {
                    new chartDrawing(nomPolluant, ctx).drawMesureMoyAndPrevi(data, previsionData);
                });

                spinner.style.visibility = "hidden";
                image.style.visibility = "visible";
 
            });
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

    /**
     * @param {number} polluantId 
     * @param {string} codeStation  
     */
    getMesures(polluantId, codeStation) 
    {
        const date = this.moment().subtract(5, 'days').format('YYYY/MM/DD');

        return new Promise((resolve, reject) => {
            
            const createRequests = () => {
                const getURL = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27"+date+ "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%20"+polluantId+"%20AND%20code_station%20=%20%27"+codeStation+"%27";
                console.log(getURL);
                const requestPoll = [];

                const request = axios.get(getURL);

                requestPoll.push(request);

                return requestPoll;
            }

            if(polluantId && codeStation) {

                const requests = createRequests();

                Promise.all(requests).then(responseS => {
                    const data = responseS.map(response => response.data.features.map(feature => feature.properties.valeur));

                    const values = data[0];

                    resolve(values);
                })
            } else {
                reject();
            }
        })        
    }


    /**
     * @param {number} polluantId
     * @param {string} codeStation 
     * @param {number} ech 
     */
    getMesuresMaxJour(polluantId, codeStation, ech)
    {
        return new Promise((resolve, reject) => {
            
            const createRequests = () => {
                
                const results = [];                

                for(let i = 0; i <= ech; i++) {
                    const date = this.moment().subtract(i, 'days').format('YYYY/MM/DD');
                    let url = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_horaire_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_horaire_poll_princ:mes_sudpaca_horaire&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27" + date + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%20"+polluantId+"%20AND%20code_station%20=%20%27"+codeStation+"%27%20AND%20date_fin<=%27"+ date +"%20" + "23:59" + "%27";
                    const request = axios.get(url);

                    results.push(request);  
                }
                return results;
            }
    
            if(polluantId && codeStation && ech) {

                const requests = createRequests();
    
                Promise.all(requests).then(responseS => {
                    const data = responseS.map(response => response.data.features.map(feature => feature.properties.valeur));

                    const maxValue = [];
    
                    for(let idx = 0; idx < data.length; idx++) {
                        maxValue.push(Math.max.apply(null, data[idx]));
                    }
    
                    resolve(maxValue);
                })
            } else {
                reject();
            }
        })
    }

    /**
     * @param {number} lon 
     * @param {nuber} lat 
     * @param {string} pol
     */
    async getPrevisions(lon, lat, pol)
    {
        if(lon && lat) {
            const getURL = (ech) => `https://apigeoloc.atmosud.org/getpollution?pol=${pol}&lon=${lon}&lat=${lat}&ech=p${ech}`;
            
            const requestsNO2 = new Array(3)
                                .fill(null)
                                .map((_, i) => axios.get(getURL(i)));
            
            return (await Promise.all(requestsNO2))
                    .map(response => response.data.data.valeur);
        } else {
            throw new Error("Previsions fetching needs lon and lat parameters.")
        }
    }


    searchStations()
    {
        let search = document.getElementById('search-tool-input');
        let resultsContainer = document.getElementById('container-results-search');
        let baseTemplate = `
            <div class="w-100 d-flex align-items-center justify-content-center" style="margin-top:25vh;">
                <img src="/images/locationsearch.png" width="256px">
            </div>
            <div class=""w-100>
                <p style="text-align: center;">Rechercher par stations ou code stations !</p>
            </div>`;

        resultsContainer.innerHTML = baseTemplate;
        
        const createRequests = (e) => {

            if(e.keyCode == 8 && e.target.value.length <= 1) {
                resultsContainer.innerHTML = baseTemplate;
                return;
            }
                let value = {};
                value.content = e.target.value;

                fetch('/api/search', {
                    method: 'POST',
                    body: JSON.stringify(value)
                }).then((response) => 
                {
                    if(!response.ok) return;
                    
                    return response.json().then((data) => {

                        if(data.result) {

                            let childrenResults = '<div class="map-search-results w-100 d-flex flex-column align-items-center justify-content-center">';

                            JSON.parse(data.results).forEach(elm => {
                               
                                childrenResults += `<div class="searchResults w-100" style="border-bottom: 1px solid #dbdbdb; padding: 1rem;" id="${elm.id}" station="${elm.nom}" lon="${elm.lon}" lat="${elm.lat}">${elm.nom} - ${elm.id}</div>`;

                            });

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
                                        }, 2500);
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

                        } else {
                            let childrenResults = '<div class="map-search-results w-100 d-flex flex-column align-items-center justify-content-center">';
                           
                            childrenResults += `<div id="error-search-results" class="w-100" style="border-bottom: 1px solid #dbdbdb; padding: 1rem;"><i class="fas fa-exclamation-circle mr-2"></i>Aucun résultat !</div>`;

                            childrenResults += '</div>';

                            resultsContainer.innerHTML = childrenResults;
                        }
                    })
                    
                })
            
        }

        search.addEventListener('keyup', createRequests);
    }

    /**
     * @param {date} strDate 
     */
    toTimestamp(strDate) 
    {
        return (Date.parse(strDate)/1000);
    }

    bindEvents()
    {
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
                index.addEventListener('click', (e) => {
                    self.getGraph(e);
                });
            }
        });
    }

    customMenu()
    {  
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
            if(searchMenu.classList.contains('dropdown-loaded')) {
                searchMenu.classList.add('dropdown-not-loaded');
                setTimeout(() => {
                    searchMenu.setAttribute('class', 'not-loaded');
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

        searchMenuBtn.onclick = () => { searchMenu.setAttribute('class', 'dropdown-loaded') };

        searchMenuBtnLeaver.onclick = () => {
            searchMenu.setAttribute('class', 'dropdown-not-loaded');

            setTimeout(() => {
                searchMenu.setAttribute('class', 'not-loaded');
                document.getElementById('search-tool-input').value = "";
            }, 500);
        };
    }

    static get Register()
    {
        customElements.define('smartport-map', SmartPortMap);
    }
}

SmartPortMap.Register;

