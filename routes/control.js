const express = require("express");
const router = express.Router();
const write = require("../serial").write;
const responseQueue = require("../serial").responseQueue;
let device = require("../serial").device;



router.post("/", (req, res) => {
  console.log("REQUEST TO WATER");
  if (device.available) {
    write("wateringON!", () => {
      responseQueue.push(res);
    });
  } else {
    res.status(202).send();
  }
});

// Get the current reading from Arduino
router.get("/print/", (req, res) => {
  console.log("REQUEST TO PRINT");
  if (device.available) {
    write("Print Values!", () => {
      responseQueue.push(res);
    });
  } else {
    res.status(202).send();
  }

});
module.exports = router;
