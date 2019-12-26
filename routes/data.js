const express = require("express");
const router = express.Router();
const db = require("../src/database");


// Timestamp format 2019-10-28 22:06:53
router.get("/new/:timestamp", (req, res) => {
  let timestamp = req.params.timestamp;
  db.query(
    `SELECT * FROM plant_data WHERE timestamp > ?;`
    , [timestamp]).then((rows) => {
      if (rows.length < 1) {
          res.sendStatus(204);
      } else {
          if (!Array.isArray(rows)) {
              res.send([rows]);
              return;
          }
          res.send(rows);
      }
  }).catch((err) => {
      console.log("Requesting newest failed");
      res.status(500).send();
  });
});

router.get("/", (req, res) => {
    db.query(`SELECT *
              FROM plant_data
              ORDER BY timestamp ASC`, [])
        .then(rows => {
            if (rows.length < 1) {
                res.status(204).send();
            } else {
                if (!Array.isArray(rows)) {
                    res.send([rows]);
                    return;
                }
                res.send(rows);
            }
        })
        .catch(err => {
            console.log("Requesting ALL failed");
            res.status(500).send();
        });
});


module.exports = router;
