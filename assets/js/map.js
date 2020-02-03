require('../css/map.scss');

// the class SmartPortMap which contain all the features of the mapn and extending HTMLElement to create a custom html tag
class SmartPortMap extends HTMLElement 
{
    constructor()
    {
        // Call super() to use HTMLElement methods and create the custom element
        super();

        // Initial variables 
        this.stations = new Array();

        this.attrib = '&copy;<a href="http://www.airpaca.org/"> ATMOSUD - 2020 </a>| © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | © <a href="https://www.mapbox.com/">Mapbox</a>';
        // Dark map design
        this.DarkGreyCanvas = L.tileLayer("http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", { attribution: this.attrib });
        // mapbox map design. Must create an account et get your token at https://account.mapbox.com/access-tokens/
        this.WorldImagery = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', 
        {
            attribution: this.attrib,
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            accessToken: 'pk.eyJ1IjoiZHVkeTgzIiwiYSI6ImNrNW1pbTA1djA4MHIzZGw1NTBjZHh5dW8ifQ.jJ8WpKmBG9WSoc5hWGALag'
        });
        // add the 2 maps design in an object we will use in the custom_menu() method
        this.baseLayers = 
        {
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-map-marked-alt fa-fw'></i></div> <p class='control-menu-text-content'>Normal</p><div class='radioCheck'></div></span>": this.WorldImagery,
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-map-marked-alt fa-fw'></i></div> <p class='control-menu-text-content'>Noir</p><div class='radioCheck'></div></span></span>": this.DarkGreyCanvas,
        };
        // InitialZoom for large screen
        this.iniZoom = 9;
        // this will just try to get the good Zoom depending on screen width (mobile, tablet, computer)
        this.scaleZoom = () =>
        {
            if(window.screen.width < 1000)
            {
                this.iniZoom -= 2;
            } else if(window.screen.width < 1400) {
                this.iniZoom -= 1;
            }
            return this.iniZoom;
        }
        // Initialize the map
        this.map = L.map('map', {
            layers: [  this.WorldImagery ],
            minZoom: 6,
            maxZoom: 20,
            zoomControl: false
        });
        // set the view over PACA region
        this.map.setView([43.7284, 5.9367], this.scaleZoom());

        this.markerObject = [];

        this.moment = require('moment');
    }
    // this method is a specific function for the lifecycle of the component, and it's call when the custom element is inserted inside the DOM
    // so we call all the function here
    connectedCallback()
    {
        this.create_stations();
        this.generate_wind();
        this.modele_pollution();
        this.smoke_scenario();
    }

    // This method fetch the php route /api/map which is returning a json object containing all the the stations informations
    // You can see the php function at : /src/Controller/SmartPortController.php
    create_stations()
    {
        fetch('/api/map').then((response) =>
        {
            return response.json().then((data)=>{
                
                if(data.results)
                {
                    // Use the controller json response, and push all features in an array
                    JSON.parse(data.results).forEach(station => 
                    {
                        let feature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [station.lon, station.lat],
                            },
                            nom: station.nom,
                            station_id: station.id,
                        } 

                        this.stations.push(feature);
                    });

                    let geoJson = { type: 'FeatureCollection', features: this.stations };
                           
                    // use result array with the leaflet geoJSON function to show all the stations.
                    this.show_stations = L.geoJSON(geoJson, {
            
                        pointToLayer: (feature, latlng) => 
                        {
                            
                            let circle = new L.CircleMarker(latlng, {title: feature.nom});
                            this.markerObject.push(circle);
                            return circle;
                        },
                    
                        onEachFeature: (feature, layer) =>
                        {
                            // add a popup on every feature which contains a button bounded to a modal
                            layer.bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636">' + feature.nom +  '</h5><button id="modalBtn'+feature.station_id+'" code='+feature.station_id+' lon='+feature.geometry.coordinates[0]+' lat='+feature.geometry.coordinates[1]+' type="button" class="btn btn-success w-100 dataNO2" data-toggle="modal" data-target=#mod-'+feature.station_id+'><i class="fas fa-chart-line mr-2"></i>Graphique des polluants</button></div>');
                            
                            // add eventListener onclick of the popup button. It will open the modal and call get_NO2() method to draw the graph in the modal
                            layer.on('click', () =>
                            {
                                document.getElementsByClassName('dataNO2').forEach((element) => 
                                {
                                    element.addEventListener('click', (e) =>
                                    {
                                        this.get_NO2(e);
                                    });
                                });
                            })
                            
                            // Create a modal for each stations
                            document.getElementById('modals-container').innerHTML += `
                            <div style="z-index: 7000;" class="modal fade right" id="mod-`+feature.station_id+`" tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                                
                                <div class="modal-dialog modal-full-height modal-right w-100" role="document" style="position: fixed !important;right: 0;height: 100%;top: 0;margin: 0;">
                                
                                    <div class="modal-content" style="height:100%">
                                        
                                        <div class="modal-header d-flex flex-column justify-content-center align-items-center">
                                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                            <h4 class="modal-title w-100" id="myModalLabel" style="text-align:center;">`+feature.nom+ `</h4>
                                            <h4 id="`+feature.station_id+`">`+feature.station_id+`</h4>
                                        </div>
                                    
                                        <div class="modal-body">
                                            <ul class="nav nav-tabs d-flex justify-content-center align-items-center mb-5" id="nav-`+feature.station_id+`">
                                                <li class="nav-item">
                                                    <a id="NO2-`+feature.station_id+`" class="NO2graph nav-link active" href="#" code="`+feature.station_id+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">NO2</a>
                                                </li>
                                                <li class="nav-item">
                                                    <a id="O3-`+feature.station_id+`" class="O3graph nav-link" href="#" code="`+feature.station_id+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">O3</a>
                                                </li>
                                                <li class="nav-item">
                                                    <a id="PM10-`+feature.station_id+`" class="PM10graph nav-link" href="#" code="`+feature.station_id+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">PM10</a>
                                                </li>
                                                <li class="nav-item">
                                                    <a id="SO2-`+feature.station_id+`" class="SO2graph nav-link" href="#" code="`+feature.station_id+`" lon="`+feature.geometry.coordinates[0]+`" lat="`+feature.geometry.coordinates[1]+`">SO2</a>
                                                </li>
                                            </ul>
                                            <div class="w-100 d-flex justify-content-center align-items-center" id="modal-`+feature.station_id+`">

                                            </div>
                                        </div>
                                        
                                    </div>
                    
                                </div>
                    
                            </div>`;
                        } 
                    }).addTo(this.map);
                }

            }).then(() => 
            {
                // Now all the stations are generated in the map, so we can bind the eventListeners we need to each stations
                this.bind_events();
                this.search_station();
            });

        });
    }

    // This method fetch the azur-mutli wms map in the geoserver 
    modele_pollution()
    {
        let wms_adress = 'https://geoservices.atmosud.org/geoserver/azurjour/wms?';
        let result;

        if(new Date().getHours() >= "11") 
            result = `paca-multi-${this.toTimestamp(this.moment().format('YYYY MM DD'))}-1`;
        else 
            result = `paca-multi-${this.toTimestamp(this.moment().subtract(1, 'days').format('YYYY MM DD'))}-2`;

        this.azurPacaMulti = L.tileLayer.wms(wms_adress, {
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

    // This method will fetch every hours a specific folder which contains all the json wind data for the next 24 hours
    generate_wind()
    {
        // Generate the url with the correct date time
        fetch(`cdn/js/wind_${this.moment().format('DDMMYYYY')}_${this.moment().format('HH')}.json`).then((response) =>
        {
            // Use the leaflet plugin to show the wind data: (leaflet-velocity.js) 
            return response.json().then((data) =>
            {
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

                this.custom_menu();
 
                setInterval(() => {
                    if(new Date().getMinutes() == "00") {
                        this.generate_wind();
                        console.log("wind has been correctly generated");
                    } else {
                        console.log("wind will be generated at "+ (new Date().getHours()+1) + ":00");
                    }
                }, 60000);
            })
        })  
    }

    // this method will call the draw_graph() method when we click for NO2 in the modal.
    get_NO2(e)
    {      
        e.preventDefault();
        // get different data for the draw_graph() method
        let station = document.getElementById(e.target.id);

        let lon = station.getAttribute('lon');

        let lat = station.getAttribute('lat');

        let code_station = station.getAttribute('code');

        let modal = document.getElementById('mod-'+code_station);

        let nav = modal.querySelector('#nav-'+code_station);

        let container = modal.querySelector('#modal-'+code_station);

        container.innerHTML = `
            <div id="spinner-${code_station}" class="loader spinner-border"></div>`;
        // Just change the active pollutant in the modal menu.
        nav.querySelector('#NO2-'+code_station).classList.remove('active');
        nav.querySelector('#O3-'+code_station).classList.remove('active');
        nav.querySelector('#PM10-'+code_station).classList.remove('active');
        nav.querySelector('#SO2-'+code_station).classList.remove('active');
        nav.querySelector('#NO2-'+code_station).classList.add('active');
        // Put a <canvas> tag in the modal-body, then draw_graph() will use it to create the graph.
        container.innerHTML += `
            <img class="charts-legend" id="image-`+code_station+`" src="images/legend_NO2.png">
            <canvas class="chartjs-render-monitor" id="canvas-`+code_station+`" width="600" height="600"></canvas>`;

        let image = document.getElementById('image-'+code_station);

        image.style.visibility = "hidden";

        // Call draw_graph() with the good infos
        this.draw_graph(code_station, "NO2", 8, lon, lat);
    }

    // this method is exactly the same than get_NO2(), but for O3
    get_O3(e) 
    {
        e.preventDefault();

        let station = document.getElementById(e.target.id);

        let lon = station.getAttribute('lon');

        let lat = station.getAttribute('lat');

        let code_station = station.getAttribute('code');

        let modal = document.getElementById('mod-'+code_station);

        let nav = modal.querySelector('#nav-'+code_station);

        let container = modal.querySelector('#modal-'+code_station);

        container.innerHTML = `
            <div id="spinner-${code_station}" class="loader spinner-border"></div>`;

        nav.querySelector('#NO2-'+code_station).classList.remove('active');
        nav.querySelector('#O3-'+code_station).classList.remove('active');
        nav.querySelector('#PM10-'+code_station).classList.remove('active');
        nav.querySelector('#SO2-'+code_station).classList.remove('active');

        nav.querySelector('#O3-'+code_station).classList.add('active');

        container.innerHTML += `
            <img class="charts-legend" id="image-`+code_station+`" src="images/legend_O3.png">
            <canvas class="chartjs-render-monitor" id="canvas-`+code_station+`" width="600" height="600"></canvas>`;
       
        let image = document.getElementById('image-'+code_station);

        image.style.visibility = "hidden";

        this.draw_graph(code_station, "O3", 7, lon, lat);
    }

    get_PM10(e)
    {
        e.preventDefault();

        let station = document.getElementById(e.target.id);

        let lon = station.getAttribute('lon');

        let lat = station.getAttribute('lat');

        let code_station = station.getAttribute('code');

        let modal = document.getElementById('mod-'+code_station);

        let nav = modal.querySelector('#nav-'+code_station);

        let container = modal.querySelector('#modal-'+code_station);

        container.innerHTML = `
            <div id="spinner-${code_station}" class="loader spinner-border"></div>`;

        nav.querySelector('#NO2-'+code_station).classList.remove('active');
        nav.querySelector('#O3-'+code_station).classList.remove('active');
        nav.querySelector('#PM10-'+code_station).classList.remove('active');
        nav.querySelector('#SO2-'+code_station).classList.remove('active');

        nav.querySelector('#PM10-'+code_station).classList.add('active');

        container.innerHTML += `
            <img class="charts-legend" id="image-`+code_station+`" src="images/legend_PM10.png">
            <canvas class="chartjs-render-monitor" id="canvas-`+code_station+`" width="600" height="600"></canvas>`;
       
        let image = document.getElementById('image-'+code_station);

        image.style.visibility = "hidden";

        this.draw_graph(code_station, "PM10", 5, lon, lat);
    }

    get_SO2(e)
    {
        e.preventDefault();

        let station = document.getElementById(e.target.id);

        let code_station = station.getAttribute('code');

        let modal = document.getElementById('mod-'+code_station);

        let nav = modal.querySelector('#nav-'+code_station);

        let container = modal.querySelector('#modal-'+code_station);

        container.innerHTML = `
            <div id="spinner-${code_station}" class="loader spinner-border"></div>`;

        nav.querySelector('#NO2-'+code_station).classList.remove('active');
        nav.querySelector('#O3-'+code_station).classList.remove('active');
        nav.querySelector('#PM10-'+code_station).classList.remove('active');
        nav.querySelector('#SO2-'+code_station).classList.remove('active');

        nav.querySelector('#SO2-'+code_station).classList.add('active');

        container.innerHTML += `
            <img class="charts-legend" id="image-`+code_station+`" src="images/legend_O3.png">
            <canvas class="chartjs-render-monitor" id="canvas-`+code_station+`" width="600" height="600"></canvas>`;
       
        let image = document.getElementById('image-'+code_station);

        image.style.visibility = "hidden";

        this.draw_graph(code_station, "SO2", 1);
    }

    // this method will return an array of the last 5 day measuring at the station you want, with the pollutant you want.
    /**
     * @param {number} id_poll_ue 
     * @param {string} code_station  
     */
    async get_mesures(id_poll_ue, code_station) 
    {
        const date = this.moment().subtract(5, 'days').format('YYYY/MM/DD');

        return new Promise((resolve, reject) =>
        {
            const createRequests = () =>
            {
                const getURL = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27"+date+ "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%20"+id_poll_ue+"%20AND%20code_station%20=%20%27"+code_station+"%27";

                const requestPoll = [];

                const request = axios.get(getURL);

                requestPoll.push(request);

                return requestPoll
            }

            if(id_poll_ue && code_station)
            {
                const requests = createRequests();

                Promise.all(requests).then(responseS =>
                {
                    const data = responseS.map(response => response.data.features.map(feature => feature.properties.valeur));

                    const values = data[0];

                    resolve(values);
                })
            } else {
                reject();
            }
        })        
    }

    // this method uses the geoserver data and returns a Promise. 
    // this Promise returns an array of the max measured NO2 at the deadline you want
    // => It push in the array the max value of the 24 measures. 
    // ==> repeat that according to the parameter 'ech' which means the deadline.
    /**
     * 
     * @param {number} id_poll_ue 
     * @param {string} code_station 
     * @param {number} ech 
     */
    get_mesures_max_jour(id_poll_ue, code_station, ech)
    {
        return new Promise((resolve, reject) =>
        {
            const createRequests = () =>
            {
                const results = [];                

                for(let i = 0; i <= ech; i++)
                {
                    const date = this.moment().subtract(i, 'days').format('YYYY/MM/DD');
                  
                    let url = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_horaire_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_horaire_poll_princ:mes_sudpaca_horaire&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27" + date + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%20"+id_poll_ue+"%20AND%20code_station%20=%20%27"+code_station+"%27%20AND%20date_fin<=%27"+ date +"%20" + "23:59" + "%27";
                    const request = axios.get(url);

                    results.push(request);  
                }
                return results;
            }
    
            if(id_poll_ue && code_station && ech)
            {
                const requests = createRequests();
    
                Promise.all(requests).then(responseS =>
                {
                    const data = responseS.map(response => response.data.features.map(feature => feature.properties.valeur));

                    const maxValue = [];
    
                    for(let idx = 0; idx < data.length; idx++)
                    {
                        maxValue.push(Math.max.apply(null, data[idx]));
                    }
    
                    resolve(maxValue);
                })
            } else {
                reject();
            }
        })
    }

    // this method uses apigeoloc.
    // it returns an array of  p0, p1, p2 forecast.
    /**
     * 
     * @param {number} lon 
     * @param {nuber} lat 
     * @param {string} pol you must use "" between the string
     */
    async get_previsions(lon, lat, pol)
    {
        if(lon && lat)
        {
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

    // this method will uses get_mesures_max_jour() and get_previsions() arrays data to create a graph with Chart.js at the station you want.
    /**
     * 
     * @param {number} code_station 
     * @param {string} nom_polluant 
     * @param {number} code_polluant 
     * @param {number} lon 
     * @param {number} lat 
     */
    draw_graph(code_station, nom_polluant, code_polluant, lon, lat)
    {                   
        let days = new Array();
        let vLimite;
        let maxPoint;
        const newDate = new Date();

        let image = document.getElementById('image-'+code_station);
        let spinner = document.getElementById('spinner-'+code_station);
        let modal_body = document.getElementById('modal-'+code_station);
        let ctx = document.getElementById('canvas-'+code_station).getContext("2d");
        let gradient = ctx.createLinearGradient(300, 250, 300, 600);
        
        gradient.addColorStop(0, 'rgb(255, 0, 0)'); 
        gradient.addColorStop(0.2, 'rgb(255, 170, 0)');
        gradient.addColorStop(0.4, 'rgb(255, 255, 0)');   
        gradient.addColorStop(0.6, 'rgb(153, 230, 0)');
        gradient.addColorStop(0.8, 'rgb(0, 204, 170)');
        gradient.addColorStop(1, 'rgb(0, 204, 170)');


        switch(nom_polluant)
        {
            case 'SO2':
                vLimite = [350, 350, 350, 350, 350, 350, 350, 350];
                maxPoint = 700;
                break;

            case 'O3': 
                vLimite = [180, 180, 180, 180, 180, 180, 180, 180];
                maxPoint = 360;
                break;

            case 'PM10': 
                vLimite = [50, 50, 50, 50, 50, 50, 50, 50];
                maxPoint = 100;
                break;
            
            default: 
                vLimite = [200, 200, 200, 200, 200, 200, 200, 200];
                maxPoint = 400;
        }

        let chartOptions = {
            responsive: true,
            title: {
                fontSize: 20,
                display: true,
                text: 'Evolution des max horaires journaliers en ' + nom_polluant
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMax: maxPoint
                    }
                }]
            },
            legend: {
                position: 'bottom',
                display: true, 
                labels: {fontSize: 10},                
            },
        }

        if(nom_polluant == "NO2" || nom_polluant == "O3")
        {
            this.get_mesures_max_jour(code_polluant, code_station, 4).then((data) =>
            { 
                // If the array results != -Infinity => It means that this station is actually measuring this pollutant. So we can create the graph.
                // Else we show a message which means that this stations is not measuring this pollutant
                if(data[0] != -Infinity || data[1] != -Infinity || data[2] != -Infinity || data[3] != -Infinity || data[4] != -Infinity)
                {    
                    this.get_previsions(lon, lat, nom_polluant).then((PrevisionData) =>
                    {
                        PrevisionData.unshift(data[data.length-1]);
    
                        for(let u = 0; u < 4; u++)
                        {
                            PrevisionData.unshift(null);
                        }
                
                        for(let i = -5; i < 3; i++)
                        {   
                            newDate.setDate(newDate.getDate()+i)

                            days.push(newDate.toLocaleString().substring(0, 10));
                        }
                        
                        new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: days,
                                datasets: [
                                    {
                                        label: nom_polluant + " Mesures",
                                        borderColor: gradient,
                                        fill: false,
                                        data: data,
                                    },
                                    {
                                        label: nom_polluant + " Prévisions",
                                        borderColor: gradient,
                                        borderDash: [10,5],
                                        fill: false,
                                        data:  PrevisionData,
                                    },
                                    {
                                        label: nom_polluant + " Valeur limite",
                                        fill: false,
                                        backgroundColor: "red",
                                        borderColor: "red",
                                        data: vLimite,
                                    },
                                ]
                            },
                            options: chartOptions
                        });
    
                    });
                    spinner.style.visibility = "hidden";
                    image.style.visibility = "visible";
                    
    
                } else {
                    modal_body.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i> Cette station ne mesure pas le polluant :'+' '+nom_polluant+'</div>';
                }
            });
            
        } else if (nom_polluant == "SO2") {

            newDate.setDate((newDate.getDate()-8));

            this.get_mesures_max_jour(code_polluant, code_station, 7).then((data) =>
            {
                if(data[0] != -Infinity || data[1] != -Infinity || data[2] != -Infinity || data[3] != -Infinity || data[4] != -Infinity)
                {
                    for(let i = 0; i < 8; i++)
                    {                              
                        const date = this.moment(newDate).add(i, 'days').format('DD/MM/YYYY'); 
                        days.push(date);
                    }
                    
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: days,
                            datasets: [
                                {
                                    label:  nom_polluant + " Mesures",
                                    borderColor: gradient,
                                    fill: false,
                                    data: data,
                                },
                                {
                                    label: nom_polluant + " Valeur limite",
                                    fill: false,
                                    backgroundColor: "red",
                                    borderColor: "red",
                                    data: vLimite,
                                },
                            ]
                        },
                        options: chartOptions
                    });
        
                    spinner.style.visibility = "hidden";
                    image.style.visibility = "visible";
                    
                } else {
                    modal_body.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i> Cette station ne mesure pas le polluant : '+ nom_polluant +'</div>';
                }
            });
        } else {

            this.get_mesures(5, code_station).then((data) =>
            {
                if(data.length > 0)
                {  
                    newDate.setDate((newDate.getDate()-5));

                    this.get_previsions(lon, lat, nom_polluant).then((PrevisionData) =>
                    {
                        PrevisionData.unshift(data[data.length-1]);
    
                        for(let u = 0; u < 4; u++)
                        {
                            PrevisionData.unshift(null);
                        }
                
                        for(let i = 0; i < 8; i++)
                        {  
                            const date = this.moment(newDate).add(i, 'days').format('DD/MM/YYYY');                         
                            days.push(date);
                        }
                        
                        new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: days,
                                datasets: [
                                    {
                                        label: nom_polluant + " Mesures",
                                        borderColor: gradient,
                                        fill: false,
                                        data: data,
                                    },
                                    {
                                        label: nom_polluant + " Prévisions",
                                        borderColor: gradient,
                                        borderDash: [10,5],
                                        fill: false,
                                        data:  PrevisionData,
                                    },
                                    {
                                        label: nom_polluant + " Valeur limite",
                                        fill: false,
                                        backgroundColor: "red",
                                        borderColor: "red",
                                        data: vLimite,
                                    },
                                ]
                            },
                            options: {
                                responsive: true,
                                title: {
                                    fontSize: 20,
                                    display: true,
                                    text: 'Evolution des moyennes journalières en ' + nom_polluant
                                },
                                scales: chartOptions.scales,
                                legend: chartOptions.legend,
                            }
                        });
    
                    });
                    spinner.style.visibility = "hidden";
                    image.style.visibility = "visible";
                } else {
                    modal_body.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i> Cette station ne mesure pas le polluant :'+' '+nom_polluant+'</div>';
                }
            })
        }
    }

    // this methods fetch /api/search which is a php function.
    // fetching api_search with a body containing the value of the search input.
    // api_search php function will decode this string, try a SQL request with it, and returns results.
    // Here, we use the response results to display informations.
    // Then we add EventListener on click of each result, it will set the map view over the clicked station and open his pop up
    search_station()
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

             if(e.keyCode == 8 && e.target.value == "") {
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
                    return response.json().then((data) => {
                        
                        if(data.result) {

                            let childrenResults = '<div class="map-search-results w-100 d-flex flex-column align-items-center justify-content-center">';

                            JSON.parse(data.results).forEach(elm => {
                               
                                childrenResults += `<div class="searchResults w-100" style="border-bottom: 1px solid #dbdbdb; padding: 1rem;" id="${elm.id}" station="${elm.nom}" lon="${elm.lon}" lat="${elm.lat}">${elm.nom} - ${elm.id}</div>`;

                            });

                            childrenResults += '</div>';

                            resultsContainer.innerHTML = childrenResults;

                            document.getElementsByClassName('searchResults').forEach((element) => {
                                
                                let lon = element.getAttribute('lon');
                                let lat = element.getAttribute('lat');
                                let NO2trigger = document.getElementById('NO2-'+element.getAttribute('id'));
                                
                                element.addEventListener('click', () => {
                                    this.map.setView([lat, lon], 14);
                                    NO2trigger.click();

                                    for (var i in this.markerObject) {
                                        let markerID = this.markerObject[i].options.title;
                                        if (markerID == element.getAttribute('station')) {
                                            this.markerObject[i].openPopup();
                                        };
                                    }
                                });
                            })

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

    smoke_scenario()
    {        
        let boatMarker = L.boatMarker([43.343693, 5.335189], {
            color: "#727272", 
            idleCircle: false	        
        }).bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><button id="modalBtn-scenario-pollution" type="button" class="btn btn-success w-100" data-toggle="modal" data-target="#mod-scenario-pollution"><i class="fas fa-chart-line mr-2"></i>Scénario Pollution</button></div>').addTo(this.map);

        boatMarker.setHeading(300);

        let video = document.getElementById('scenario-video');

        let playPauseBtn = document.getElementById('play-pause-scenario');

        playPauseBtn.onclick = () => {
    
            let i = 0;

            let test = setInterval(() => {
                video.src = `images/scenario/Marseille-port-${i}.png`;
                i++;
                    
                if(i == 12) {
                    video.src = `images/scenario/Marseille-port-0.png`;
                    clearInterval(test); 
                }
            }, 500);
        }
    }

    // Just add EventListeners to the NO2, O3, SO2 buttons onclick. It will call the draw_graph() method
    bind_events()
    {
        let self = this;

        document.getElementsByClassName('O3graph').forEach((element) => 
        {
            element.addEventListener('click', (e) =>
            {
                self.get_O3(e);
            });
        });

        document.getElementsByClassName('NO2graph').forEach((element) => 
        {
            element.addEventListener('click', (e) =>
            {
                self.get_NO2(e);
            });
        });

        document.getElementsByClassName('SO2graph').forEach((element) => 
        {
            element.addEventListener('click', (e) =>
            {
                self.get_SO2(e);
            });
        });

        document.getElementsByClassName('PM10graph').forEach((element) => 
        {
            element.addEventListener('click', (e) =>
            {
                self.get_PM10(e);
            });
        });
    }

    // This method convert a date into an integer. 
    // Used to show the wms map
    /**
     * 
     * @param {date} strDate 
     */
    toTimestamp(strDate) 
    {
        let datum = Date.parse(strDate);
        return datum/1000;
    }

    // this method adds all the layers into a control menu.
    custom_menu()
    {     
        let controls = 
        {
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-map-marker-alt fa-fw'></i></div> <p class='control-menu-text-content'>Station</p><div class='check'></div></span>": this.show_stations,
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-smog fa-fw'></i></div> <p class='control-menu-text-content'>Pollution</p><div class='check'></div></span>": this.azurPacaMulti,
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-wind fa-fw'></i></div> <p class='control-menu-text-content'>Vent</p><div class='check'></div></span>": this.wind
        }

        L.control.layers(this.baseLayers, controls, {collapsed: false, position: 'topleft'}).addTo(this.map);

        let controlPanel = document.getElementsByClassName('leaflet-control-layers')[0];
        let checkboxContainer = document.querySelector('.leaflet-control-layers-overlays');
        let hamburger = document.getElementById('toggle-btn-control-menu');
        let searchBtn = document.getElementById('toggle-search');
        let wind = document.querySelector('.leaflet-top.leaflet-right');
        let logo = document.createElement('img');
        let hr = document.createElement('hr');
        let dropdownLeaver = document.createElement('div');
        let searchContainer = document.getElementById('search-results');
        let searchLeaver = document.getElementById('search-leaver');

        wind.setAttribute('id', 'wind-velocity-menu');
        
        logo.setAttribute('id', 'control-menu-logo');
        logo.src = '/images/logo/facebook_cover_photo_1.png';
        logo.style.setProperty('width', '95%');
        logo.style.setProperty('margin', '10px 0px');
        hr.style.setProperty('margin-top', '70px');
      
        dropdownLeaver.setAttribute('id', 'dropdown-leaver');
        dropdownLeaver.innerHTML = `<svg><g><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></g></svg>`;      
        controlPanel.appendChild(dropdownLeaver);
        checkboxContainer.appendChild(wind);
        controlPanel.insertBefore(logo, document.getElementsByClassName('leaflet-control-layers-list')[0]);
        controlPanel.classList.add('not-loaded');
        controlPanel.appendChild(hr);

        document.getElementById('dropdown-leaver').addEventListener('click', () =>
        {
            controlPanel.setAttribute('class', 'leaflet-control-layers leaflet-control-layers-expanded leaflet-control dropdown-not-loaded');
            
            hamburger.removeAttribute('style');

            setTimeout(() =>{
                controlPanel.setAttribute('class', 'leaflet-control-layers leaflet-control-layers-expanded leaflet-control not-loaded');
            }, 500);
        })

        hamburger.addEventListener('click', () => 
        {
            if(searchContainer.classList.contains('dropdown-loaded'))
            {
                searchContainer.setAttribute('class', 'dropdown-not-loaded');
                setTimeout(() =>{
                    searchContainer.setAttribute('class', 'not-loaded');
                }, 500);
            }
            controlPanel.setAttribute('class', 'leaflet-control-layers leaflet-control-layers-expanded leaflet-control dropdown-loaded');
            
            hamburger.setAttribute('style', 'border-color: grey');

        });

        searchBtn.addEventListener('click', () => 
        {
            searchContainer.setAttribute('class', 'dropdown-loaded');
        });

        searchLeaver.addEventListener('click', () =>
        {
            searchContainer.setAttribute('class', 'dropdown-not-loaded');

            setTimeout(() =>{
                searchContainer.setAttribute('class', 'not-loaded');
                document.getElementById('search-tool-input').value = "";
                document.getElementsByClassName('map-search-results')[0].innerHTML = "";
            }, 500);
        });
    }

    // this method creates the specific html tag inside the DOM
    static Register()
    {
        customElements.define('smartport-map', SmartPortMap);
    }
}

SmartPortMap.Register();

