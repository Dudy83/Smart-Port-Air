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

    async getIHS() {

        let response = await fetch('/map/ihs/api');
    
        let data = await response.json();
  
        if(data.code == 400) throw new Error('An error occured during the XHR');

        return data;
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

    getWmsMap(polluant)
    {
        let wmsAdress = 'https://geoservices.atmosud.org/geoserver/azurjour/wms?';
        let result;

        if(new Date().getHours() >= "11") 
            result = `paca-${polluant}-${this.toTimestamp(this.moment().format('YYYY MM DD'))}-1`;
        else 
            result = `paca-${polluant}-${this.toTimestamp(this.moment().subtract(1, 'days').format('YYYY MM DD'))}-2`;

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
