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
    getMesuresHoraireJour(polluantId, codeStation, date)
    {
        return new Promise((resolve, reject) => {
            
            const createRequests = () => {
                
                const results = [];                

                    const dateDebut = this.moment(date).format('YYYY/MM/DD');
                    const dateFin = this.moment(date).format('YYYY/MM/DD');
                    let url = "https://geoservices.atmosud.org/geoserver/mes_sudpaca_horaire_poll_princ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=mes_sudpaca_horaire_poll_princ:mes_sudpaca_horaire&outputFormat=application%2Fjson&CQL_FILTER=date_debut>=%27" + dateDebut + "%20" + "00:00" + "%27%20AND%20id_poll_ue%20=%20"+polluantId+"%20AND%20code_station%20=%20%27"+codeStation+"%27%20AND%20date_fin<=%27"+ dateFin +"%20" + "23:59" + "%27";
                    const request = axios.get(url);
                    results.push(request);  

                return results;
            }
    
            if(polluantId && codeStation && date) {

                const requests = createRequests();
    
                Promise.all(requests).then(responseS => {
                    const data = responseS.map(response => response.data.features.map(feature => feature.properties.valeur));
    
                    resolve(data);
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

        let geoJson = { type: 'FeatureCollection', features: stations };

        return geoJson;
    }

    getWmsMap(polluant, ech)
    {
        let wmsAdress = 'https://geoservices.atmosud.org/geoserver/azurjour/wms?';
        let result;

        if(new Date().getHours() >= "11" && ech == undefined) 
            result = `paca-${polluant}-${this.toTimestamp(this.moment().format('YYYY MM DD'))}-1`;
        else if(new Date().getHours() < "11" && ech == undefined) 
            result = `paca-${polluant}-${this.toTimestamp(this.moment().subtract(1, 'days').format('YYYY MM DD'))}-2`;
        else if(new Date().getHours() >= "11" && ech) 
            result = `paca-${polluant}-${this.toTimestamp(this.moment().format('YYYY MM DD'))}-${ech}`;
        else if(new Date().getHours() < "11" && ech) 
            result = `paca-${polluant}-${this.toTimestamp(this.moment().subtract(1, 'days').format('YYYY MM DD'))}-${ech}`;

        return {
            "url": wmsAdress,
            "result": result
        }
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
