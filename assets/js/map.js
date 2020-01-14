require('../css/map.css');

class SmartPortMap extends HTMLElement 
{
    constructor()
    {
        super();

        this.monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        this.hoursNames = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"];
        this.dayNames = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
        this.stations = new Array();

        this.attrib = '&copy;<a href="http://www.airpaca.org/"> ATMOSUD - 2020 </a>| &copy; Mapbox';
        this.iniLon = 5.9367;
        this.iniLat = 43.7284;
        this.iniZoom = 9;

        this.DarkGreyCanvas = L.tileLayer("http://{s}.sm.mapstack.stamen.com/" + "(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/" + "{z}/{x}/{y}.png",
        {
            attribution: this.attrib
        });

        this.WorldImagery = L.tileLayer('https://{s}.tiles.mapbox.com/v3/aj.map-zfwsdp9f/{z}/{x}/{y}.png', 
        {
            attribution: this.attrib
        });

        this.baseLayers = {
            "<span class='base-layers-choices'><i class='fas fa-map-marked-alt'></i> Normal</span>": this.WorldImagery,
            "<span class='base-layers-choices'><i class='fas fa-map-marked-alt'></i> Noir</span>": this.DarkGreyCanvas
        };

        this.logo = L.control({position: 'topleft'});

        this.map = L.map('map', {
            layers: [  this.DarkGreyCanvas ],
            zoomControl: false
        });

        this.map.setView([this.iniLat, this.iniLon], this.iniZoom);
        // this.map.scrollWheelZoom.disable();
        // this.map.dragging.disable();

    }

    connectedCallback()
    {
        this.create_stations();
        this.generate_wind();
        this.add_logo();
    }
    
    create_stations()
    {
        fetch('/api/map').then((response) =>
        {
            return response.json().then((data)=>{
                
                if(data.results)
                {
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
        
                    L.geoJSON(geoJson, {
            
                        pointToLayer: (feature, latlng) => 
                        {
                            return new L.marker(latlng);
                        },
                    
                        onEachFeature: (feature, layer) =>
                        {
                            layer.bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636">' + feature.nom +  '</h5><button type="button" class="btn btn-primary w-100 dataNO2" data-toggle="modal" data-target=#mod-'+feature.station_id+'><i class="fas fa-chart-line mr-2"></i>Graphique des polluants</button></div>');
                            
                            document.getElementById('modals-container').innerHTML += `
                            <div style="z-index: 7000;" class="modal fade right" id=mod-`+feature.station_id+` tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                                
                                <div class="modal-dialog modal-full-height modal-right w-100" role="document" style="position: fixed !important;right: 0;height: 100%;top: 0;margin: 0;">
                                
                                    <div class="modal-content" style="height:100%">
                                        
                                        <div class="modal-header d-flex flex-column justify-content-center align-items-center">
                                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                            <h4 class="modal-title w-100" id="myModalLabel" style="text-align:center;">`+feature.nom+ " <br> " +feature.station_id+`</h4>
                                        </div>
                                    
                                        <div class="modal-body">
                                            <ul class="nav nav-tabs d-flex justify-content-center align-items-center mb-5">
                                                <li class="nav-item">
                                                    <a class="nav-link active" href="#">NO2</a>
                                                </li>
                                                <li class="nav-item">
                                                    <a class="nav-link" href="#">O3</a>
                                                </li>
                                                <li class="nav-item">
                                                    <a class="nav-link" href="#">PM10</a>
                                                </li>
                                                <li class="nav-item">
                                                    <a class="nav-link" href="#" tabindex="-1" aria-disabled="true">S02</a>
                                                </li>
                                            </ul>
                                            <div class="w-100 d-flex justify-content-center align-items-center" id="modal-`+feature.station_id+`">
                                            <img src="images/legend_NO2.png">
                                                <canvas class="chartjs-render-monitor" id="canvas-`+feature.station_id+`" width="400" height="400"></canvas>
                                            </div>
                                        </div>
                    
                                        <div class="modal-footer justify-content-center">
                                            <button class="btn btn-danger d-flex justify-content-center align-items-center" data-dismiss="modal"><i class="far fa-times-circle mr-2"></i>Fermer</button>
                                        </div>
                                        
                                    </div>
                    
                                </div>
                    
                            </div>`;
                        }
                    }).addTo(this.map);
                }

            }).then(() => 
            {
                this.border_paca();
                this.get_NO2();
            })

        })
    }

    generate_wind()
    {
        let day = new Date().getDate();
        let monthIndex = new Date().getMonth();
        let year = new Date().getFullYear();
        let hours = new Date().getHours();
    
        fetch('cdn/js/wind' + '_' + this.dayNames[day] + this.monthNames[monthIndex] + year + '_' + this.hoursNames[hours] + '.json').then((response) =>
        {
            return response.json().then((data) =>
            {
                let layer = L.velocityLayer({
                    displayValues: true,
                    displayOptions: {
                        velocityType: 'Global Wind',
                        displayPosition: 'bottomleftleft',
                        displayEmptyString: 'No wind data'
                    },
                    data: data,
                }).addTo(this.map);
        
                let wind = 
                {
                    "<span class='base-layers-choices'><i class='fas fa-wind'></i> Vent</span>": layer,
                }
        
                if(!document.getElementsByClassName('leaflet-control-layers')[0])
                {
                    L.control.layers(this.baseLayers, wind).addTo(this.map);
                }
        
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

    get_NO2()
    {      
        this.stations.forEach((station) => 
        {
            let day = (new Date().getDate()-5);
            let monthName = new Date().getMonth();
            let year = new Date().getFullYear();

            this.get_mesures_max_jour(year, this.monthNames[monthName], day, 8, station.station_id, 4).then((data) =>
            { 
                if(data[0] != -Infinity)
                {
                    this.get_previsions(station.geometry.coordinates[0], station.geometry.coordinates[1], "NO2").then((PrevisionData) =>
                    {
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
    
                        let ctx = document.getElementById('canvas-'+station.station_id).getContext("2d");
    
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
                                        label: "NO2 Mesures",
                                        borderColor: gradient,
                                        fill: false,
                                        data: data,
                                    },
                                    {
                                        label: "NO2 Prévisions",
                                        borderColor: gradient,
                                        borderDash: [10,5],
                                        fill: false,
                                        data:  PrevisionData,
                                    },
                                    {
                                        label: "NO2 valeur limite",
                                        fill: false,
                                        backgroundColor: "red",
                                        borderColor: "red",
                                        data: [200, 200, 200, 200, 200, 200, 200, 200],
                                    },
                                ]
                            },
                            options: {
                                responsive: true,
                                title: {
                                    fontSize: 20,
                                    display: true,
                                    text: 'Evolution des max horaires journaliers en NO2'
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
    
                    })
                } else {
                    let modal_body = document.getElementById('modal-'+station.station_id);
                    modal_body.innerHTML = '<div class="modal-title alert alert-warning w-100" style="text-align:center;"><i class="fas fa-exclamation-triangle mr-2"></i> Cette station ne mesure pas le NO2 </div>';

                }
            });
        })
    }

    get_03(code_station)
    {

    }

    get_PM10(code_station)
    {

    }

    get_SO2(code_station)
    {

    }

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

    border_paca()
    {
        fetch('cdn/js/border_paca.geojson').then((response) => 
        {
            return response.json().then((data) =>
            {
                if(data)
                {
                    new L.GeoJSON(data).addTo(this.map);
                }
            });
        })  
    }

    add_logo()
    {
        this.logo.onAdd = () => 
        {
            let element = L.DomUtil.create('div', 'info logo d-flex flex-column justify-content-center align-items-center');  
            element.innerHTML = '<img src="images/logo/atmosud.png" width="128px">';
            return element;
        };
        this.logo.addTo(this.map);  
    }

    static Register()
    {
        customElements.define('smartport-map', SmartPortMap);
    }
}

SmartPortMap.Register();
