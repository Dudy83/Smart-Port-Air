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
            layers: [ this.DarkGreyCanvas, this.WorldImagery ],
            zoomControl: false
        });
        this.map.setView([this.iniLat, this.iniLon], this.iniZoom);
        this.map.scrollWheelZoom.disable();
        this.map.dragging.disable();
    }

    connectedCallback()
    {
        this.create_stations_points();
        this.generate_wind();
        this.draw_graph();
        document.getElementById('navbar').style.setProperty('background', '#363636')
    }

    get_stations_points(callback)
    {
        const url = "/api/map";

        var jsonFeatures = new Array();

        axios.get(url).then(function(response) {

            const object = JSON.parse(response.data.message);       
    
            object.forEach(function(point)
            {
                var lat = point.lat;
                var lon = point.lon;
                var id = point.id;
    
                var feature = {
                    lat: lat,
                    lon: lon,
                    stationId: id
                };
    
                jsonFeatures.push(feature);
            });

            callback(jsonFeatures);
        })
    }

    create_stations_points()
    {
        this.get_stations_points(data => data.forEach((data) => 
        {
            new L.marker([data.lat, data.lon]).bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#3498db">Station n° : ' + data.stationId + '</h5><button type="button" style="outline:none;border-radius:5rem;font-size:120%;padding:1rem;background-color:#3498db;color:#fff;border:none;box-shadow: 0 2px 5px 0 rgba(0,0,0,.16), 0 2px 10px 0 rgba(0,0,0,.12);" class="w-100" data-toggle="modal" data-target=#mod-' + data.stationId + '>Graphique des polluants</button></div>').addTo(this.map);
            
            document.getElementById('modals-container').innerHTML += `
                <div style="z-index: 7000;" class="modal fade right" id=mod-`+data.stationId+` tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                    
                    <div class="modal-dialog modal-full-height modal-right w-100" role="document">
                    
                        <div class="modal-content">
                            
                            <div class="modal-header">
                                <h4 class="modal-title w-100" id="myModalLabel">Station n°: `+data.stationId+`</h4>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                        
                            <div class="modal-body">
                                <canvas class="chartjs-render-monitor" id=canvas-`+data.stationId+` width="400" height="400"></canvas>
                            </div>

                            <div class="modal-footer justify-content-center">
                                <button class="btn btn-danger" data-dismiss="modal">Fermer</button>
                            </div>
                            
                        </div>

                    </div>

                </div>`;
        }));
    }

    draw_graph()
    {
        // const url = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_horaire_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_horaire_poll_princ:mes_sudpaca_horaire&maxFeatures=50&outputFormat=application%2Fjson";

        // var polluant = new Array();

        // axios.get(url).then((value) =>
        // {
        //     value.data.features.forEach((pollution) =>
        //     {
        //         if(pollution.properties.valeur != null)
        //         {
        //             let poll = pollution.properties.valeur;
        //             polluant.push(poll);
        //         }
        //     })
        // }).finally(() =>
        // {
            var days = new Array();

            var monthId = [
                "01", "02", "03",
                "04", "05", "06", 
                "07", "08", "09", 
                "10", "11", "12"
            ];

            for(let i = 0; i < 7; i++)
            {      
                var day = new Date().getDate();
                var monthName = new Date().getMonth();
                var year = new Date().getFullYear();
                
                days.push((day+i) + '/' + monthId[monthName] + '/' + year)
            }
            
            this.get_stations_points(data => data.forEach((data) => 
            {
                var url = "http://apigeoloc.atmosud.org/getpollution?pol=NO2&lon="+data.lon+"&lat="+data.lat+"&ech=p0";

                let header = new Headers();
                header.append('Accept', 'application/json');

                let request = new Request(url, {
                    method: 'GET',
                    headers: header,
                    mode: 'cors'
                });

                fetch(request)
                    .then((response) =>
                    {
                        console.log(response);
                    })
                    .catch((err) =>
                    {
                        console.log(err);
                    });

                var NO2 = {
                    labels: days,
                      datasets: [
                        {
                            label: "N02",
                            fill: false,
                            backgroundColor: "#3498db",
                            borderColor: "#3498db",
                            data: polluant,
                        }
                    ]
                };
                var NO2Chart = new Chart(document.getElementById('canvas-'+data.stationId), {
                    type: 'line',
                    data: NO2,
                    options: {
                        title: {
                            fontSize: 20,
                            display: true,
                            text: 'Evolution des max horaires journaliers en NO2'
                        }
                    }
                })
            }))
    }
       
    generate_wind() 
    {
        var monthNames = [
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
                    generate_wind();
                    console.log("wind has been correctly generated");
                }

                else
                {
                    console.log("wind will be generated at "+ (new Date().getHours()+1) + ":00");
                }
            }, 60000);
        })  
    }


    static Register()
    {
        customElements.define('smartport-map', SmartPortMap);
    }
    
}

SmartPortMap.Register();

// // initial variables to create the map
// let attrib = '&copy;<a href="http://www.airpaca.org/"> ATMOSUD - 2019 </a>| &copy; Mapbox';
// let iniLon = 5.9367;
// let iniLat = 43.7284;
// let iniZoom = 9;

// // Dark map layer
// var DarkGreyCanvas = L.tileLayer("http://{s}.sm.mapstack.stamen.com/" + "(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/" + "{z}/{x}/{y}.png",
// {
//     attribution: attrib
// });

// // Normal map layer
// var WorldImagery = L.tileLayer('https://{s}.tiles.mapbox.com/v3/aj.map-zfwsdp9f/{z}/{x}/{y}.png', 
// {
//     attribution: attrib
// });

// // create an object wich is add top right menu (L.Control.layer at line : 135)
// var baseLayers = {
//     "<span class='base-layers-choices'><i class='fas fa-map-marked-alt'></i> Normal</span>": WorldImagery,
//     "<span class='base-layers-choices'><i class='fas fa-map-marked-alt'></i> Noir</span>": DarkGreyCanvas
// };

// // create the leaflet map, and add the differents maps layers, remove zoom controls
// var map = L.map('map', {
//     layers: [ DarkGreyCanvas, WorldImagery ],
//     zoomControl: false
// });

// // add the initial view and zoom
// map.setView([iniLat, iniLon], iniZoom);

// //scrolling on map disabled
// map.scrollWheelZoom.disable();

// // dragging on map disabled
// map.dragging.disable();

// // This will fetch /api/map wich is sending stations coordinate(x,y) as a JSON file from the database
// function create_stations_points()
// {
//     const url = "/api/map";

//     axios.get(url).then(function(response) {

//         const object = JSON.parse(response.data.message);

//         let jsonFeatures = [];

//         object.forEach(function(point)
//         {
//             var lat = point.lat;
//             var lon = point.lon;
//             var id = point.id;

//             var feature = {
//                 type: 'Feature',
//                 properties: point,
//                 geometry: {
//                     type: 'Point',
//                     coordinates: [lon,lat]
//                 },
//                 stationId: id
                
//             };

//             jsonFeatures.push(feature);
//         });

//         var geoJson = { type: 'FeatureCollection', features: jsonFeatures };

//         L.geoJSON(geoJson, {

//             pointToLayer: function(feature, latlng) 
//             {
//                 var Icon = L.icon({
//                     iconUrl: 'images/mapIcons/icon.png',
//                     iconSize:     [35, 35], 
//                     iconAnchor:   [17.5, 35], 
//                     popupAnchor:  [0, -37],
//                     tooltipAnchor: [10, -17.5]
//                 });
//                 return L.marker(latlng, {icon: Icon});
//             },

//             onEachFeature: function (feature, layer)
//             {
//                 layer.bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636">Station n° : ' + feature.stationId + '</h5><button type="button" style="outline:none;border-radius:5rem;font-size:120%;padding:1rem;background-color:#363636;color:#fff;border:none;box-shadow: 0 2px 5px 0 rgba(0,0,0,.16), 0 2px 10px 0 rgba(0,0,0,.12);" class="w-100" data-toggle="modal" data-target=#mod-' + feature.stationId + '>Graphique des polluants</button></div>');
//                 layer.bindTooltip('<p style="text-align:center;"> Station n° : <br>' + feature.stationId + '</p>');

//                 document.getElementById('modals-container').innerHTML += `
//                 <div class="modal fade right" id=mod-`+feature.stationId+` tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                    
//                     <div class="modal-dialog modal-full-height modal-right" role="document">
                    
//                         <div class="modal-content">
                            
//                             <div class="modal-header">
//                                 <h4 class="modal-title w-100" id="myModalLabel">Station n°: `+feature.stationId+`</h4>
//                                 <button type="button" class="close" data-dismiss="modal" aria-label="Close">
//                                     <span aria-hidden="true">&times;</span>
//                                 </button>
//                             </div>
                        
//                             <div class="modal-body">
//                                 <canvas id=canvas-`+feature.stationId+` width="400" height="400"></canvas
//                             </div>

//                             <div class="modal-footer justify-content-center">
//                                 <a type="button" style="outline:none;border-radius:5rem;font-size:120%;padding:1rem;background-color:#363636;color:#fff;border:none!important;box-shadow: 0 2px 5px 0 rgba(0,0,0,.16), 0 2px 10px 0 rgba(0,0,0,.12);">Get it now
//                                     <i class="far fa-gem ml-1"></i>
//                                 </a>
//                                 <a type="button" style="outline:none;border-radius:5rem;font-size:120%;padding:1rem;background-color:red;color:#fff;border:none;box-shadow: 0 2px 5px 0 rgba(0,0,0,.16), 0 2px 10px 0 rgba(0,0,0,.12);" data-dismiss="modal">Fermer</a>
//                             </div>
                            
//                         </div>
//                     </div>
//                 </div>`;
//             }
//         }).addTo(map);
//     });
// }

// const generate_wind = () =>
// {

//     var monthNames = [
//       "01", "02", "03",
//       "04", "05", "06", "07",
//       "08", "09", "10",
//       "11", "12"
//     ];
  
//     var day = new Date().getDate();
//     var monthIndex = new Date().getMonth();
//     var year = new Date().getFullYear();
//     var hours = new Date().getHours();
  
//    return  $.getJSON('cdn/js/wind' + '_' + day + monthNames[monthIndex] + year + '_' + hours + '.json', 
   
//    function (data)
//    {
//         var layer = L.velocityLayer({
//             displayValues: true,
//             displayOptions: {
//                 velocityType: 'Global Wind',
//                 displayPosition: 'bottomleftleft',
//                 displayEmptyString: 'No wind data'
//             },
//             data: data,
//         }).addTo(map);

//         var wind = 
//         {
//             "<span class='base-layers-choices'><i class='fas fa-wind'></i> Vent</span>": layer,
//         }

//         if(!document.getElementsByClassName('leaflet-control-layers')[0])
//         {
//             L.control.layers(baseLayers, wind).addTo(map);
//         }

//         setInterval(() => 
//         {
//             if(new Date().getMinutes() == "00")
//             {
//                 generate_wind();
//                 console.log("wind has been correctly generated");
//             }

//             else
//             {
//                 console.log("wind will be generated at "+ (new Date().getHours()+1) + ":00");
//             }
//         }, 60000);
//    })  
// }

// function draw_graph()
// {
//     $.getJSON('https://geoservices.atmosud.org/geoserver/mes_sudpaca_horaire_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_horaire_poll_princ:mes_sudpaca_horaire&maxFeatures=50&outputFormat=application%2Fjson',
    
//     function(data)
//     {
//         const url = "/api/map";

//         var pollution = [];
//         var nomStation = [];
//         var name_polluant;
        
//         data.features.forEach(feature => {
//             var poll = feature.properties.valeur;
//             var nomSta = feature.properties.nom_station;
//             pollution.push(poll);
//             nomStation.push(nomSta)
//         });

//         axios.get(url).then((response) => {
                
//             const object = JSON.parse(response.data.message);
            
//             object.forEach(point => {
                
//                 var id = point.id;

//                 var ctx = document.getElementById('canvas-'+id);
                
//                 var graph = new Chart(ctx, {
//                     type: 'line',
//                     data: {
//                         labels: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
//                                  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'], 
//                         datasets: [{
//                             label: "ok",
//                             data: pollution,
//                             backgroundColor: [
//                                 'rgba(255, 99, 132, 0.2)',
//                                 'rgba(54, 162, 235, 0.2)',
//                                 'rgba(255, 206, 86, 0.2)',
//                                 'rgba(75, 192, 192, 0.2)',
//                                 'rgba(153, 102, 255, 0.2)',
//                                 'rgba(255, 159, 64, 0.2)'
//                             ],
//                             borderColor: [
//                                 'rgba(255, 99, 132, 1)',
//                                 'rgba(54, 162, 235, 1)',
//                                 'rgba(255, 206, 86, 1)',
//                                 'rgba(75, 192, 192, 1)',
//                                 'rgba(153, 102, 255, 1)',
//                                 'rgba(255, 159, 64, 1)'
//                             ],
//                             borderWidth: 1
//                         }]
//                     }    
//                 })
//             }) 
//         })
//     })
    
// }

// draw_graph();


// // This function just adds the Atmosud logo on top-left of the map
// function add_logo()
// {
//     var logo = L.control({position: 'topleft'});

//     logo.onAdd = function () {
//         var div = L.DomUtil.create('div', 'info-logo');  
//         div.innerHTML = '<img src="images/atmosud.png" width="128px">';
//         div.style.setProperty('background', 'rgba(255, 255, 255, 0.8)');
//         div.style.setProperty('border-radius', '5px');
//         div.style.setProperty('box-shadow', '0 0 15px rgba(0, 0, 0, 0.2)');
//             return div;
//     };
    
//     logo.addTo(map);  
// }

// create_stations_points();
// add_logo();
// generate_wind();

