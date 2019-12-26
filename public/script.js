var config = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Water',
            data: [],
            borderColor: window.chartColors.blue,
            fill: false
        },
        {
            label: 'Temperature',
            data: [],
            borderColor: window.chartColors.red,
            fill: false
        },
        {
            label: 'Light',
            data: [],
            borderColor: window.chartColors.yellow,
            fill: false
        },
        {
            label: 'Moisture',
            data: [],
            borderColor: window.chartColors.purple,
            fill: false
        }
        ]
    },
    options: {
        responsive: true,
        title: {
            display: true,
            text: 'Chart.js Line Chart'
        },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Timestamp'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Value'
                }
            }]
        }
    }
};

// Available addresses
const ipv6Address = "[fe80::327f:e902:348d:2ce2]:7778";
const localhostAddress = "http://localhost:7778";

// Address in use
const address = ipv6Address;

// 20 minutes in milliseconds
const intervalTime = 1000*60*20;

// Last timestamp
var lastTimestamp;
var lastIndex;

// Commands
const getAll = "/v1/data/";
const getCurrentMeasurement = "/v1/control/print/";
var getNewerMeasurements = "/v1/data/new/2019-11-05 22:06:53";
const startWatering = "/v1/control/";

function deleteAll() {
    while (config.data.labels.length > 0) {
        config.data.labels.pop();
        config.data.datasets[0].data.pop();
        config.data.datasets[1].data.pop();
        config.data.datasets[2].data.pop();
        config.data.datasets[3].data.pop();
    }
}

function getFromArray(obj) {
    config.data.labels.push(obj.timestamp);
    config.data.datasets[0].data.push(obj.water_level);
    config.data.datasets[1].data.push(obj.temperature);
    config.data.datasets[2].data.push(obj.light);
    config.data.datasets[3].data.push(obj.moisture);
}

function getNewer() {
    $.get(address + getNewerMeasurements, function (data, status) {
        sortArray(data);
        window.myLine.update();

        lastIndex = config.data.labels.length-1;
        lastTimestamp = config.data.labels[lastIndex];
        getNewerMeasurements = "/v1/data/new/"+lastTimestamp;
    });
}

function sortArray(newMeasurements) {
    let array1 = [];
    let array2 = [];
    for(let i = 0; i < config.data.labels.length; i++) {
        array1[i] = new Date(config.data.labels[i]);
    }
    for(let i = 0; i < newMeasurements.length; i++) {
        array2[i] = new Date(newMeasurements[i].timestamp);
    }
    for(let i = 0; i < array2.length; i++) {
        for(let j = 0; i < array1.length; i++) {
            if (array2[i] > array1[j]) {
                config.data.labels.splice(j,0,newMeasurements[i].timestamp);
                config.data.datasets[0].data.splice(j,0,newMeasurements[i].water_level);
                config.data.datasets[1].data.splice(j,0,newMeasurements[i].temperature);
                config.data.datasets[2].data.splice(j,0,newMeasurements[i].light);
                config.data.datasets[3].data.splice(j,0,newMeasurements[i].moisture);
            }
        }
    }
}

$(document).ready(function () {

    // Get newer measurements every 20 minutes
    setInterval(getNewer, intervalTime);

    // Chart
    var ctx = document.getElementById('canvas').getContext('2d');
    window.myLine = new Chart(ctx, config);

    // Removes and gets all data
    $("#getAll").click(function () {
        deleteAll();
        $.get(address + getAll, function (data, status) {
            data.forEach(getFromArray);
            window.myLine.update();

            lastIndex = config.data.labels.length-1;
            lastTimestamp = config.data.labels[lastIndex];
            getNewerMeasurements = "/v1/data/new/"+lastTimestamp;
        });
    });

    // Get current measurement from sensors
    $("#getCurrent").click(function () {
        $.post(address + getCurrentMeasurement, function (data, status) {
            data.forEach(getFromArray);
            window.myLine.update();
        });
    });

    // Get newer measurements compared to databases last timestamp
    $("#getNewer").click(function () {
        getNewer();
    });

    // Start watering
    $("#watering").click(function () {
        $.post(address + startWatering, function (data, status, xhr) {
            if (xhr.status == 200) {
                alert("Watering succeeded");
            } else if (xhr.status == 202) {
                alert("Watering failed");
            }
        });
    });

});