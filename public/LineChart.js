var LineChartColorsArray = ['rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(153, 102, 255)', 'rgb(201, 203, 207)'];

var url = {
    // IPv6 Example  base:"http://[fe80::327f:e902:348d:2ce2]:7778/v1",
    base: "http://localhost:7778/v1",
    getAll: () => url.base + "/data/",
    getLastThreeDays: () => url.base + "/data/new/",
    getCurrent: () => url.base + "/control/print",
    getLatest: () => url.base + "/data/new/",
    startWatering: () => url.base + "/control/"
};

var lastDatabaseResultTimestamp = "";
var statusMessage;

function newDataset(label, backgroundColor, borderColor, data) {
    var obj = {
        label: label,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        data: data,
        fill: false
    };
    return JSON.parse(JSON.stringify(obj));
}

var config = {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        responsive: true,
        title: {
            display: true,
            text: 'IOT-R4'
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

window.onload = function () {
    var ctx = document.getElementById('canvas').getContext('2d');
    window.myLine = new Chart(ctx, config);
    getLastThreeDays();
    statusMessage = document.getElementById("statusMessage");

    document.getElementById('btnGetAll').addEventListener('click', function () {
        getAll();
    });

    document.getElementById('btnGetLast3Days').addEventListener('click', function () {
        getLastThreeDays();
    });

    document.getElementById('btnGetCurrent').addEventListener('click', function () {
        getCurrent();
    });

    document.getElementById('btnGetLatest').addEventListener('click', function () {
        getLatest();
    });

    document.getElementById('btnStartWatering').addEventListener('click', function () {
        startWatering();
    });
};

//// QUERIES
function getAll() {
    $.get(url.getAll(), function (data, status, xhr) {
        if (xhr.status === 200) {
            buildAndSetDatasets(data);
            // Needed to query only the new measurement data from database
            lastDatabaseResultTimestamp = data[data.length - 1].timestamp;
        } else if (xhr.status === 204) {
            showStatusMessage("No Data to Fetch.");
        } else {
            showStatusMessage("Error fetching data from database!", 1);
        }
    });
    window.myLine.update();
}

function getLastThreeDays() {
    var date = getDayFrom3DaysAgo();
    $.get(url.getLastThreeDays() + date, function (data, status) {
        if (status === 'success') {
            buildAndSetDatasets(data);
            // Needed to query only the new measurement data from database
            lastDatabaseResultTimestamp = data[data.length - 1].timestamp;
        } else if (status === 'nocontent') {
            showStatusMessage("There is not data from last 3 days");
            showStatusMessage("Getting all data...");
            getAll();
        } else {
            showStatusMessage("Get Last 3 Days Fail");
        }
    });
    window.myLine.update();
}

function getDayFrom3DaysAgo() {
    var today = new Date();
    today.setDate(today.getDate() - 3);
    today.setHours(today.getHours() + 2);
    return today.toISOString().slice(0, 19).replace('T', ' ');
}

function getCurrent() {
    $.get(url.getCurrent(), function (data, status, xhr) {
        if (xhr.status === 202) {
            showStatusMessage("Device not responding", 1);
        } else {
            showStatusMessage("New values received");
            var current = JSON.parse(data)[0];
            config.data.labels.push(current.timestamp);
            config.data.datasets[0].data.push(current.temperature);
            config.data.datasets[1].data.push(current.light);
            config.data.datasets[2].data.push(current.water_level);
            window.myLine.update();
        }
    });
}

function getLatest() {
    $.get(url.getLatest() + lastDatabaseResultTimestamp, function (data, status, xhr) {
        if (xhr.status === 200) {
            var parsedDates = [];
            var newParsedDates = [];
            formatDates(data);
            // Parse timestamps to dates for sorting
            for (let i = 0; i < config.data.labels.length; i++) {
                parsedDates[i] = new Date(config.data.labels[i]);
            }
            // Parse new timestamps for sorting
            for (let i = 0; i < data.length; i++) {
                newParsedDates[i] = new Date(data[i].timestamp);
            }
            // Find places to add the new measurements
            let item = {};
            for (let i = 0; i < parsedDates.length; i++) {
                if (parsedDates[i] > newParsedDates[0]) {
                    newParsedDates.shift();
                    item = data.shift();
                    config.data.labels.splice(i, 0, item.timestamp);
                    config.data.datasets[0].data.splice(i, 0, item.temperature);
                    config.data.datasets[1].data.splice(i, 0, item.light);
                    config.data.datasets[2].data.splice(i, 0, item.water_level);
                } else if (i === parsedDates.length - 1) {
                    for (let j = 0; j < newParsedDates.length; j++) {
                        newParsedDates.shift();
                        item = data.shift();
                        config.data.labels.push(item.timestamp);
                        config.data.datasets[0].data.push(item.temperature);
                        config.data.datasets[1].data.push(item.light);
                        config.data.datasets[2].data.push(item.water_level);
                    }
                }
                if (newParsedDates.length < 1) break;
            }
            lastDatabaseResultTimestamp = item.timestamp;
            window.myLine.update();

        } else if (xhr.status === 204) {
            showStatusMessage("Already got the latest results");
        } else {
            showStatusMessage("Error fetching data", 1);
        }
    });
}

function startWatering() {
    $.post(url.startWatering(), function (data, status, xhr) {
        if (xhr.status === 200) {
            showStatusMessage("Watering Started");
        } else {
            showStatusMessage("Watering Failed!", 1);
        }
    })
}

//// STATUS MESSAGES
function showStatusMessage(message, error) {
    error = error || false;


    var newDiv = document.createElement("div");
    var dateTimeNow = new Date();
    message = message + " " + dateTimeNow.getHours() + ":" + dateTimeNow.getMinutes() + ":" + dateTimeNow.getSeconds();
    var newText = document.createTextNode(message);
    newDiv.append(newText);
    if (error) {
        newDiv.style.color = "red";
    }
    statusMessage.append(newDiv);
    setTimeout(statusMessageEraser, 10000, newDiv);

}

function statusMessageEraser(element) {
    statusMessage.removeChild(element)
}

//// DATASET
function buildDatasets(titles) {
    var tmpDatasets = [];
    for (var i = 0; i < titles.length; i++) {
        tmpDatasets[i] = newDataset(titles[i], LineChartColorsArray[i], LineChartColorsArray[i], []);
    }
    return tmpDatasets;
}

function getDataTitles(data) {
    var notAcceptedTitles = ['id_plant_data', 'timestamp'];
    var titles = [];
    var i = 0;
    for (var key in data[0]) {
        if (!notAcceptedTitles.includes(key)) {
            titles.push(key);
        }
        i++;
    }
    return titles;
}

function setDataForDatasets(datasets, data) {
    for (var i = 0; i < data.length; i++) {
        // Data
        datasets[0].data.push(data[i].temperature);
        datasets[1].data.push(data[i].light);
        datasets[2].data.push(data[i].water_level);

        // Labels
        config.data.labels.push(data[i].timestamp);
    }
    config.data.datasets = datasets;
}

function clearOldData() {
    config.data.labels = [];
    config.data.datasets = [];
}

function buildAndSetDatasets(data) {
    formatDates(data);
    var titles = getDataTitles(data);
    var tmpDatasets = buildDatasets(titles);
    clearOldData();
    setDataForDatasets(tmpDatasets, data);
    window.myLine.update();
}

function formatDates(data) {
    data.forEach(item => {
        item.timestamp = item.timestamp.slice(0, 19).replace('T', ' ');
    })
}
