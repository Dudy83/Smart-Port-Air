require('../css/map.scss');

// the class SmartPortMap which contain all the features of the mapn and extending HTMLElement to create a custom html tag
class SmartPortMap extends HTMLElement 
{
    constructor()
    {
        // Call super() to use HTMLElement methods and create the custom element
        super();

        // Initial variables 
        this.monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        this.hoursNames = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"];
        this.dayNames = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
        this.stations = new Array();

        this.attrib = '&copy;<a href="http://www.airpaca.org/"> ATMOSUD - 2020 </a>| © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | © <a href="https://www.mapbox.com/">Mapbox</a>';
        // Dark map design
        this.DarkGreyCanvas = L.tileLayer("http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        {
            attribution: this.attrib
        });

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
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-map-marked-alt fa-fw'></i></div> <p class='control-menu-text-content'>Normal</p></span>": this.WorldImagery,
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-map-marked-alt fa-fw'></i></div> <p class='control-menu-text-content'>Noir</p></span>": this.DarkGreyCanvas,
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
    }

    // this method is a specific function for the lifecycle of the component, and it's call when the custom element is inserted inside the DOM
    // so we call all the function here
    connectedCallback()
    {
        this.create_stations();
        this.generate_wind();
        this.modele_pollution();
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
                            return new L.CircleMarker(latlng);
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
            });

        });
    }

    // This method fetch the azur-mutli wms map in the geoserver 
    modele_pollution()
    {
        let wms_adress = 'https://geoservices.atmosud.org/geoserver/azurjour/wms?';

        let today = new Date().getDate();
        let yesterday = (new Date().getDate()-1);
        let month = new Date().getMonth();
        let year = new Date().getFullYear();
        let result;
        
        // Must check if the new map is available in the geoserver. Else we show the yesterday map
        if(new Date().getHours() >= "11")
        {
            let strDateToday = `${year} ${this.monthNames[month]} ${today}`;

            let todayToTimestamp = this.toTimestamp(strDateToday);
            console.log(`generated the WMS Map of date : ${today}/${this.monthNames[month]}/${year}`)
            result = `paca-multi-${todayToTimestamp}-1`;

        } else {

            let strDateYesterday = `${year} ${this.monthNames[month]} ${yesterday}`;
            console.log(`generated the WMS Map of date : ${yesterday}/${this.monthNames[month]}/${year}. Must wait 11:00 to load the new model`)
            let yesterdayToTimestamp = this.toTimestamp(strDateYesterday);

            result = `paca-multi-${yesterdayToTimestamp}-1`;  
        }

        // Use the leaflet function to load the wms map
        this.azur_paca_multi = L.tileLayer.wms(wms_adress, 
        {
            layers: result,
            format: 'image/png',
            transparent: true,
            opacity: 0.6
        }).addTo(this.map);
    }

    // This method will fetch every hours a specific folder which contains all the json wind data for the next 24 hours
    generate_wind()
    {
        let day = new Date().getDate();
        let monthIndex = new Date().getMonth();
        let year = new Date().getFullYear();
        let hours = new Date().getHours();

        // Generate the url with the correct date time
        fetch('cdn/js/wind' + '_' + this.dayNames[day] + this.monthNames[monthIndex] + year + '_' + this.hoursNames[hours] + '.json').then((response) =>
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

                // All the layers are shown, so we can add all of them to the control menu thanks to custom_menu() method. 
                this.custom_menu();

                // The function checks every minutes if it's time to load the new wind model. 
                setInterval(() => 
                {
                    if(new Date().getMinutes() == "00")
                    {
                        this.generate_wind();
                        console.log("wind has been correctly generated");
                    }
        
                    else
                    {
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
            <img id="image-`+code_station+`" src="images/legend_NO2.png">
            <canvas class="chartjs-render-monitor" id="canvas-`+code_station+`" width="400" height="400"></canvas>`;

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
            <img id="image-`+code_station+`" src="images/legend_O3.png">
            <canvas class="chartjs-render-monitor" id="canvas-`+code_station+`" width="400" height="400"></canvas>`;
       
        let image = document.getElementById('image-'+code_station);

        image.style.visibility = "hidden";

        this.draw_graph(code_station, "O3", 7, lon, lat);
    }

    get_PM10(code_station)
    {

    }

    get_SO2(e)
    {
        let day = (new Date().getDate()-7);
        let monthIndex = new Date().getMonth();
        let year = new Date().getFullYear();

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

        nav.querySelector('#SO2-'+code_station).classList.add('active');

        container.innerHTML += `
            <img id="image-`+code_station+`" src="images/legend_O3.png">
            <canvas class="chartjs-render-monitor" id="canvas-`+code_station+`" width="400" height="400"></canvas>`;
       
        let image = document.getElementById('image-'+code_station);

        image.style.visibility = "hidden";

        this.get_mesures_max_jour(year, this.monthNames[monthIndex], day, 1, code_station, 6).then((data) =>
        {
            if(data[0] != -Infinity || data[1] != -Infinity || data[2] != -Infinity || data[3] != -Infinity || data[4] != -Infinity || data[5] != -Infinity || data[6] != -Infinity)
            {
                let days = new Array();
            
                for(let i = 0; i < 7; i++)
                {                              
                    days.push((day+i) + '/' + this.monthNames[monthIndex] + '/' + year);
                }

                let ctx = document.getElementById('canvas-'+code_station).getContext("2d");

                var gradient = ctx.createLinearGradient(0, 100, 0, 600);
                
                gradient.addColorStop(0, 'rgb(255, 0, 0)'); 
                gradient.addColorStop(0.2, 'rgb(255, 170, 0)');
                gradient.addColorStop(0.4, 'rgb(255, 255, 0)');   
                gradient.addColorStop(0.6, 'rgb(153, 230, 0)');
                gradient.addColorStop(0.8, 'rgb(0, 204, 170)');
                gradient.addColorStop(1, 'rgb(0, 204, 170)');
                
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: days,
                        datasets: [
                            {
                                label:  "SO2 Mesures",
                                borderColor: gradient,
                                fill: false,
                                data: data,
                            },
                            {
                                label: "SO2 Valeur limite",
                                fill: false,
                                backgroundColor: "red",
                                borderColor: "red",
                                data: [350, 350, 350, 350, 350, 350, 350, 350],
                            },
                        ]
                    },
                    options: {
                        responsive: true,
                        title: {
                            fontSize: 20,
                            display: true,
                            text: 'Evolution des max horaires journaliers en SO2'
                        },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true,
                                    suggestedMax: 250
                                }
                            }]
                        },
                        legend: {
                            position: 'bottom',
                            display: true, 
                            labels: {fontSize: 10},                
                        },
                    }
                });

                let image = document.getElementById('image-'+code_station);
                let spinner = document.getElementById('spinner-'+code_station);
                spinner.style.visibility = "hidden";
                image.style.visibility = "visible";
                
            } else {
                let modal_body = document.getElementById('modal-'+code_station);
                modal_body.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i> Cette station ne mesure pas le polluant : SO2</div>';
            }
        })
    }

    // this method will return an array of the last 5 day measuring at the station you want, with the pollutant you want.
    async get_mesures(id_poll_ue, code_station) 
    {
        let day = (new Date().getDate()-6);
        let monthIndex = new Date().getMonth();
        let year = new Date().getFullYear();

        return new Promise((resolve, reject) =>
        {
            const createRequests = () =>
            {
                const getURL = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27"+  year + '/' +  this.monthNames[monthIndex] + '/' + this.dayNames[day] + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%20"+id_poll_ue+"%20AND%20code_station%20=%20%27"+code_station+"%27";
                
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
    // this Promise returns an array of the max measured NO2 at the date you want between 00:00 - 23:59 
    // => It push in the array the max value of the 24 measures. 
    // ==> repeat that according to the parameter 'ech' which means the deadline.
    get_mesures_max_jour(year, month, day, id_poll_ue, code_station, ech)
    {
        return new Promise((resolve, reject) =>
        {
            const createRequests = () =>
            {
                const results = [];
        
                for(let i = 0; i <= ech; i++)
                {
                    let nextDate;

                    if(i == 0)
                    {
                        nextDate = this.dayNames[day];
                    } else {
                        nextDate = this.dayNames[day+i];
                    }
                  
                    let url = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_horaire_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_horaire_poll_princ:mes_sudpaca_horaire&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27"+ year + "/" + month + "/" + nextDate + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%20"+id_poll_ue+"%20AND%20code_station%20=%20%27"+code_station+"%27%20AND%20date_fin<=%27"+ year + "/" + month + "/" + nextDate +"%20" + "23:59" + "%27";
                    const request = axios.get(url);
                    results.push(request);  
                }
                return results;
            }
    
            if(year && month && day && id_poll_ue && code_station && ech)
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
    // it returns an array of the forecast p0, p1, p2 data.
    // @Params : longitude, latitude, pollutant name.
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
    draw_graph(code_station, nom_polluant, code_polluant, lon, lat)
    {
        let day = (new Date().getDate()-5);
        let monthName = new Date().getMonth();
        let year = new Date().getFullYear();

        this.get_mesures_max_jour(year, this.monthNames[monthName], day, code_polluant, code_station, 4).then((data) =>
        { 
            // If the array results != -Infinity => It means that this station is actually measuring this pollutant. So we can create the graph.
            // Else we show a message which means that this stations is not measuring this pollutant
            if(data[0] != -Infinity || data[1] != -Infinity || data[2] != -Infinity || data[3] != -Infinity || data[4] != -Infinity)
            {    
                this.get_previsions(lon, lat, nom_polluant).then((PrevisionData) =>
                {
                    let vLimite;

                    if(nom_polluant == "NO2")
                    {
                        vLimite = [200, 200, 200, 200, 200, 200, 200, 200];

                    } else if(nom_polluant == "O3") {

                        vLimite = [180, 180, 180, 180, 180, 180, 180, 180];

                    } else {
                        vLimite = [50, 50, 50, 50, 50, 50, 50, 50];
                    }

                    PrevisionData.unshift(data[data.length-1]);

                    for(let u = 0; u < 4; u++)
                    {
                        PrevisionData.unshift(null);
                    }

                    let days = new Array();
            
                    for(let i = -5; i < 3; i++)
                    {  
                        day = new Date().getDate();                            
                        days.push((day+i) + '/' + this.monthNames[monthName] + '/' + year);
                    }

                    let ctx = document.getElementById('canvas-'+code_station).getContext("2d");

                    var gradient = ctx.createLinearGradient(0, 100, 0, 600);
                    
                    gradient.addColorStop(0, 'rgb(255, 0, 0)'); 
                    gradient.addColorStop(0.2, 'rgb(255, 170, 0)');
                    gradient.addColorStop(0.4, 'rgb(255, 255, 0)');   
                    gradient.addColorStop(0.6, 'rgb(153, 230, 0)');
                    gradient.addColorStop(0.8, 'rgb(0, 204, 170)');
                    gradient.addColorStop(1, 'rgb(0, 204, 170)');
                    
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
                                text: 'Evolution des max horaires journaliers en ' + nom_polluant
                            },
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: true,
                                        suggestedMax: 250
                                    }
                                }]
                            },
                            legend: {
                                position: 'bottom',
                                display: true, 
                                labels: {fontSize: 10},                
                            },
                        }
                    });

                });

                let image = document.getElementById('image-'+code_station);
                let spinner = document.getElementById('spinner-'+code_station);
                spinner.style.visibility = "hidden";
                image.style.visibility = "visible";
                

            } else {
                let modal_body = document.getElementById('modal-'+code_station);
                modal_body.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i> Cette station ne mesure pas le polluant :'+' '+nom_polluant+'</div>';

            }
        });
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
    }

    // This method convert a date into an integer. 
    // Used to show the wms map
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
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-wind fa-fw'></i></div> <p class='control-menu-text-content'>Vent</p></span>": this.wind,
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-map-marker-alt fa-fw'></i></div> <p class='control-menu-text-content'>Station</p></span>": this.show_stations,
            "<span class='base-layers-choices'><div class='icons-container'><i class='fas fa-smog fa-fw'></i></div> <p class='control-menu-text-content'>Pollution</p></span>": this.azur_paca_multi,
        }

        L.control.layers(this.baseLayers, controls, {collapsed: false, position: 'topleft'}).addTo(this.map);

        let controlPanel = document.getElementsByClassName('leaflet-control-layers')[0];

        let firstChild = document.getElementsByClassName('leaflet-control-layers-list')[0];

        let $hamburger = document.getElementById('toggle-btn-control-menu');

        let menu = document.getElementById('toggle-control-map');

        let svg = document.getElementsByClassName('line');

        let wind = document.querySelector('.leaflet-top.leaflet-right');
       
        let logo = document.createElement('img');
        logo.setAttribute('id', 'control-menu-logo');
        logo.src = '/images/logo/logo.png';
        logo.style.setProperty('width', '100%');

        let homeLink = document.createElement('a');
        homeLink.setAttribute('href', '/');
        homeLink.setAttribute('class', 'btn btn-success');
        homeLink.setAttribute('id', 'map-home-link');
        homeLink.innerHTML = `<i class="fas fa-home mr-2"></i><p class="control-menu-text-content">Retour à l'accueil</p>`

        controlPanel.appendChild(homeLink);
        controlPanel.appendChild(wind);
        controlPanel.insertBefore(logo, firstChild);
        controlPanel.classList.add('not-loaded');

        $hamburger.addEventListener('click', () => 
        {
            if(controlPanel.classList.contains('dropdown-loaded'))
            {
                controlPanel.setAttribute('class', 'leaflet-control-layers leaflet-control-layers-expanded leaflet-control dropdown-not-loaded');
                menu.classList.remove('menu-anim');
                $hamburger.removeAttribute('style');
                svg.forEach(line =>
                {
                    line.removeAttribute('style');
                });
                setTimeout(() =>{
                    controlPanel.setAttribute('class', 'leaflet-control-layers leaflet-control-layers-expanded leaflet-control not-loaded');
                }, 500)
            } else {
                controlPanel.setAttribute('class', 'leaflet-control-layers leaflet-control-layers-expanded leaflet-control dropdown-loaded');
                menu.classList.add('menu-anim');
                $hamburger.setAttribute('style', 'border-color: grey');
                svg.forEach(line =>
                {
                    line.setAttribute('style', 'stroke: grey')
                });
            }
        });
    }



    // this method creates the specific html tag inside the DOM
    static Register()
    {
        customElements.define('smartport-map', SmartPortMap);
    }
}

SmartPortMap.Register();

