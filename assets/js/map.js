require('../css/map.css');
// Création du code de la carte leaflet de SmartPort en POO (Programmation Orientée Objet)
//class SmartPort qui présente plusieurs fonctions
class SmartPortMap extends HTMLElement 
{
    constructor()
    {
        super();
        this.attrib = '&copy;<a href="http://www.airpaca.org/"> ATMOSUD - 2019 </a>| &copy; Mapbox';
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
        this.map = L.map('map', {
            layers: [  this.WorldImagery ],
            zoomControl: false
        });
        this.map.setView([this.iniLat, this.iniLon], this.iniZoom);
    }

    connectedCallback()
    {
        this.get_station_coordinates();
        this.get_station_coordinates_O3()
        this.add_logo();
        this.draw_graph();
        this.generate_wind();
    }
    
    get_station_coordinates()
    {
        var monthNames = 
        [
        "01", "02", "03",
        "04", "05", "06", "07",
        "08", "09", "10",
        "11", "12"
        ];

        var dayNames = 
        [
        "01", "02", "03",
        "04", "05", "06", "07",
        "08", "09", "10",
        "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"
        ];
        
        var day = (new Date().getDate()-6);
        var monthIndex = new Date().getMonth();
        var year = new Date().getFullYear();

        const url ="https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut=%27"+  year + '/' +  monthNames[monthIndex] + '/' + dayNames[day] + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%208";
        console.log(url)

        let jsonFeatures = new Array();

        axios.get(url)
        
        .then((response) =>
        {
            response.data.features.forEach((station) =>
            {
                    var str = station.properties.code_station;
                    
                    var feature = {
                        type: 'Feature',
                        properties: station,
                        geometry: {
                            type: 'Point',
                            coordinates: station.geometry.coordinates,
                        },
                        stationId: station.properties.nom_station,
                        modal: str,
                    }

                    jsonFeatures.push(feature);
            })

            var geoJson = { type: 'FeatureCollection', features: jsonFeatures };

            L.geoJSON(geoJson, {
                        
                pointToLayer: (feature, latlng) => 
                {
                    var geojsonMarkerOptions = {
                        radius: 8,
                        fillColor: 'green',
                        color: 'black',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    };

                    return new L.CircleMarker(latlng, geojsonMarkerOptions);
                },

                onEachFeature: (feature, layer) =>
                {
                    layer.bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636">' + feature.stationId + '</h5><button type="button" class="btn btn-primary w-100" data-toggle="modal" data-target=#mod-'+feature.modal+'><i class="fas fa-chart-line mr-2"></i>Graphique des polluants</button></div>');
                    
                    document.getElementById('modals-container').innerHTML += `
                    <div style="z-index: 7000;" class="modal fade right" id=mod-`+feature.modal+` tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                        
                        <div class="modal-dialog modal-full-height modal-right w-100" role="document">
                        
                            <div class="modal-content">
                                
                                <div class="modal-header">
                                    <h4 class="modal-title w-100" id="myModalLabel" style="text-align:center;">`+feature.stationId+`</h4>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                            
                                <div class="modal-body">
                                    <canvas class="chartjs-render-monitor" id="canvas-`+feature.modal+`" width="400" height="400"></canvas>
                                </div>
    
                                <div class="modal-footer justify-content-center">
                                    <button class="btn btn-danger" data-dismiss="modal">Fermer</button>
                                </div>
                                
                            </div>
    
                        </div>
    
                    </div>`;
                }
            }).addTo(this.map);
        })
    }

    get_station_coordinates_O3()
    {
        var monthNames = 
        [
        "01", "02", "03",
        "04", "05", "06", "07",
        "08", "09", "10",
        "11", "12"
        ];

        var dayNames = 
        [
        "01", "02", "03",
        "04", "05", "06", "07",
        "08", "09", "10",
        "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"
        ];
        
        var day = (new Date().getDate()-6);
        var monthIndex = new Date().getMonth();
        var year = new Date().getFullYear();

        const url ="https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut=%27"+  year + '/' +  monthNames[monthIndex] + '/' + dayNames[day] + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%207";
        console.log(url)

        let jsonFeatures = new Array();

        axios.get(url)
        
        .then((response) =>
        {
            response.data.features.forEach((station) =>
            {
                    var str = station.properties.code_station;
                    
                    var feature = {
                        type: 'Feature',
                        properties: station,
                        geometry: {
                            type: 'Point',
                            coordinates: station.geometry.coordinates,
                        },
                        stationId: station.properties.nom_station,
                        modal: str,
                    }

                    jsonFeatures.push(feature);
            })

            var geoJson = { type: 'FeatureCollection', features: jsonFeatures };

            L.geoJSON(geoJson, {
                        
                pointToLayer: (feature, latlng) => 
                {
                    var geojsonMarkerOptions = {
                        radius: 8,
                        fillColor: 'red',
                        color: 'black',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    };

                    return new L.CircleMarker(latlng, geojsonMarkerOptions);
                },

                onEachFeature: (feature, layer) =>
                {
                    layer.bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636">' + feature.stationId + '</h5><button type="button" class="btn btn-primary w-100" data-toggle="modal" data-target=#mod-'+feature.modal+'><i class="fas fa-chart-line mr-2"></i>Graphique des polluants</button></div>');
                    
                    document.getElementById('modals-container').innerHTML += `
                    <div style="z-index: 7000;" class="modal fade right" id=mod-`+feature.modal+` tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                        
                        <div class="modal-dialog modal-full-height modal-right w-100" role="document">
                        
                            <div class="modal-content">
                                
                                <div class="modal-header">
                                    <h4 class="modal-title w-100" id="myModalLabel" style="text-align:center;">`+feature.stationId+`</h4>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                            
                                <div class="modal-body">
                                    <canvas class="chartjs-render-monitor" id="canvas-`+feature.modal+`" width="400" height="400"></canvas>
                                </div>
    
                                <div class="modal-footer justify-content-center">
                                    <button class="btn btn-danger" data-dismiss="modal">Fermer</button>
                                </div>
                                
                            </div>
    
                        </div>
    
                    </div>`;
                }
            }).addTo(this.map);
        })
    }
    
    generate_wind() 
    {
        var monthNames = 
        [
        "01", "02", "03",
        "04", "05", "06", "07",
        "08", "09", "10",
        "11", "12"
        ];
    
        var day = new Date().getDate();
        var monthIndex = new Date().getMonth();
        var year = new Date().getFullYear();
        var hours = new Date().getHours();
    
        return  $.getJSON('cdn/js/wind' + '_' + day + monthNames[monthIndex] + year + '_' + hours + '.json', 
    
        (data) =>
        {
            var layer = L.velocityLayer({
                displayValues: true,
                displayOptions: {
                    velocityType: 'Global Wind',
                    displayPosition: 'bottomleftleft',
                    displayEmptyString: 'No wind data'
                },
                data: data,
            }).addTo(this.map);

            var wind = 
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
    }

    add_logo()
    {
        var logo = L.control({position: 'topleft'});

        logo.onAdd = function () {
            var div = L.DomUtil.create('div', 'info-logo');  
            div.innerHTML = '<img src="images/logo/atmosud.png" width="128px">';
            div.style.setProperty('background', 'rgba(255, 255, 255, 0.8)');
            div.style.setProperty('border-radius', '5px');
            div.style.setProperty('box-shadow', '0 0 15px rgba(0, 0, 0, 0.2)');
                return div;
        };
        
        logo.addTo(this.map);  
    }

    get_stations_points(callback)
    {
        var monthNames = 
        [
        "01", "02", "03",
        "04", "05", "06", "07",
        "08", "09", "10",
        "11", "12"
        ];

        var dayNames = 
        [
        "01", "02", "03",
        "04", "05", "06", "07",
        "08", "09", "10",
        "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"
        ];
        
        var day = (new Date().getDate()-6);
        var monthIndex = new Date().getMonth();
        var year = new Date().getFullYear();

        const url = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut=%27"+  year + '/' +  monthNames[monthIndex] + '/' + dayNames[day] + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%208";

        var jsonFeatures = new Array();

        axios.get(url).then(function(response) 
        {

            response.data.features.forEach((station) =>
            {
                console.log(station)
                var feature = {
                    code_station: station.properties.code_station,
                    coordinates: station.geometry.coordinates
                }
             
                jsonFeatures.push(feature);
            })
            callback(jsonFeatures);        
        })
    }

    draw_graph()
    {
        let jsonFeatures = new Array();

        var days = new Array();

        var monthId = [
            "01", "02", "03",
            "04", "05", "06", 
            "07", "08", "09", 
            "10", "11", "12"
        ];

        for(let i = -5; i < 3; i++)
        {      
            var day = new Date().getDate();
            var monthName = new Date().getMonth();
            var year = new Date().getFullYear();
            
            days.push((day+i) + '/' + monthId[monthName] + '/' + year)
        }

        this.get_stations_points(data => data.forEach((data) => 
        {
            let ech = 0;

            let pollution = [null, null, null, null, null];

            let releve = [15, 28, 54, 19];

            while(ech <= 2)
            {
                let url = "https://apigeoloc.atmosud.org/getpollution?pol=NO2&lon="+data.coordinates[0]+"&lat="+data.coordinates[1]+"&ech=p"+ech+"";
                
                axios.get(url).then((response) =>
                {
                    pollution.push(response.data.data.valeur);
   
                })
                
                if(ech === 2)
                {
                    axios.get("https://apigeoloc.atmosud.org/getpollution?pol=NO2&lon="+data.coordinates[0]+"&lat="+data.coordinates[1]+"&ech=m0")
                    .then((response) =>
                    {
                        releve.push(response.data.data.valeur);
                    });

                    axios.get("https://apigeoloc.atmosud.org/getpollution?pol=NO2&lon="+data.coordinates[0]+"&lat="+data.coordinates[1]+"&ech=p0")
                    .then((response) =>
                    {
                        releve.push(response.data.data.valeur);
                    })
                }

                ech++;
            }

            new Chart(document.getElementById('canvas-'+data.code_station), {
                type: 'line',
                data: {
                    labels: days,
                    datasets: [
                        {
                            label: "NO2 Prévisions",
                            fill: true,
                            backgroundColor: "rgba(52, 152, 219, 0.500)",
                            borderColor: "#3498db",
                            data: pollution,
                        },
                        {
                            label: "NO2 Relevés",
                            fill: true,
                            backgroundColor: "rgba(255, 166, 0, 0.521)",
                            borderColor: "orange",
                            data: releve,
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
                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'µg/m3'
                              }
                        }]
                    },
                    legend: {
                        position: 'bottom',
                        display: true, 
                        labels: {fontSize: 10},                
                    },
                }
            })

        }))
        
    }

    static Register()
    {
        customElements.define('smartport-map', SmartPortMap);
    }
}

SmartPortMap.Register();
