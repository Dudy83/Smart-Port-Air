export class MapAPI {

    constructor() {
        this.moment = require('moment'); 
    }

    /**
     * @param {integer} polluantId 
     * @param {string} codeStation  
     */
    getMesures(polluantId, codeStation) 
    {
        const date = this.moment().subtract(5, 'days').format('YYYY/MM/DD');

        return new Promise((resolve, reject) => {
            
            const createRequests = () => {
                const getURL = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_journalier_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&srsName=EPSG:4326&typeName=mes_sudpaca_journalier_poll_princ:mes_sudpaca_journalier&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27"+date+ "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%20"+polluantId+"%20AND%20code_station%20=%20%27"+codeStation+"%27";

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
     * @param {integer} polluantId
     * @param {string} codeStation 
     * @param {integer} ech 
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
     * @param {float} lon 
     * @param {float} lat 
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

    async getWind() {
        let response = await fetch(`uploads/wind/vent_json/wind_field_${this.moment().format('HH')}.json`, {cache: "no-store"});
            
        let data = await response.json();

        return data;
    }

    async getIHS(map) {

      const svg = (color) => {
        return encodeURIComponent(`<svg width="100%" height="100%" viewBox="0 0 201.26 201.26" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="margin-top: 0px;margin-left: 0px;margin-right: 0px;fill: ${color};">
          <path d="M105.019 84.875c5.668 1.855 9.785 7.129 9.785 13.412 0 7.826-6.348 14.18-14.174 14.18-7.825 0-14.173-6.354-14.173-14.18 0-6.438 4.315-11.807 10.189-13.541V27.118l-31.449 75.55v81.517l36.371-31.353 34.496 31.353V98.589l-31.045-71.812v58.098z"></path>
          <path fill="rgba(0, 0, 0, .2)" d="M100.864.366L58.11 103.076v97.819l43.646-37.624 41.394 37.624V98.182L100.864.366zm35.199 183.818l-34.496-31.353-36.371 31.353v-81.517l31.449-75.55v57.628c-5.874 1.734-10.189 7.104-10.189 13.541 0 7.826 6.348 14.18 14.173 14.18 7.827 0 14.174-6.354 14.174-14.18 0-6.283-4.117-11.557-9.785-13.412V26.778l31.045 71.812v85.594z"></path>
        </svg>`);
      }
      
      const MARKER_URL = (color) => `data:image/svg+xml,${svg(color)}`;
      
      let markers = new Array();
      let headingArray = new Array();

      const BoatIcon = (color) => {
        return L.icon({
          iconUrl: MARKER_URL(color),
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, 0],
        });
      }

      const updateIconStyle = () => {        
        for(let i in markers) {
          markers[i]._icon.style.transform = `${markers[i]._icon.style.transform} rotateZ(${JSON.parse(data.results)[i][6] || 0}deg)`;
          markers[i]._icon.style.transformOrigin = 'center';
        }
      }

      let response = await fetch('/map/ihs/api');

      let data = await response.json();

      if(data.code == 400) throw new Error('An error occured during the XHR');

      for(let data of JSON.parse(data.results)) {

        let color;
        
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

        const marker = L.marker([lat, lon], {
          icon: BoatIcon(color),
          title: 'boatmarker'
        }).bindPopup(`<div class="d-flex flex-column align-items-center justify-content-center w-100"><p style="margin:0">Nom : ${name}</p><br><p style="margin:0">Type : ${vesselType}</p><br><p style="margin:0">Destination : ${destination}</p><br><p style="margin:0">Status : ${status}</p></div>`)
          .addTo(map);

        markers.push(marker);

        headingArray.push(heading);

        marker._icon.setAttribute('data-heading', heading);

      }
      
      map.on('zoomend', updateIconStyle);
      map.on('viewreset', updateIconStyle);

      let layer = L.layerGroup(markers);

      layer.on("add", updateIconStyle);

      return layer;
    }

    async getUserMesures() 
    {
        let response = await fetch('api/map/users/mesures');

        let data = await response.json();

        if(data.code == 500) return data.code;

        let results = JSON.parse(data.results);

        return results;
    }

    async getStations(stations) 
    {            
        let response = await fetch('https://geoservices.atmosud.org/geoserver/mes_sudpaca_annuelle_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_annuelle_poll_princ:mes_sudpaca_annuelle&outputFormat=application/json&srsName=EPSG:4326');

        let data = await response.json();
                
        if(!response.ok) throw new Error(': Ajax Request failed... response status :' + response.status);
      
        for(let i in data.features) {
          if(!stations.hasOwnProperty(data.features[i].properties.code_station)) {
            stations.push(data.features[i]);
            stations[data.features[i].properties.code_station] = "";
          }
        } 

        stations = stations.filter(elm => elm != "");

        localStorage.setItem('sites', JSON.stringify(stations));

        let geoJson = { type: 'FeatureCollection', features: stations };

        return geoJson;
    }

    async getWmsMap()
    {
        let wmsAdress = 'https://geoservices.atmosud.org/geoserver/azurjour/wms?';
        let result;

        if(new Date().getHours() >= "11") 
            result = `paca-multi-${this.toTimestamp(this.moment().format('YYYY MM DD'))}-1`;
        else 
            result = `paca-multi-${this.toTimestamp(this.moment().subtract(1, 'days').format('YYYY MM DD'))}-2`;

        let data = {
            "url": wmsAdress,
            "result": result
        }

        return data;
    }

    /**
     * @param {date} strDate 
     */
    toTimestamp(strDate) 
    {
        return (Date.parse(strDate)/1000);
    }

    async sendMesuresForm()
    {
        let form = document.getElementById('form-add-mesures');

        let file_input = document.getElementById('user_mesures_file_adress');

        let formData = new FormData(form);

        formData.append('file', file_input.files[0], file_input.name);

        let options = {
            method: 'post',
            body: formData,
            headers: {'X-Requested-With': 'XMLHttpRequest'}
        };

        let response = await fetch('api/add/mesures', options);
        
        let data = await response.json();

        return data;
    }
}
