require('../css/map.scss');
import chartDrawing from './chart.js';
import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.css';

class SmartPortMap extends HTMLElement {
    
    constructor() {
        super();
        this.moment = require('moment'); 
        this.moment.defaultFormat = "YYYY-MM-DD HH:mm";
    }

    async connectedCallback() {
        this.initiateMap();
        this.hydrateSliders();
        this.layerController();
        this.rotatedMarker();
        this.popupController();
        this.loadingScreen();
    }

    initiateMap() {
        
        let coordMarseille = [
            [43.36796747943005,5.277392744628937],
            [43.269552680310994,5.451457380859406],
        ];

        // '&bbox=4.718628,43.315936,5.145721,43.506978,urn:ogc:def:crs:EPSG:4326'


        // 4.718628,43.315936,5.145721,43.506978
        let coordFos = [
            [43.44578690866529,4.8413728471679995],
            [43.350993565930644,5.042216658203156],
        ];
        
        let coordToulon = [
            [43.15294771593063,5.8301423784179995],
            [43.07525442169086,6.017939924804718],
        ];

        let coordNice = [
            [43.71525823998838,7.2520993944092105],
            [43.682369623702144,7.328059553710968],
        ];

        let iniZoom = 9;
        let mapLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18,
            attribution: '&copy;<a href="http://www.airpaca.org/"> ATMOSUD - 2020 </a>| Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        });

        this.map = L.map('map', {
            layers: [mapLayer],
            minZoom: 8,
            maxZoom: 20,
            zoomControl: true,
            fullscreenControl: true
        });
       
        if(window.screen.width < 1000) iniZoom -= 2
        if(window.screen.width < 1400) iniZoom -= 1;

        this.portMarseille = L.rectangle(coordMarseille, {color: "#ff7800", weight: 1}).addTo(this.map);
        this.portFos = L.rectangle(coordFos, {color: "#ff7800", weight: 1}).addTo(this.map);
        this.portToulon = L.rectangle(coordToulon, {color: "#ff7800", weight: 1}).addTo(this.map);
        this.portNice = L.rectangle(coordNice, {color: "#ff7800", weight: 1}).addTo(this.map);

        this.map.setView([43.7284, 5.9367], iniZoom);
    }

    /**
     * Cette fonction génère les zones de slider en fonction de la date
     */
    hydrateSliders() {
        let self = this;
        this.dateArray = [];
        this.dateArrayFilter = [];
        let flag = 0;
        const totalHours = 721+parseInt(this.moment().format('HH'));
            
        for(let i = 0; i != totalHours; i++) {
            if(i == 0) 
                this.dateArrayFilter.push(this.moment(new Date().setMinutes('0')).subtract(i, 'hours').format('DD/MM/YYYY'));

            if(flag == 24) {
                this.dateArrayFilter.push(this.moment(new Date().setMinutes('0')).subtract(i, 'hours').format('DD/MM/YYYY'));
                flag = 0;
            }

            this.dateArray.push(this.moment(new Date().setMinutes('0')).subtract(i, 'hours').format('DD/MM/YYYY HH:mm'));
            flag++;
        }

        const filterPips = (value) => {
            let goodValue = value-parseInt(this.moment().format('HH'));
            if(goodValue % 24 == 0) 
                return 2;
            return -1;
        }
        
        this.sliderDate = document.getElementById('slider__date');
        noUiSlider.create(this.sliderDate, {
            range: {
                'min': 0,
                'max': totalHours
            },
            step: 1,
            start: [0],
            orientation: 'horizontal',
            connect: [true, false],
            tooltips: true,
            format: {
                to: function (value) {
                    return self.dateArray[parseInt(value)];
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
                        return self.dateArrayFilter.shift();
                    },
                    from: function (value) {
                        return value;
                    }
                },
            },
        });

        this.sliderDate.noUiSlider.on('change', async () => {
            let date = this.sliderDate.noUiSlider.get().replace('/', '').replace('/', '');
            let day = date.substring('0', '2');
            let month = date.substring('2', '4');
            let year = date.substring('4', '8');
            let hours =  this.sliderDate.noUiSlider.get().substring('11', '13');
            
            if(!document.body.getAttribute('harbor-selected')) 
                return alert('Veuillez séléctionner un port');
            if(document.body.getAttribute('station-selected')) 
                await this.drawChart(document.body.getAttribute('station-selected'), 5, this.moment(`${year}${month}${day} ${hours}`).format(this.moment.defaultFormat));
            self.selectPort(document.body.getAttribute('harbor-selected'), this.moment(`${year}${month}${day} ${hours}`).format(this.moment.defaultFormat));
        });

        document.getElementById('slider__next').addEventListener('click', () => {
            
            if(this.sliderDate.classList.contains('slider-translate-1')) {
                this.sliderDate.classList.remove('slider-translate-1')
                this.sliderDate.classList.add('slider-translate-2')
            } else if(this.sliderDate.classList.contains('slider-translate-2')) {
                this.sliderDate.classList.remove('slider-translate-2')
            } else {
                this.sliderDate.classList.add('slider-translate-1')
            }
            
        })
    }

    /**
     * Cette fonction est appelée lorsque un port est sélectionné
     * @param {string} zone 
     * @param {datetime} date
     */
    async selectPort(zone, date) {

        const removePortLayers = () => {
            for(let port of [this.portFos, this.portMarseille, this.portToulon, this.portNice]) {
                this.map.removeLayer(port);
            }
        }

        removePortLayers()
    
        document.querySelector('.slider__container').classList.remove('hidden');
        document.querySelector('.slider__container').classList.add('visible');

        let coord;
        
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
        this.map.setView(coord, 12);

        

        document.body.setAttribute('harbor-selected', zone)
        document.getElementById('layer__loader').classList.remove('not-loaded');
    
        if(this.wind) 
            await this.refreshWind(this.moment(date).format('YYYYMMDD'), this.moment(date).format('HH'));
         else 
            await this.generateWind(this.moment(date).format('YYYYMMDD'), this.moment(date).format('HH'));

        if(this.boat) 
            this.map.removeLayer(this.boat);

        await this.generateBoats(`${this.moment(date).format('YYYYMMDD')} ${this.moment(date).format('HH')}`);
    
        if(this.showStations) 
            this.map.removeLayer(this.showStations);

        await this.createStations(`${this.moment(date).format('YYYYMMDD')} ${this.moment(date).format('HH')}`, zone);
    
        document.getElementById('layer__loader').classList.add('anim-not-loaded');
        
        setTimeout(() => {
            document.getElementById('layer__loader').classList.remove('anim-not-loaded');
            document.getElementById('layer__loader').classList.add('not-loaded');
        }, 1000);
    }


    /**
     * Cette fonction affiche le vent en exploitant les fichiers .json et le plugin Leaflet 'velocityLayer'
     * @param {datetime} date 
     * @param {string} hours 
     */
    async generateWind(date, hours) {
        console.log('date vent : '+date+' '+hours)

        let response = await fetch(`uploads/wind/vent_json/${date}/wind_field_${hours}.json`, {cache: 'no-store'});
            
        let data = await response.json();

        this.wind = L.velocityLayer({
            displayValues: true,
            displayOptions: {
                velocityType: 'Global Wind',
                position: 'topright',
                angleConvention: "CW",
                speedUnit: 'k/h'
            },
            
            data: data,
        }).addTo(this.map);
    }

    /**
     * Regénère le vent quand la zone de slide change
     * @param {datetime} date 
     * @param {string} hours 
     */
    async refreshWind(date, hours) {

            console.log('date refresh vent : '+date+' '+hours)

            let response = await fetch(`uploads/wind/vent_json/${date}/wind_field_${hours}.json`, {
                cache: "no-store"
            });
                
            let result = await response.json();

            this.wind.setData(result);
    }
    
    /**
     * @param {datetime} date 
     */
    async createStations(date, zone) {

        let bbox;

        switch(zone) {
            case 'Fos':
                bbox = '839488.2726,6247826.6895,873567.6223,6269902.3821';
                break;

            case 'Marseille':
                bbox = '879676.1662,6240293.8372,899631.0297,6257497.7372';
                break;
            
            case 'Toulon':
                bbox = '928830.3224,6219534.7993,950527.1360,6234428.1283';
                break;
            
            case 'Nice':
                bbox = '1039438.7810,6293259.6884,1051016.0534,6301154.9655';
                break;
        }
        
    
        this.stations = [];

        const colorValue = (value, poll) => {
                   
            let percentValue;
            
            if(poll == 5) percentValue = (value/100)*100
            else if(poll == 8) percentValue = (value/100)*400
            else if(poll == 7) percentValue = (value/100)*360
            
            if (percentValue >= 0 && percentValue < 20) return 'très_bon';
            else if (percentValue >= 20 && percentValue < 30) return 'bon1';
            else if (percentValue >= 30 && percentValue < 40) return 'bon2';
            else if (percentValue >= 40 && percentValue < 50) return 'bon3';
            else if (percentValue >= 50 && percentValue < 60) return 'moyen';
            else if (percentValue >= 60 && percentValue < 70) return 'médiocre1';
            else if (percentValue >= 70 && percentValue < 80) return 'médiocre2';
            else if (percentValue >= 80 && percentValue < 90) return 'médiocre3';
            else if (percentValue >= 90 && percentValue < 100) return 'mauvais';
            else if (percentValue >= 100) return 'très_mauvais';
        }

        let dateFormatted = this.moment(date).format('YYYY/MM/DD');
        let hours = this.moment(date).format('HH:mm');

        let url = 'https://geoservices.atmosud.org/geoserver/mes_sudpaca_horaire_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_horaire_poll_princ:mes_sudpaca_horaire&outputFormat=application%2Fjson&CQL_FILTER=date_debut%3E=%27'+this.moment(dateFormatted).subtract(1, 'days').format('YYYY/MM/DD')+' '+hours+'%27%20AND%20date_fin%3C=%27'+dateFormatted+' '+hours+'%27AND%20BBOX(geom,'+bbox+')&srsName=EPSG:4326';

        let response = await fetch(url);

        let data = await response.json();
                
        if(!response.ok) throw new Error(': Ajax Request failed... response status :' + response.status);
      
        for(let i in data.features) {
          if(!this.stations.hasOwnProperty(data.features[i].properties.code_station)) {
            this.stations.push(data.features[i]);
            this.stations[data.features[i].properties.code_station] = "";
          }
        } 

        this.stations.filter(elm => elm != "");

        let geoJson = { type: 'FeatureCollection', features: this.stations };
        
        this.showStations = await L.geoJSON(geoJson, {

            pointToLayer: (feature, latlng) => {

              let customIcon = L.icon({
                iconUrl: 'images/Templatic-map-icons/science.png',
                iconSize:     [22, 33], 
                iconAnchor:   [11, 33],
                popupAnchor:  [0, -33] 
              });

              let circle =  new L.marker(latlng, { 
                  icon: customIcon, 
                  title: feature.properties.nom_station 
              })

              return circle;
            },
        
            onEachFeature: async (feature, layer) => {
                let templateHtml = '';
                let polluantTemplateHtml = '';

                for (let poll of [5, 8, 7]) {
                     let data = await this.getMesuresHoraireJour(poll, feature.properties.code_station, `${this.moment(date).format('YYYY-MM-DD HH:mm')}`);
                     let lastValue = data.pop();
                     if(lastValue !== undefined) {
                        templateHtml += `<td style="text-align: center;" class="${colorValue(lastValue, poll)}">${lastValue}</td>`;

                        if(poll == 5)
                            polluantTemplateHtml += `<th style="text-align: center;" scope="col">PM10</th>`;
                        else if(poll == 7)
                            polluantTemplateHtml += `<th style="text-align: center;" scope="col">O<sub>3</sub></th>`;

                        else if(poll == 8)
                            polluantTemplateHtml += `<th style="text-align: center;" scope="col">NO<sub>2</sub></th>`;
                     }
                }

                if(!templateHtml) return this.showStations.removeLayer(layer);

                let popup = L.popup({ className: 'popup-polluant', closeButton: false, closeOnClick: false, autoPan: false, autoClose: false })
                    .setContent(`
                    <div id="${feature.properties.code_station}"
                    data-target="#modal-chart" data-toggle="modal">
                        <table class="table table-sm">
                            <thead class="thead-dark">
                                <tr>
                                    ${polluantTemplateHtml}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    ${templateHtml}
                                </tr>
                    
                            </tbody>
                        </table>
                    </div>`)

                popup.on('add', () => {
                    document.getElementById(feature.properties.code_station).addEventListener('click', async () => {
                        document.body.setAttribute('station-selected', feature.properties.code_station)
                        await this.drawChart(feature.properties.code_station, 5, date);  
                    });         
                });

                layer.bindPopup(popup).openPopup();

            } 
        }).addTo(this.map);

        
        document.getElementById('NO2__graph').addEventListener('click', async () => {
            await this.drawChart(document.body.getAttribute('station-selected'), 8, date);
        });

        document.getElementById('O3__graph').addEventListener('click', async () => {
            await this.drawChart(document.body.getAttribute('station-selected'), 7, date);
        });

        document.getElementById('PM10__graph').addEventListener('click', async () => {
            await this.drawChart(document.body.getAttribute('station-selected'), 5, date);
        });  
    }

    /**
     * Cette fonction permet d'afficher la valeur de la pollution à l'endroit cliqué.
     * Lorsque le clic est effectué, l'api géoloc renvoie une valeur en fonction des coordonnées de l'endroit ciblé.
     * Ensuite cette valeur est affichée dans une popup 
     * @param {float} lon 
     * @param {float} lat 
     */
    async getDataFromApiGeoloc(lon, lat) {

        const URL = `https://apigeoloc.atmosud.org/getpollution?pol=ISA&lon=${lon}&lat=${lat}&ech=p0`

        let response = await fetch(URL);

        let jsonData = await response.json();

        let value = jsonData.data.valeur;

        let strokeColor;

        let indiceAir;

        if (value >= 0 && value < 20) {
            strokeColor = 'très_bon';
            indiceAir = 'Très Bon';
        } else if (value >= 20 && value < 30) {
            strokeColor = 'bon1';
            indiceAir = 'Bon';
        } else if (value >= 30 && value < 40) {
            strokeColor = 'bon2';
            indiceAir = 'Bon';
        } else if (value >= 40 && value < 50) {
            strokeColor = 'bon3';
            indiceAir = 'Bon';
        } else if (value >= 50 && value < 60) {
            strokeColor = 'moyen';
            indiceAir = 'Moyen';
        } else if (value >= 60 && value < 70) {
            strokeColor = 'médiocre1';
            indiceAir = 'Médiocre';
        } else if (value >= 70 && value < 80) {
            strokeColor = 'médiocre2';
            indiceAir = 'Médiocre';
        } else if (value >= 80 && value < 90) {
            strokeColor = 'médiocre3';
            indiceAir = 'Médiocre';
        } else if (value >= 90 && value < 100) {
            strokeColor = 'mauvais';
            indiceAir = 'Mauvais';
        } else if (value >= 100) {
            strokeColor = 'très_mauvais';
            indiceAir = 'Très Mauvais';
        }

        let templatePopup = `
        <div class="flex-wrapper">
        <div class="single-chart">
            <svg viewBox="0 0 36 36" class="circular-chart ${strokeColor}">
                <path class="circle-bg" d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="circle" stroke-dasharray="${value}, 100" d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" class="percentage">${value}/100</text>
            </svg>
        </div>
        <div id="indice_air_quality">
            <h7>Qualité de l'air</h7><br> 
            <h7>${indiceAir}</h7>
        </div>
        </div>`;

        let marker = new L.CircleMarker([lat, lon], {
            opacity: 0,
            fillColor: 'transparent'
        })
        .bindPopup(templatePopup, {
            className: 'popup-apigeoloc'
        })
        .addTo(this.map);

        marker.openPopup();
    }

    /**
     * 
     * @param {float} lon 
     * @param {float} lat 
     */
    getWindData(lon, lat) {
        
        if(this.popupWind) this.map.removeLayer(this.popupWind);

        this.popupWind = new L.CircleMarker([lat, lon], {
            opacity: 0,
            fillColor: 'transparent',
            className: 'circle-wind-marker'
        })
         
        this.map.addLayer(this.popupWind);

        if(document.querySelector('.popup-wind').classList.contains('hidden')) {
            document.querySelector('.popup-wind').classList.remove('hidden');
            document.querySelector('.popup-wind').classList.add('visible');
        }

        document.querySelector('.wind-value-container').style = `transform: rotate(${this.orientation}deg)`;
        document.querySelector('.value-wind').textContent = `${document.querySelectorAll('.wind-text-content')[3].textContent}`
    }

    /**
     * @param {string} codeStation 
     * @param {integer} polluant
     * @param {datetime} date 
     */
    async drawChart(codeStation, polluant, date) {
        let pollName;
        document.getElementById('modal-canvas').innerHTML = 
        `<canvas id="canvas-${codeStation}" class="chartjs-render-monitor" width="600" height="600"></canvas>`;

        let canvas = document.querySelector('#canvas-'+codeStation).getContext('2d');

        // NO2 : 8 ; PM10 : 5 ; O3 : 7;
        switch (polluant) {
            case 5:
                pollName = 'PM10';
                break;
            
            case 7:
                pollName = 'O3';
                break;

            case 8: 
                pollName = 'NO2';
                break;
        }

        for(let element of document.querySelectorAll('.nav-graph')) {
            if(element.classList.contains('active')) element.classList.remove('active');
        }

        document.getElementById(pollName+'__graph').classList.toggle('active');

        let data = await this.getMesuresHoraireGlissantes(polluant, codeStation, `${this.moment(date).format('YYYY-MM-DD HH:mm')}`);

        document.getElementById('graph__title').textContent = `${this.moment(date).format('YYYY-MM-DD HH:mm')}`;

        new chartDrawing(pollName, canvas).drawMesureHoraire(data, `${this.moment(date).format('HH')}`);
    }


    /**
     * @param {integer} polluantId
     * @param {string} codeStation 
     * @param {datetime} date 
     */
    getMesuresHoraireJour(polluantId, codeStation, date)
    {
        return new Promise((resolve, reject) => {
            
            const createRequests = () => {
                
                const results = []; 
                const dateDebut = this.moment(date).subtract(1, 'days').format('YYYY/MM/DD HH');
                const dateFin = this.moment(date).format('YYYY/MM/DD HH');
                console.log('mesures horaires : date début : '+dateDebut+' '+'date fin : '+dateFin)
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
     * @param {integer} polluantId
     * @param {string} codeStation 
     * @param {datetime} date 
     */
    getMesuresHoraireGlissantes(polluantId, codeStation, date)
    {
        return new Promise((resolve, reject) => {
            
            const createRequests = () => {
                
                const results = []; 
                const dateDebut = this.moment(date).subtract(12, 'hours').format('YYYY/MM/DD HH');
                const dateFin = this.moment(date).add(12, 'hours').format('YYYY/MM/DD HH');
                console.log('mesures horaires Glissantes: date début : '+dateDebut+' '+'date fin : '+dateFin)
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

    async generateBoats(date) {

        if(this.boat) this.map.removeLayer(this.boat);

        this.boatMarkers = [];
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


        json.value = this.moment(date).format('YYYY-MM-DD HH:mm:ss');

        console.log('date bateaux : '+json.value)

        if(this.toTimestamp(json.value) > this.toTimestamp(this.moment().format('YYYY-MM-DD HH:mm:ss'))) {
            return alert('Date invalide pour les données maritimes');
        }

        let response = await fetch('/map/ihs/api', {
            method: 'POST',
            body: JSON.stringify(json)
        });
    
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
                </div>`)
                marker.addTo(this.map);

            this.boatMarkers.push(marker);
        }

        this.boat = L.layerGroup(this.boatMarkers).addTo(this.map);
    }

    /**
     * 
     */
    popupController() {
        this.map.on('click', (e) => {
                    
            if(this.map.getZoom() <= 11) return;

            if(this.wind) this.orientation = parseFloat(document.querySelectorAll('.wind-text-content')[1].textContent);

            if(document.querySelector('.popup-wind').classList.contains('visible')) {
                document.querySelector('.popup-wind').classList.remove('visible');
                document.querySelector('.popup-wind').classList.add('hidden');
            }
            
            let lat = e.latlng.lat;
            let lon = e.latlng.lng;

            let windId = Math.random().toString(36).substr(2);
            let pollId = Math.random().toString(36).substr(2);

            let templatePopup = `
            <div class='d-flex justify-content-center align-items-center' style="padding:.25rem">
                <div id="${windId}" class='d-flex justify-content-center align-items-center btn btn-success w-50 mr-2 p-2'>
                    <i class="fas fa-wind"></i>
                </div>          
                <div id="${pollId}" class='d-flex justify-content-center align-items-center btn btn-success w-50 p-2'>
                    <i class="fas fa-smog"></i> 
                </div>    
            </div>`;

            this.markerMenu = new L.CircleMarker([lat, lon], {
                opacity: 0,
                fillColor: 'transparent'
            })
             .bindPopup(templatePopup, {
                 className: 'popup-menu-controller'
             })
              .addTo(this.map);
                
            this.map.flyTo([lat, lon]);
            this.markerMenu.openPopup();

            document.getElementById(`${pollId}`).addEventListener('click', () => {
                this.getDataFromApiGeoloc(lon, lat);
                document.querySelector('.popup-menu-controller').style.opacity = 0;
            });

            document.getElementById(`${windId}`).addEventListener('click', () => {
                this.getWindData(lon, lat);
                document.querySelector('.popup-menu-controller').style.opacity = 0;
            });
        });

        this.map.on('move', () => {
            if(document.querySelector('.popup-wind').classList.contains('visible')) {
                document.querySelector('.popup-wind').classList.remove('visible');
                document.querySelector('.popup-wind').classList.add('hidden');
            }
        })
    }

    /**
     * Permet d'orienter le L.Marker de Leaflet
     */
    rotatedMarker() {
        // save these original methods before they are overwritten
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
    
            // Ensure marker keeps rotated during dragging
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
                        // for IE 9, use the 2D rotation
                        this._icon.style[L.DomUtil.TRANSFORM] = 'rotate(' + this.options.rotationAngle + 'deg)';
                    } else {
                        // for modern browsers, prefer the 3D accelerated version
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
     * Cette fonction bind les events à chaque port
     */
    layerController() {

        const removePortLayers = () => {
            for(let port of [this.portFos, this.portMarseille, this.portToulon, this.portNice]) {
                this.map.removeLayer(port);
            }
        }

        const addPortLayers = () => {
            for(let port of [this.portFos, this.portMarseille, this.portToulon, this.portNice]) {
                this.map.addLayer(port);
            }
        }

        const removeLayers = () => {
            for(let layer of [this.wind, this.boat, this.showStations]) {
                this.map.removeLayer(layer);
            }
        }

        const addLayers = () => {
            for(let layer of [this.wind, this.boat, this.showStations]) {
                this.map.addLayer(layer);
            }
        }

        this.map.on('zoomend', () => { 
            
            if(!this.wind || !this.boat || !this.showStations) return;
            
            if(this.map.getZoom() < 12) {
                addPortLayers();
                removeLayers();
                document.querySelector('.popup-wind').classList.remove('visible');
                document.querySelector('.popup-wind').classList.add('hidden'); 
                if(document.querySelector('.popup-menu-controller'))
                    document.querySelector('.popup-menu-controller').style.opacity = 0;
                
                if(document.querySelector('.popup-apigeoloc')) 
                    document.querySelector('.popup-apigeoloc').style.opacity = 0;
                
            } else {
                removePortLayers();
                addLayers();
                if(!document.querySelector('.init')) {
                    document.querySelector('.popup-wind').classList.remove('hidden');
                    document.querySelector('.popup-wind').classList.add('visible')
                }
                if(document.querySelector('.popup-menu-controller')) 
                    document.querySelector('.popup-menu-controller').style.opacity = 1;

                if(document.querySelector('.popup-apigeoloc')) 
                    document.querySelector('.popup-apigeoloc').style.opacity = 1;
            }
        });

        for(let port of [
            { layer: this.portFos, name: 'Fos'}, 
            { layer: this.portMarseille, name: 'Marseille'}, 
            { layer: this.portToulon, name: 'Toulon'}, 
            { layer: this.portNice, name: 'Nice'}
           ]) 
        {
            port.layer.on('click', () => {
                let date = this.sliderDate.noUiSlider.get().replace('/', '').replace('/', '');
                let day = date.substring('0', '2');
                let month = date.substring('2', '4');
                let year = date.substring('4', '8');
                let hours =  this.sliderDate.noUiSlider.get().substring('11', '13');
                this.selectPort(port.name, this.moment(`${year}${month}${day} ${hours}`).format(this.moment.defaultFormat));
            })
        }


    }

    /**
     * Fonction de l'écran de chargement
     */
    loadingScreen() {
        document.getElementById('map__loader').classList.add('anim-not-loaded');
        setTimeout(function() {
            document.getElementById('map__loader').classList.remove('anim-not-loaded');
            document.getElementById('map__loader').classList.add('not-loaded');
        }, 1000);
    }

    toTimestamp(strDate) {
        return (Date.parse(strDate)/1000);
    }

      // async createUserMesures() {
        
    //   let data = await new MapAPI().getUserMesures();

    //     if(data == 500) return;

    //     for(let idx of data) {

    //         const [lon, lat, polluant, username, date] = idx;

    //         new L.circleMarker([lat, lon], {
    //             fillColor: "#B45151",
    //             color: "#B45151", 
    //         }).bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636"> Mesures : ' + polluant +  '</h5><button style="color: #fff;background-color:#6BBA62" id="modalBtn'+username+'" type="button" class="btn w-100 dataNO2" data-toggle="modal" data-target=#mod-'+username+'><i class="fas fa-chart-line mr-2"></i>Graphique des polluants</button></div>')
    //           .addTo(this.map);

    //         let getImgPolluant = polluant.substring(0, 2);

    //         if(polluant == 'PM25') getImgPolluant = 'MP';

    //         document.getElementById('modals-container').innerHTML += `
    //         <div style="z-index: 7000;" class="modal fade right" id="mod-`+username+`" tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
    //             <div class="modal-dialog modal-full-height modal-right w-100" role="document" style="position: fixed !important;right: 0;height: 100%;top: 0;margin: 0;">
    //                 <div class="modal-content" style="height:100%"> 
    //                     <div class="modal-header d-flex flex-column justify-content-center align-items-center">
    //                         <button type="button" class="close" data-dismiss="modal" aria-label="Close">
    //                             <span aria-hidden="true">&times;</span>
    //                         </button>
    //                         <h4 class="modal-title w-100"  style="text-align:center;" id="`+username+`">Mesures personnelles de `+username+` en `+polluant+`</h4>
    //                     </div>                 
    //                     <div class="modal-body">
    //                         <div class="w-100 d-flex justify-content-center align-items-center" id="modal-`+username+`">
    //                             <img class="charts-legend" id="image-${username}" src="images/legend_${getImgPolluant}.png">
    //                             <canvas class="chartjs-render-monitor" id="canvas-${username}" width="600" height="600"></canvas>
    //                         </div>
    //                     </div>   
    //                 </div>
    //             </div>
    //         </div>`;

    //         this.bindEvents();
    //     }

    //     for(let idx of data) {
    //       const [lon, lat, polluant, username, date] = idx;
    //       await new chartDrawing(polluant, document.getElementById('canvas-'+username).getContext('2d')).drawUsersMesures(username, date.date);
    //     }
    // 
    // /**
    //  * @param {string} codeStation 
    //  * @param {string} nomPolluant 
    //  * @param {integer} codePolluant 
    //  * @param {float} lon 
    //  * @param {float} lat 
    //  */
    // async drawGraph(codeStation, nomPolluant, codePolluant, lon, lat) {   
    //     let image = document.getElementById('image-'+codeStation);
    //     let spinner = document.getElementById('spinner-'+codeStation);
    //     let modalBody = document.getElementById('modal-'+codeStation);
    //     let ctx = document.getElementById('canvas-'+codeStation).getContext("2d");

    //     let chemicalNotation;

    //     switch (nomPolluant) {
    //         case 'NO2':
    //             chemicalNotation = `<p class="m-0">NO<sub>2</sub></p>`;
    //             break;
            
    //         case 'O3': 
    //             chemicalNotation = `<p class="m-0">O<sub>3</sub></p>`;
    //             break;

    //         case 'SO2':
    //             chemicalNotation = `<p class="m-0">SO<sub>2</sub></p>`; 
    //             break;
            
    //         case 'PM10':
    //             chemicalNotation = `<p class="m-0">PM10</sub></p>`; 
    //             break;
            
    //         case 'PM25':
    //             chemicalNotation = `<p class="m-0">PM25</sub></p>`; 
    //             break;
    //     }
    
    //     let data  = await new MapAPI().getMesuresHoraireJour(codePolluant, codeStation, new Date());

    //     if(data[0].length == 0) {
    //         modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i>Données momentanément indisponibles pour le polluant :'+' '+chemicalNotation+'</div>';
    //         return;
    //     }
        
    //     for (const validator of data) {
    //         if(validator === -Infinity) {
    //             modalBody.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i>Données momentanément indisponibles pour le polluant :'+' '+chemicalNotation+'</div>';
    //             return;
    //         }
    //     } 
        
    //     new chartDrawing(nomPolluant, ctx).drawMesureHoraire(data[0]);
            
    //     spinner.style.visibility = "hidden";
    //     image.style.visibility = "visible";

    //     document.getElementById('select-date-wms-'+codeStation).addEventListener('change', async (event) => {
    //         let newData  = await new MapAPI().getMesuresHoraireJour(codePolluant, codeStation, event.target.value);
    //         new chartDrawing(nomPolluant, ctx).drawMesureHoraire(newData[0]);
    //     })
            
        
    // }

    // getGraph(e)
    // {
    //     if(e.target.classList.contains('active')) return;
    //     e.preventDefault();

    //     let station = document.getElementById(e.target.id);
    //     let polluant = station.id.substring(0, 2);
    //     let lon = station.getAttribute('lon');
    //     let lat = station.getAttribute('lat');
    //     let codeStation = station.getAttribute('code');
    //     let modal = document.getElementById('mod-'+codeStation);
    //     let nav = modal.querySelector('#nav-'+codeStation);
    //     let container = modal.querySelector('#modal-'+codeStation);

    //     container.innerHTML = `<div id="spinner-${codeStation}" class="loader spinner-border"></div>`;

    //     nav.querySelector('#NO-'+codeStation).classList.remove('active');
    //     nav.querySelector('#O3-'+codeStation).classList.remove('active');
    //     nav.querySelector('#PM-'+codeStation).classList.remove('active');
    //     nav.querySelector('#SO-'+codeStation).classList.remove('active');
    //     nav.querySelector('#MP-'+codeStation).classList.remove('active');
    //     nav.querySelector('#'+polluant+'-'+codeStation).classList.add('active');

    //     container.innerHTML += `
    //     <img class="charts-legend" id="image-${codeStation}" src="images/legend_${polluant}.png">
    //     <canvas class="chartjs-render-monitor" id="canvas-${codeStation}" width="600" height="600"></canvas>`;
       
    //     let image = document.getElementById('image-'+codeStation);

    //     image.style.visibility = "hidden";

    //     switch(polluant) {
    //         case 'SO':
    //             this.drawGraph(codeStation, "SO2", 1);
    //             break;
            
    //         case 'PM':
    //             this.drawGraph(codeStation, "PM10", 5, lon, lat);
    //             break;

    //         case 'O3':
    //             this.drawGraph(codeStation, "O3", 7, lon, lat);
    //             break;
            
    //         case 'NO':
    //             this.drawGraph(codeStation, "NO2", 8, lon, lat);
    //             break;

    //         case 'MP':
    //             this.drawGraph(codeStation, "PM25", 6001, lon, lat);
    //             break;
    //     }
    // }


    // async searchStations(e) {

    //     let resultsContainer = document.getElementById('container-results-search');

    //     let baseTemplate = `<div class="w-100 d-flex align-items-center justify-content-center" style="margin-top:25vh;">
    //       <img src="/images/locationsearch.png" width="256px"></div>
    //     <div class=""w-100><p style="text-align: center;">Rechercher par stations ou code stations !</p></div>`;

    //     if(e.keyCode == 8 && e.target.value.length <= 0) {
    //       resultsContainer.innerHTML = baseTemplate;
    //       return;
    //     }

    //     if ((e.keyCode < 65 || e.keyCode > 90) && (e.keyCode < 97 || e.keyCode > 123) && e.keyCode != 32) {
    //       return;
    //     }
    
    //     document.getElementById('search-leaver').addEventListener('click', () => resultsContainer.innerHTML = baseTemplate);

    //     let searchResults = new Array();
        
    //     let stations = JSON.parse(localStorage.getItem('sites'));

    //     let childrenResults = '<div class="map-search-results w-100 d-flex flex-column align-items-center justify-content-center">';

    //     for(let i in stations) {
    //       if(stations[i].properties.nom_station.toLowerCase().match(e.target.value.toLowerCase()) || stations[i].properties.code_station.toLowerCase().match(e.target.value.toLowerCase())) {
    //         searchResults.push(stations[i]);
    //       }
    //     }

    //     if(searchResults.length <= 0) searchResults.push('null');
        
    //     for(let data in searchResults) {

    //       if(searchResults[data] == "null") {

    //         childrenResults += `<div id="error-search-results" class="w-100" style="border-bottom: 1px solid #dbdbdb; padding: 1rem;"><i class="fas fa-exclamation-circle mr-2"></i>Aucun résultat !</div>`;
    //         resultsContainer.innerHTML = childrenResults;

    //       } else {
    
    //         childrenResults += `<div class="searchResults w-100" style="border-bottom: 1px solid #dbdbdb; padding: 1rem;" id="${searchResults[data].properties.code_station}" station="${searchResults[data].properties.nom_station}" lon="${searchResults[data].geometry.coordinates[0]}" lat="${searchResults[data].geometry.coordinates[1]}">${searchResults[data].properties.nom_station} - ${searchResults[data].properties.code_station}</div>`;                
      
    //       }
    //     }

    //     childrenResults += '</div>';

    //     resultsContainer.innerHTML = childrenResults;

    //     document.getElementsByClassName('searchResults').forEach((element) => {
            
    //         element.addEventListener('click', () => {
            
    //             if(this.map.getZoom() >= 13) {
    //                 this.map.flyTo([43.7284, 5.9367], this.iniZoom, {
    //                     "animate": true,
    //                     "duration": 2 
    //                 });

    //                 setTimeout(() => {
    //                   this.map.flyTo([element.getAttribute('lat'), element.getAttribute('lon')], 14, {
    //                         "animate": true,
    //                         "duration": 2 
    //                     });
    //                 }, 2000);
    //             } else {
    //                 this.map.flyTo([element.getAttribute('lat'), element.getAttribute('lon')], 14, {
    //                     "animate": true,
    //                     "duration": 2 
    //                 });
    //             }
                
    //             document.getElementById('NO-'+element.getAttribute('id')).click();

    //             for (let i in this.markerObject) {
    //                 let markerID = this.markerObject[i].options.title;
    //                 if (markerID == element.getAttribute('station')) {
    //                     this.markerObject[i].openPopup();
    //                 };
    //             }
    //         });
    //     });
    // }

    // addMesureXHR() {

    //     let form = document.getElementById('form-add-mesures');

    //     let spinner = document.getElementById('spinner-add-mesures');

    //     const sendRequest = async (e) => {

    //         e.preventDefault();

    //         spinner.classList.remove('not-loaded');

    //         let data = await new MapAPI().sendMesuresForm();

    //         spinner.classList.add('not-loaded');
            
    //         if (data.status == 300) return alert('Veuillez renseigner des coordonnées au format WGS84');

    //         if (data.status == 450) return alert('Vous avez déjà envoyé vos données');

    //         if (data.status == 500) {
    //             let messageError = [];

    //             for(let message in data.error) {
    //                 messageError.push(data.error[message][0]);
    //             }

    //             let getMessage = "Erreur(s) : ";

    //             for(let idx of messageError) {
    //                 getMessage += idx + ", ";
    //             }
    //             getMessage = getMessage.substring(0, getMessage.length - 2);
    //             getMessage += " invalide(s)";

    //             return alert(getMessage);
    //         }

    //         alert('Vos données ont correctement été téléversées sur nos serveurs');

    //         this.createUserMesures();
    //     }

    //     form.addEventListener('submit', sendRequest);
    // }

    // bindEvents() {
    //     let self = this;

    //     let elements = [
    //         document.getElementsByClassName('O3graph'), 
    //         document.getElementsByClassName('NO2graph'), 
    //         document.getElementsByClassName('SO2graph'), 
    //         document.getElementsByClassName('PM10graph'), 
    //         document.getElementsByClassName('PM25graph') 
    //     ];
        
    //     elements.forEach((element) => {
    //         for(let index of element) {
    //             index.addEventListener('click', e => self.getGraph(e));
    //         }
    //     });
    // }

    // customMenu() {  
    //     let controls = {
    //         "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-map-marker-alt fa-fw'></i></div> <p class='control-menu-text-content'>Station</p><div class='check'></div></span>": this.showStations,
    //         "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-smog fa-fw'></i></div> <p class='control-menu-text-content'>Pollution</p><div class='check'></div></span>": this.azurPacaMulti,
    //         "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-ship'></i></div> <p class='control-menu-text-content'>Bateaux</p><div class='check'></div></span>": this.boat,
    //         "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-wind fa-fw'></i></div> <p class='control-menu-text-content'>Vent</p><div class='check'></div></span>": this.wind,
    //     }

    //     this.control = L.control.layers(this.baseLayers, controls, {collapsed: false, position: 'topleft'}).addTo(this.map);

    //     document.getElementsByClassName('leaflet-control-layers-selector')[4].click();
    //     document.getElementsByClassName('leaflet-control-layers-selector')[4].setAttribute('checked', 'true');
        
    //     let controlMenu = document.getElementsByClassName('leaflet-control-layers')[0];   
    //     let controlMenuBtn = document.getElementById('toggle-btn-control-menu');
    //     let controlMenuBtnLeaver = document.createElement('div');
    //     let searchMenu = document.getElementById('search-results');
    //     let layersContainer = document.querySelector('.leaflet-control-layers-overlays');
    //     let searchMenuBtn = document.getElementById('toggle-search');
    //     let searchMenuBtnLeaver = document.getElementById('search-leaver');
    //     let addMenu = document.getElementById('add-mesures');
    //     let addMenuBtn = document.getElementById('toggle-add');
    //     let addMenuBtnLeaver = document.getElementById('add-mesures-leaver');
    //     let wind = document.querySelector('.leaflet-top.leaflet-right');
    //     let logo = document.createElement('img');
    //     let btnScenario = document.createElement('div');
    //     let polluantChoices = document.createElement('div');
    //     polluantChoices.setAttribute('id', 'polluant__choices');
    //     if(this.moment().format('HH') > 10) {
    //         polluantChoices.innerHTML = `
    //         <div class="form-group mb-0" style="width:70%">
    //             <select id="select-polluant-wms" class="form-control">
    //                 <option value="multi">Multi Polluant</option>
    //                 <option value="no2">NO2</option>
    //                 <option value="pm10">PM10</option>
    //                 <option value="pm2_5">PM25</option>
    //             </select>
    //         </div>
    //         <div class="form-group mb-0" style="width:30%">
    //             <select id="select-echeance-wms" class="form-control">
    //                 <option value="0">J-1</option>
    //                 <option value="1" selected>J-0</option>
    //                 <option value="2">J+1</option>
    //                 <option value="3">J+2</option>
    //             </select>
    //         </div>`;
    //     } else {
    //         polluantChoices.innerHTML = `
    //         <div class="form-group mb-0" style="width:70%">
    //             <select id="select-polluant-wms" class="form-control">
    //                 <option value="multi">Multi Polluant</option>
    //                 <option value="no2">NO2</option>
    //                 <option value="pm10">PM10</option>
    //                 <option value="pm2_5">PM25</option>
    //             </select>
    //         </div>
    //         <div class="form-group mb-0" style="width:30%">
    //             <select id="select-echeance-wms" class="form-control">
    //                 <option value="1">J-1</option>
    //                 <option value="2" selected>J-0</option>
    //                 <option value="3">J+1</option>
    //             </select>
    //         </div>`;
    //     }

    //     let windChoices = document.createElement('div');
    //     windChoices.setAttribute('id', 'select-wind');
    //     windChoices.style.width = '90%';
    //     windChoices.style.setProperty('margin-left', '5%');
    //     windChoices.style.setProperty('margin-bottom', '0.5rem')
    //     windChoices.innerHTML  = `
    //     <div class="form-group mb-0" style="width:100%">
    //         <select id="select-wind" class="form-control">
    //             <option value="00">00:00</option>
    //             <option value="01">01:00</option>
    //             <option value="02">02:00</option>
    //             <option value="03">03:00</option>
    //             <option value="04">04:00</option>
    //             <option value="05">05:00</option>
    //             <option value="06">06:00</option>
    //             <option value="07">07:00</option>
    //             <option value="08">08:00</option>
    //             <option value="09">09:00</option>
    //             <option value="10">10:00</option>
    //             <option value="11">11:00</option>
    //             <option value="12">12:00</option>
    //             <option value="13">13:00</option>
    //             <option value="14">14:00</option>
    //             <option value="15">15:00</option>
    //             <option value="16">16:00</option>
    //             <option value="17">17:00</option>
    //             <option value="18">18:00</option>
    //             <option value="19">19:00</option>
    //             <option value="20">20:00</option>
    //             <option value="21">21:00</option>
    //             <option value="22">22:00</option>
    //             <option value="23">23:00</option>
    //         </select>
    //     </div>`;

    //     layersContainer.insertBefore(polluantChoices, layersContainer.querySelectorAll('label')[2])

    //     layersContainer.insertBefore(windChoices, layersContainer.querySelectorAll('label')[4])

    //     btnScenario.innerHTML = `<button style="color:#fff;background-color:#6BBA62;margin-left:12.5%;margin-top:5rem" id="modalBtn-scenario-pollution" type="button" class="btn w-75" data-toggle="modal" data-target="#mod-scenario-pollution"><i class="fas fa-chart-line mr-2"></i>Scénario Pollution</button>`;
    //     controlMenu.classList.add('not-loaded');
    //     wind.setAttribute('id', 'wind-velocity-menu');
    //     controlMenuBtnLeaver.innerHTML = `<svg><g><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></g></svg>`;
    //     controlMenuBtnLeaver.setAttribute('id', 'dropdown-leaver');
    //     logo.setAttribute('id', 'control-menu-logo');
    //     logo.src = '/images/logo/facebook_cover_photo_1.png';
    //     logo.style.width = "95%";
         
    //     controlMenu.insertBefore(logo, document.getElementsByClassName('leaflet-control-layers-list')[0]);
    //     controlMenu.appendChild(wind);
    //     controlMenu.appendChild(controlMenuBtnLeaver);
    //     controlMenu.appendChild(btnScenario);

    //     controlMenuBtn.onclick = () => {
    //         if(searchMenu.classList.contains('dropdown-loaded') || addMenu.classList.contains('dropdown-loaded')) {
    //             searchMenu.classList.add('dropdown-not-loaded');
    //             addMenu.classList.add('dropdown-not-loaded')
    //             setTimeout(() => {
    //                 searchMenu.setAttribute('class', 'not-loaded');
    //                 addMenu.setAttribute('class', 'not-loaded');
    //             }, 500);
    //         }
    //         controlMenu.classList.remove('not-loaded');
    //         controlMenu.classList.add('dropdown-loaded');
    //     };

    //     controlMenuBtnLeaver.onclick = () => {
    //         controlMenu.classList.remove('dropdown-loaded');
    //         controlMenu.classList.add('dropdown-not-loaded');
    //         controlMenuBtn.removeAttribute('style');

    //         setTimeout(() => {
    //             controlMenu.classList.remove('dropdown-not-loaded');
    //             controlMenu.classList.add('not-loaded');
    //         }, 500);
    //     };

    //     searchMenuBtn.onclick = () => { 
    //         if(addMenu.classList.contains('dropdown-loaded') ) {
    //             addMenu.classList.add('dropdown-not-loaded');
    //             setTimeout(() => {
    //                 addMenu.setAttribute('class', 'not-loaded');
    //             }, 500);
    //         }
    //         searchMenu.setAttribute('class', 'dropdown-loaded') 
    //     };

    //     searchMenuBtnLeaver.onclick = () => {
    //         searchMenu.setAttribute('class', 'dropdown-not-loaded');

    //         setTimeout(() => {
    //             searchMenu.setAttribute('class', 'not-loaded');
    //             document.getElementById('search-tool-input').value = "";
    //         }, 500);
    //     };

    //     addMenuBtn.onclick = () => { 
    //         if(searchMenu.classList.contains('dropdown-loaded') ) {
    //             searchMenu.classList.add('dropdown-not-loaded');
    //             setTimeout(() => {
    //                 searchMenu.setAttribute('class', 'not-loaded');
    //             }, 500);
    //         }
    //         addMenu.setAttribute('class', 'dropdown-loaded') 
    //     };

    //     addMenuBtnLeaver.onclick = () => {
    //         addMenu.setAttribute('class', 'dropdown-not-loaded');
    //         setTimeout(() => {
    //           addMenu.setAttribute('class', 'not-loaded');
    //         }, 400);
    //     };
    // }

    static get Register()
    {
        customElements.define('smartport-map', SmartPortMap);
    }
}

SmartPortMap.Register;

