export default class chartDrawing {

    constructor(polluant, canvas) {
        this.polluant = polluant;
        this.canvas = canvas;
        this.moment = require('moment');
        this.newDate = new Date(); 
        this.newDate.setMinutes('0');               
        this.days = new Array();
        this.vLimite;
        this.maxPoint;
    
        if(window.innerWidth <= 1200) {
          this.gradient = 'rgb(0, 204, 170)';
        } else {
          this.gradient = this.canvas.createLinearGradient(234, 200, 234, 468);        
          this.gradient.addColorStop(0, 'rgb(255, 0, 0)'); 
          this.gradient.addColorStop(0.2, 'rgb(255, 170, 0)');
          this.gradient.addColorStop(0.4, 'rgb(255, 255, 0)');   
          this.gradient.addColorStop(0.6, 'rgb(153, 230, 0)');
          this.gradient.addColorStop(0.8, 'rgb(0, 204, 170)');
          this.gradient.addColorStop(1, 'rgb(0, 204, 170)');
        }
    }

    drawMesureHoraire(data, hours) {
        if(this.polluant == "O3") {
            this.vLimite = new Array(data.length).fill(180);
            this.maxPoint = 360; // 180
        } else if(this.polluant == "NO2"){
            this.vLimite = new Array(data.length).fill(200);
            this.maxPoint = 400; // 200
        } else {
            this.vLimite = new Array(data.length).fill(100);
            this.maxPoint = 200; // 50
        }

        let _hours = hours
       
        hours = this.moment(new Date().setHours(hours)).subtract(12, 'hours').format('HH'); 

        for (let i = 0; i < data.length; i++) {
            this.days.push(this.moment(new Date().setHours(hours)).add(i, 'hours').format('HH')+':00')
        }

        let today;
        if(this.days.length < parseInt(_hours)) {
            today = this.days[this.days.length-1];
        } else {
            today = `${this.moment(new Date().setHours(hours)).subtract(12, 'hours').format('HH')}:00`;
        }

        let chart = new Chart(this.canvas, {
            type: 'line',
            data: {
                labels: this.days,
                datasets: [
                    {
                        label: this.polluant + " Mesures",
                        borderColor: this.gradient,
                        fill: false,
                        data: data,
                    },
                    {
                        label: this.polluant + " Valeur limite",
                        fill: false,
                        backgroundColor: "red",
                        borderColor: "red",
                        data: this.vLimite,
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
                            borderWidth: 5,
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
                    text: 'Evolution des max horaires journaliers en ' + this.polluant
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
                    labels: {fontSize: 10},                
                },
            }
        });      
    }

    drawMesureMax(data) {

        this.vLimite = [350, 350, 350, 350, 350, 350, 350, 350];
        this.maxPoint = 700;
        this.newDate.setDate((this.newDate.getDate()-8));

        for(let i = 0; i < 8; i++) {                              
            const date = this.moment(this.newDate).add(i, 'days').format('DD/MM/YYYY'); 
            this.days.push(date);
        }

        new Chart(this.canvas, {
            type: 'line',
            data: {
                labels: this.days,
                datasets: [
                    {
                        label: this.polluant + " Mesures",
                        borderColor: this.gradient,
                        fill: false,
                        data: data,
                    },
                    {
                        label: this.polluant + " Valeur limite",
                        fill: false,
                        backgroundColor: "red",
                        borderColor: "red",
                        data: this.vLimite,
                    },
                ]
            },
            options: {
                responsive: true,
                title: {
                    fontSize: 20,
                    display: true,
                    text: 'Evolution des max horaires journaliers en ' + this.polluant
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: this.maxPoint
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
    }

    drawMesureMoyAndPrevi(data, previsionData) {
        this.vLimite = [50, 50, 50, 50, 50, 50, 50, 50];
        this.maxPoint = 100;

        for(let i = -5; i < 3; i++) {   
            const date = this.moment(this.newDate).add(i, 'days').format('DD/MM/YYYY'); 
            this.days.push(date);
        }

        previsionData.unshift(data[data.length-1]);
    
        for(let u = 0; u < 4; u++) {
            previsionData.unshift(null);
        }

        new Chart(this.canvas, {
            type: 'line',
            data: {
                labels: this.days,
                datasets: [
                    {
                        label: this.polluant + " Mesures",
                        borderColor: this.gradient,
                        fill: false,
                        data: data,
                    },
                    {
                        label: this.polluant + " Prévisions",
                        borderColor: this.gradient,
                        borderDash: [10,5],
                        fill: false,
                        data:  previsionData,
                    },
                    {
                        label: this.polluant + " Valeur limite",
                        fill: false,
                        backgroundColor: "red",
                        borderColor: "red",
                        data: this.vLimite,
                    },
                ]
            },
            options: {
                responsive: true,
                title: {
                    fontSize: 20,
                    display: true,
                    text: 'Evolution des moyennes journalières en ' + this.polluant
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: this.maxPoint
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
    }

    async drawUsersMesures(username, date) {
        
        if(this.polluant == "O3") {
            this.vLimite = [180, 180, 180, 180, 180, 180, 180, 180];
            this.maxPoint = 360;
        } else if(this.polluant == "NO2") {
            this.vLimite = [200, 200, 200, 200, 200, 200, 200, 200];
            this.maxPoint = 400;
        } else if(this.polluant == "PM10") {
            this.vLimite = [50, 50, 50, 50, 50, 50, 50, 50];
            this.maxPoint = 100;
        } else if(this.polluant == "PM25"){
            this.vLimite = [25, 25, 25, 25, 25, 25, 25, 25];
            this.maxPoint = 50;
        } else {
            this.vLimite = [350, 350, 350, 350, 350, 350, 350, 350];
            this.maxPoint = 700;
        }
        
        let response = await fetch(`uploads/users_mesures/${username}_mesures.json`);
    
        let data = await response.json();

        for(let i in data.values) {
            const newDate = this.moment(new Date(date)).add(i, 'days').format('DD/MM/YYYY'); 
            this.days.push(newDate);
        }

        new Chart(this.canvas, {
            type: 'line',
            data: {
                labels: this.days,
                datasets: [
                    {
                        label: this.polluant + " Mesures",
                        borderColor: this.gradient,
                        fill: false,
                        data: data.values,
                    },
                    {
                        label: this.polluant + " Valeur limite",
                        fill: false,
                        backgroundColor: "red",
                        borderColor: "red",
                        data: this.vLimite,
                    },
                ]
            },
            options: {
                responsive: true,
                title: {
                    fontSize: 20,
                    display: true,
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: this.maxPoint
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
    }

    drawBoatEmissions() {
        new Chart(this.canvas, {
            type: 'bar',
            data: {
                labels: ['h-2', 'h-1', 'h-0'],
                datasets: [
                    {
                        label: "émissions",
                        fill: true,
                        borderColor: 'rgb(107, 186, 98)',
                        borderWidth: 1,
                        hoverBorderWidth: 2,
                        hoverBackgroundColor: 'rgba(107, 186, 98, 0.4)',
                        backgroundColor: 'rgba(107, 186, 98, 0.3)',
                        data: [75.2, 48.6, 20.8],
                    },
                ]
            },
            options: {
                responsive: true,
                title: {
                    fontSize: 20,
                    display: true,
                    text: 'Evolution des émissions :'
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: 150
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
    }

    toTimestamp(strDate) {
        return (Date.parse(strDate)/1000);
    }
}


