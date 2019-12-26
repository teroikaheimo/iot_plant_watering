const mysql = require("mysql");
const config = require("../src/connection");

class Database { // Wrapper for mysql to get promises.
  constructor(conf) {
    this.connection = mysql.createPool(conf);
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.connection.releaseConnection((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
}
const databaseConnectionPool = new Database(config);
module.exports = databaseConnectionPool;
