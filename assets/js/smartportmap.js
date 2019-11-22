import { cpus } from "os";

let attrib = '&copy;<a href="http://www.airpaca.org/"> ATMOSUD - 2019 </a>| &copy; Mapbox';
let iniLon = 5.9367;
let iniLat = 43.7284;
let iniZoom = 9;

var DarkGreyCanvas = L.tileLayer("http://{s}.sm.mapstack.stamen.com/" + "(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/" + "{z}/{x}/{y}.png",
{
    attribution: attrib
});

var WorldImagery = L.tileLayer('https://{s}.tiles.mapbox.com/v3/aj.map-zfwsdp9f/{z}/{x}/{y}.png', 
{
    attribution: attrib
});


var baseLayers = {
    "<span class='base-layers-choices'><i class='fas fa-map-marked-alt'></i> Normal</span>": WorldImagery,
    "<span class='base-layers-choices'><i class='fas fa-map-marked-alt'></i> Noir</span>": DarkGreyCanvas
};


var map = L.map('map', {
    layers: [WorldImagery, DarkGreyCanvas],
    zoomControl: false
});

map.setView([iniLat, iniLon], iniZoom);
// map.scrollWheelZoom.disable();
// map.dragging.disable();

function create_stations()
{
    fetch('/api/map').then((response) =>
    {
        return response.json().then((data)=>{
            var feature = {
                type: 'Feature',
                properties: data,
                geometry: {
                    type: 'Point',
                    coordinates: data.message.geometry.coordinates,
                },
                stationId: station.properties.nom_station,
                modal: station.properties.code_station,
            } 
        })
    })
}

create_stations();

function generate_wind() 
{
    var monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

    var dayNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];

    var hoursNames = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"];

    var day = new Date().getDate();
    var monthIndex = new Date().getMonth();
    var year = new Date().getFullYear();
    var hours = new Date().getHours();

    return  $.getJSON('cdn/js/wind' + '_' + day + monthNames[monthIndex] + year + '_' + hoursNames[hours] + '.json', 

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
        }).addTo(map);

        var wind = 
        {
            "<span class='base-layers-choices'><i class='fas fa-wind'></i> Vent</span>": layer,
        }

        if(!document.getElementsByClassName('leaflet-control-layers')[0])
        {
            L.control.layers(baseLayers, wind).addTo(map);
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

function stations_NO2()
{
    var monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

    var dayNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
    
    var day = (new Date().getDate()-6);
    var monthIndex = new Date().getMonth();
    var year = new Date().getFullYear();
    let jsonFeatures = new Array();

    let url = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27"+  year + '/' +  monthNames[monthIndex] + '/' + dayNames[day] + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%208";

    axios.get(url).then(response =>
    {
        response.data.features.forEach(station => {
            var feature = {
                type: 'Feature',
                properties: station,
                geometry: {
                    type: 'Point',
                    coordinates: station.geometry.coordinates,
                },
                stationId: station.properties.nom_station,
                modal: station.properties.code_station,
            } 

            jsonFeatures.push(feature)
        });
        var geoJson = { type: 'FeatureCollection', features: jsonFeatures };
        
        L.geoJSON(geoJson, {

            pointToLayer: (feature, latlng) => 
            {
                return new L.CircleMarker(latlng);
            },
        
            onEachFeature: (feature, layer) =>
            {
                layer.bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636">' + feature.stationId +  '</h5><button type="button" class="btn btn-primary w-100" data-toggle="modal" data-target=#mod-'+feature.modal+'><i class="fas fa-chart-line mr-2"></i>Graphique des polluants</button></div>');
                
                document.getElementById('modals-container').innerHTML += `
                <div style="z-index: 7000;" class="modal fade right" id=mod-`+feature.modal+` tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                    
                    <div class="modal-dialog modal-full-height modal-right w-100" role="document" style="position: fixed !important;right: 0;height: 100%;top: 0;margin: 0;">
                    
                        <div class="modal-content" style="height:100%">
                            
                            <div class="modal-header d-flex flex-column justify-content-center align-items-center">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 class="modal-title w-100" id="myModalLabel" style="text-align:center;">`+feature.stationId+ " <br> " +feature.modal+`</h4>
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
                                <div class="w-100  d-flex justify-content-center align-items-center">
                                <img src="images/legend_NO2.png">
                                    <canvas class="chartjs-render-monitor" id="canvas-`+feature.modal+`" width="400" height="400"></canvas>
                                </div>
                            </div>
        
                            <div class="modal-footer justify-content-center">
                                <button class="btn btn-danger d-flex justify-content-center align-items-center" data-dismiss="modal"><i class="far fa-times-circle mr-2"></i>Fermer</button>
                            </div>
                            
                        </div>
        
                    </div>
        
                </div>`
                ;
            }
        }).addTo(map);
    })
    .finally(() =>
    {
        let stationIndex =  [];

        for(let i = 0; i < jsonFeatures.length-1; i++)
        {
            if(jsonFeatures[i].stationId != jsonFeatures[i+1].stationId)
            {
                var feature = {
                    code_station: jsonFeatures[i].modal,
                    coord: jsonFeatures[i].geometry.coordinates
                }
                stationIndex.push(feature);
            }
        }

        var lastFeature = {
            code_station: "FR24038",
            coord: [6.0672369, 44.54864888]
        }

        stationIndex.push(lastFeature)

        stationIndex.forEach((station) => 
        {
            let days = (new Date().getDate()-5);
            let monthName = new Date().getMonth();
            let year = new Date().getFullYear();

            var monthId = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

            console.log(year + "/" + monthId[monthName] + "/" + days)

            get_mesures_max_jour(year, monthId[monthName], days, 8, station.code_station, 4).then((data) =>
            { 
                get_previsions(station.coord[0], station.coord[1], "NO2").then((PrevisionData) =>
                {
                    PrevisionData.unshift(data[data.length-1]);

                    for(let u = 0; u < 4; u++)
                    {
                        PrevisionData.unshift(null)
                    }

                    var days = new Array();
            
                    for(let i = -5; i < 3; i++)
                    {      
                        var day = new Date().getDate();
                        var monthName = new Date().getMonth();
                        var year = new Date().getFullYear();
                        
                        days.push((day+i) + '/' + monthId[monthName] + '/' + year)
                    }

                    let ctx = document.getElementById('canvas-'+station.code_station).getContext("2d");

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
            });
        })
    })
}

const get_previsions = async (lon, lat, pol) => 
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

const get_mesures = async (id_poll_ue, code_station) =>
{
    let monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

    let dayNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
    
    let day = (new Date().getDate()-6);
    let monthIndex = new Date().getMonth();
    let year = new Date().getFullYear();

    return new Promise((resolve, reject) =>
    {
        const createRequests = () =>
        {
            const getURL = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27"+  year + '/' +  monthNames[monthIndex] + '/' + dayNames[day] + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%20"+id_poll_ue+"%20AND%20code_station%20=%20%27"+code_station+"%27";
            
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

const get_mesures_max_jour = (year, month, day, id_poll_ue, code_station, ech) =>
{
    return new Promise((resolve, reject) =>
    {
        const createRequests = () =>
        {
            const results = [];

            for(let i = 0; i <= ech; i++)
            {
                let nextDate = day+i;
              
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
    


// get_mesures_max_jour(2019, 11, 16, 8, "FR24018", 5).then((data) =>
// {
//     console.log(data)
// })


// get_mesures(8, "FR24018").then((data) =>
// {
//     console.log(data)
// })

// get_previsions(6.0672369, 44.54864888, "NO2").then((data) =>
// {
//     console.log(data);
// })
 
// Paramètres : lon, lat
// get_previsions(7.20194387, 43.6577454, "NO2").then((data) =>
// {
//     console.log(data);
// })
// for(let i = 0; i < jsonFeatures.length-1; i++)
// {
//         const get_previsions = (lon, lat, pol) => 
//         {
//             // Always return a promise
//             return new Promise((resolve, reject) =>
//             {
//                 // This function creates and returns an array of http requests bound by promises
//                 const createRequests = () => 
//                 {
//                     // requestsNO2 is an array of yet-to-bet-executed http requests. Each item is thus a Promise-like.
//                     const requestsNO2 = [];
                        
//                     for(let ech = 0; ech <= 2; ++ech)
//                     {
//                         const previsionURL = "https://apigeoloc.atmosud.org/getpollution?pol="+pol+"&lon="+lon+"&lat="+lat+"&ech=p"+ech+"";
//                         const request = axios.get(previsionURL);
        
//                         requestsNO2.push(request);
//                     }
        
//                     return requestsNO2;
//                 }
        
//                 if(lon && lat)
//                 {
//                     // Prepare http requests promises
//                     const requests = createRequests();
        
//                     // Wait for each one to complete via Promise.all
//                     Promise.all(requests).then(responseS => {
//                         // Map the responses to collect data
//                         const data = responseS.map(response => response.data.data.valeur);
//                         // Resolve data array
//                         resolve(data);
//                     });
//                 } else {
//                     reject(); 
//                 }
//             })
//         }

//         get_previsions(jsonFeatures[i].geometry.coordinates[0], jsonFeatures[i].geometry.coordinates[1], "NO2").then((dataPromise) =>
//         {
//             for(let x = 0; x <= 0; x++)
//             {
//                 if(jsonFeatures[i].modal == jsonFeatures[i+1].modal)
//                 {
//                     mesureNO2.push(jsonFeatures[i].properties.properties.valeur);  
//                 } 
//             }
//             console.log(mesureNO2)
//             for(let x = 0; x <= 4; x++)
//             {
//                 dataPromise.unshift(null);
//             }
//             var days = new Array();

//             var monthId = [
//                 "01", "02", "03",
//                 "04", "05", "06", 
//                 "07", "08", "09", 
//                 "10", "11", "12"
//             ];
    
//             for(let i = -5; i < 3; i++)
//             {      
//                 var day = new Date().getDate();
//                 var monthName = new Date().getMonth();
//                 var year = new Date().getFullYear();
                
//                 days.push((day+i) + '/' + monthId[monthName] + '/' + year)
//             }
          

            
        // })

//         mesureNO2 = [];
//         previsionNO2 = [];
        
//     }
stations_NO2()
generate_wind() 

// function get_station_value(code_station)
// {
//     var monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

//     var dayNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
    
//     var day = (new Date().getDate()-6);
//     var monthIndex = new Date().getMonth();
//     var year = new Date().getFullYear();
//     let jsonFeatures = new Array();
//     let mesureNO2 = new Array();
//     let previsionNO2 = new Array();
//     let index = ["FR02005", "FR02019", "FR02022", "FR02041", "FR02043", "FR03006", "FR03014", "FR03021", "FR03029", "FR03030", "FR03032", "FR03043", "FR03060", "FR03070", "FR03071", "FR03080", "FR03084", "FR03087", "FR24007", "FR24009", "FR24018", "FR24023", "FR24030", "FR24033", "FR24035", "FR24036", "FR24038"]; 
//     let ech = 0;
//     var str;

//     for(let i = 0; i < index.length; i++)
//     {
//         let mesureURL = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27"+  year + '/' +  monthNames[monthIndex] + '/' + dayNames[day] + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%208%20AND%20code_station=%20%27"+ index[i] +"%27";

//         axios.get(mesureURL).then(response =>
//         {
//             response.data.features.forEach(value =>
//             {
                
//                 jsonFeatures.push(value.properties.valeur)
//             })
//         })
//     }

//     console.log(index)
//     console.log(jsonFeatures)

// }
// get_station_value()



























// function stations_NO2()
// {
//     var monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

//     var dayNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
    
//     var day = (new Date().getDate()-6);
//     var monthIndex = new Date().getMonth();
//     var year = new Date().getFullYear();
//     let jsonFeatures = new Array();
//     let mesureNO2 = new Array();
//     let previsionNO2 = new Array();
//     let index = new Array(); 
//     let  i = 0;
//     let ech = 0;
//     var str;

//     let url = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27"+  year + '/' +  monthNames[monthIndex] + '/' + dayNames[day] + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%208"

//         axios.get(url).then((response) =>
//         {
//             response.data.features.forEach((station) =>
//             { 
//                 index.push(station.properties.code_station);
//             })
//         })

//         axios.get(url).then((response) =>
//         {
//             response.data.features.forEach((station) =>
//             {
//                 str = station.properties.code_station;
                
//                 var feature = {
//                     type: 'Feature',
//                     properties: station,
//                     geometry: {
//                         type: 'Point',
//                         coordinates: station.geometry.coordinates,
//                     },
//                     stationId: station.properties.nom_station,
//                     modal: str,
//                 }    

//                 jsonFeatures.push(feature);

//                 while(index[i] === str)
//                 {   
//                     let newUrl = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27"+  year + '/' +  monthNames[monthIndex] + '/' + dayNames[day] + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%208%20AND%20code_station=%20%27"+ str +"%27";

//                     axios.get(newUrl).then(response => 
//                     {
//                         response.data.features.forEach(value =>
//                         {
//                             mesureNO2.push(value.properties.valeur);
//                         })
//                     })   
                    
//                     while(ech <= 2)
//                     {
//                         let url = "https://apigeoloc.atmosud.org/getpollution?pol=NO2&lon="+station.geometry.coordinates[0]+"&lat="+station.geometry.coordinates[1]+"&ech=p"+ech+"";
                                      
//                         axios.get(url).then((response) =>
//                         {
//                             previsionNO2.push(response.data.data.valeur);
//                         })
//                         ech++;
//                     }
                
//                     i++;
//                 }
//                 ech = 0;
//             })

//             var geoJson = { type: 'FeatureCollection', features: jsonFeatures };
       
//                 L.geoJSON(geoJson, {
            
//                     pointToLayer: (feature, latlng) => 
//                     {
//                         return new L.CircleMarker(latlng);
//                     },
                
//                     onEachFeature: (feature, layer) =>
//                     {
//                         layer.bindPopup('<div class="d-flex flex-column align-items-center justify-content-center w-100"><h5 style="color:#363636">' + feature.stationId + '</h5><button type="button" class="btn btn-primary w-100" data-toggle="modal" data-target=#mod-'+feature.modal+'><i class="fas fa-chart-line mr-2"></i>Graphique des polluants</button></div>');
                        
//                         document.getElementById('modals-container').innerHTML += `
//                         <div style="z-index: 7000;" class="modal fade right" id=mod-`+feature.modal+` tabindex="-1" role="dialog" aria-labelledby="myModalLabel"aria-hidden="true">
                            
//                             <div class="modal-dialog modal-full-height modal-right w-100" role="document">
                            
//                                 <div class="modal-content">
                                    
//                                     <div class="modal-header">
//                                         <h4 class="modal-title w-100" id="myModalLabel" style="text-align:center;">`+feature.stationId+`</h4>
//                                         <button type="button" class="close" data-dismiss="modal" aria-label="Close">
//                                             <span aria-hidden="true">&times;</span>
//                                         </button>
//                                     </div>
                                
//                                     <div class="modal-body">
//                                         <canvas class="chartjs-render-monitor" id="canvas-`+feature.modal+`" width="400" height="400"></canvas>
//                                     </div>
                
//                                     <div class="modal-footer justify-content-center">
//                                         <button class="btn btn-danger" data-dismiss="modal">Fermer</button>
//                                     </div>
                                    
//                                 </div>
                
//                             </div>
                
//                         </div>`;
//                     }
//                 }).addTo(map);

//                 var days = new Array();

//                 var monthId = [
//                     "01", "02", "03",
//                     "04", "05", "06", 
//                     "07", "08", "09", 
//                     "10", "11", "12"
//                 ];
        
//                 for(let i = -5; i < 3; i++)
//                 {      
//                     var day = new Date().getDate();
//                     var monthName = new Date().getMonth();
//                     var year = new Date().getFullYear();
                    
//                     days.push((day+i) + '/' + monthId[monthName] + '/' + year)
//                 }
//                 console.log(previsionNO2)
//                 console.log(mesureNO2)
//                 index.forEach(element => 
//                 {
//                     new Chart(document.getElementById('canvas-'+element), {
//                         type: 'line',
//                         data: {
//                             labels: days,
//                             datasets: [
//                                 {
//                                     label: "NO2 Prévisions",
//                                     fill: true,
//                                     backgroundColor: "rgba(52, 152, 219, 0.500)",
//                                     borderColor: "#3498db",
//                                     data: previsionNO2,
//                                 },
//                                 {
//                                     label: "NO2 Relevés",
//                                     fill: true,
//                                     backgroundColor: "rgba(255, 166, 0, 0.521)",
//                                     borderColor: "orange",
//                                     data: previsionNO2,
//                                 },
//                                 {
//                                     label: "NO2 valeur limite",
//                                     fill: false,
//                                     backgroundColor: "red",
//                                     borderColor: "red",
//                                     data: [200, 200, 200, 200, 200, 200, 200, 200],
//                                 },
//                             ]
//                         },
//                         options: {
//                             title: {
//                                 fontSize: 20,
//                                 display: true,
//                                 text: 'Evolution des max horaires journaliers en NO2'
//                             },
//                             scales: {
//                                 yAxes: [{
//                                     ticks: {
//                                         beginAtZero: true,
//                                         suggestedMax: 250
//                                     },
//                                     scaleLabel: {
//                                         display: true,
//                                         labelString: 'µg/m3'
//                                     }
//                                 }]
//                             },
//                             legend: {
//                                 position: 'bottom',
//                                 display: true, 
//                                 labels: {fontSize: 10},                
//                             },
//                         }
//                     });
//                 })

//         })
// }


// function stations_O3()
// {}

// function stations_PM10()
// {}

// function stations_SO2()
// {}

// setTimeout(stations_NO2(), 10000);




// var geoJson = { type: 'FeatureCollection', features: jsonFeatures };



// index = []
// previsionNO2 = []
// mesureNO2 = [];

// i++;
// console.log(mesureNO2)
// console.log(previsionNO2)
// console.log('next each')