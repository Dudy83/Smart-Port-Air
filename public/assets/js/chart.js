/**
 * Cette classe exploite le plugin Chart.js pour tracer une courbe selon le polluant choisit sur 24h de mesures ou 24h glissantes  
 * 
 */
export default class chartDrawing {

    /**
     * 
     * @param {string} polluant
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(polluant, canvas) {
        this.polluant = polluant;
        this.canvas = canvas;            
        this.days = new Array();
        this.vLimite;
        this.maxPoint;
    }

    /**
     * 
     * @param {array} data la data est récupérée et retournée sous forme de tableau via la @function getMesuresHoraireJour() dans le fichier map.js
     * @param {datetime} hours
     */
    drawMesureHoraireGlissante(data, hours) {
        if(this.polluant == "O3") {
            this.vLimite = new Array(data.length).fill(180);
            this.maxPoint = 360;
        } else if(this.polluant == "NO2"){
            this.vLimite = new Array(data.length).fill(200);
            this.maxPoint = 400; 
        } else {
            this.vLimite = new Array(data.length).fill(50);
            this.maxPoint = 100; 
        }

        let _hours = hours
       
        hours = moment(new Date().setHours(hours)).subtract(12, 'hours').format('HH'); 

        for (let i = 0; i < data.length; i++) {
            this.days.push(moment(new Date().setHours(hours)).add(i, 'hours').format('HH')+':00')
        }

        let today;
        if(this.days.length < parseInt(_hours)) {
            today = this.days[this.days.length-1];
        } else {
            today = `${moment(new Date().setHours(hours)).subtract(12, 'hours').format('HH')}:00`;
        }

        new Chart(this.canvas, {
            type: 'line',
            data: {
                labels: this.days,
                datasets: [
                    {
                        label: this.polluant + " Mesures" + " (µg/m³)",
                        borderColor: 'rgba(54, 54, 54, 0.7)',
                        fill: false,
                        data: data,
                    },
                    {
                        label: this.polluant + " Valeur limite" + " (µg/m³)",
                        fill: false,
                        backgroundColor: "red",
                        borderColor: "red",
                        data: this.vLimite,
                        pointRadius: 0,
                        borderDash: [10,5],
                    },
                ]
            },
            options: {
                annotation: {
                    annotations: [
                        {
                            drawTime: "afterDatasetsDraw",
                            type: "line",
                            mode: "vertical",
                            scaleID: "x-axis-0",
                            value: today,
                            borderWidth: 2,
                            borderColor: "red",
                            label: {
                              content: today,
                              enabled: true,
                              position: "top"
                            }
                        }
                    ]
                  },
                responsive: true,
                title: {
                    fontSize: 20,
                    display: true,
                    text: 'Evolution des max horaires journaliers en ' + this.polluant + ' (µg/m³)'
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: this.maxPoint
                        }
                    }],
                    xAxes: [{
                        gridLines: {
                            color: "rgba(0, 0, 0, 0)",
                        }
                    }]
                },
                legend: {
                    position: 'bottom',
                    display: true, 
                    labels: {
                        fontSize: 10,
                        boxHeight: 2
                    },                
                },
            }
        });      
    }

    /**
     * 
     * @param {array} data la data est récupérée et retournée sous forme de tableau via la @function getMesuresHoraire() dans le fichier map.js
     * @param {datetime} hours
     */
    drawMesureHoraire(data, hours) {
        if(this.polluant == "O3") {
            this.vLimite = new Array(data.length).fill(180);
            this.maxPoint = 360; 
        } else if(this.polluant == "NO2"){
            this.vLimite = new Array(data.length).fill(200);
            this.maxPoint = 400; 
        } else {
            this.vLimite = new Array(data.length).fill(50);
            this.maxPoint = 100; 
        }

        for (let i in data) {
            this.days.push(moment(new Date().setHours(hours)).add(i, 'hours').format('HH')+':00')
        }

        new Chart(this.canvas, {
            type: 'line',
            data: {
                labels: this.days,
                datasets: [
                    {
                        label: this.polluant + " Mesures (µg/m³)",
                        borderColor: 'rgba(54, 54, 54, 0.7)',
                        fill: false,
                        data: data,
                    },
                    {
                        label: this.polluant + " Valeur limite (µg/m³)",
                        fill: false,
                        backgroundColor: "red",
                        borderColor: "red",
                        data: this.vLimite,
                        pointRadius: 0,
                        borderDash: [10,5],
                    },
                    
                ]
            },
            options: {
                responsive: true,
                title: {
                    fontSize: 20,
                    display: true,
                    text: 'Evolution des max horaires journaliers en ' + this.polluant + ' (µg/m³)'
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: this.maxPoint
                        }
                    }],
                    xAxes: [{
                        gridLines: {
                            color: "rgba(0, 0, 0, 0)",
                        }
                    }]
                },
                legend: {
                    position: 'bottom',
                    display: true, 
                    labels: {
                        fontSize: 10,
                        boxHeight: 2
                    },                
                },
            }
        });      
    }
   
    toTimestamp(strDate) {
        return (Date.parse(strDate)/1000);
    }
}


