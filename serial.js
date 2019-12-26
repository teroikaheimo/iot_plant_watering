const db = require("./src/database");
const config = require("./config");
const portName = config.arduino.port;
const SerialPort = require("serialport");
const Delimiter = require("@serialport/parser-delimiter");
const port = new SerialPort(portName, {baudRate: 115200}, false);

var device = {available: false};
var responseQueue = [];

dataModel = {
    id_plant_data: 0,
    timestamp: "2019-10-28T19:06:53.000Z",
    temperature: 12.54,
    light: 24.89,
    water_level: 80.45
};

port.open(function (error) {
    if (error && error !== "Error: Port is opening") {
        console.log("failed to open: " + error);
    } else {
        console.log("Serial port opened " + portName);

        port.on("error", function (data) {
            console.log("SerialPort Error: " + data);
        });
    }
});
port.on('open', () => {
    console.log("Serial port is open.");
    device.available = true;
});
port.on('close', () => {
    console.log("Serial port is closed.");
    device.available = false;
});
port.on('error', function (err) {
    console.log('Error: ', err.message)
});
const parser = port.pipe(new Delimiter({delimiter: '\n'}));

//// READ
// Actively listen for data coming from serial port
parser.on('data', data => {
    x = data.toString("utf-8");
    // Serves the requests made from the client that need values from arduino
    if (responseQueue.length > 0) {
        // get the first request off the queue
        let res = responseQueue.shift();

        if (x.indexOf("Watering Started!") !== -1) {
            // IF arduino gives OK as response. Send that to the client.
            res.status(200).send();
        } else if (x.indexOf("MANtemp") !== -1) {
            // IF MANUAL sensor reading has been requested. Send response in standard format in JSON
            let arr = getValuesFromString(x);
            dataModel.timestamp = getTimestamp();
            dataModel.temperature = arr[0];
            dataModel.light = arr[1];
            dataModel.water_level = arr[2];
            res.status(200).send(JSON.stringify([dataModel]));
        } else {
            res.status(202).send();
        }
    }

    // IF serial prints AUTOMATIC readings it will save them to the database
    if (x.slice(0, 3) === "AUT") {
        let arr = getValuesFromString(x);
        // Timestamp the measurement
        let timeStamp = getTimestamp();

        db.query("INSERT INTO plant_data (timestamp, temperature, light, water_level) VALUES (?,?,?,?)",
            [timeStamp, arr[0], arr[1], arr[2]])
            .catch((err) => {
                console.log("Adding data to database failed:", err)
            });
    }
});


function getTimestamp() {
    let tmpTimestamp = new Date();
    tmpTimestamp.setHours(tmpTimestamp.getHours() + 2);
    return tmpTimestamp.toISOString().slice(0, 19).replace('T', ' ');
}

function getValuesFromString(x) {
    // Chop out unnecessary chars
    let val = x.slice(3, x.length - 2);

    // Separate values to their own array
    let arr = val.split(",");
    for (let i = 0; i < arr.length; i++) {
        arr[i] = arr[i].split(":")[1];
    }
    return arr;
}


//// WRITE
// Server receives two types of data from serial
// Watering Success message that is sent to client and sensor data that is sent to database.

// sends data to the connected device via serial port
function writeAndDrain(data, callback) {
    // Flush discards data that has been received but not read.
    port.flush();

    // write/send data to serial port
    port.write(data, function (error) {
        if (error) {
            console.log("ERROR: ", error);
        } else {
            // Wait until all output data is transmitted to the serial port. Then execute the callback
            port.drain(callback);
        }
    });
}

module.exports = {
    write: writeAndDrain,
    responseQueue: responseQueue,
    device: device
};
