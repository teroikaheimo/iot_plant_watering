module.exports = {
  //MySQL DB pool settings
  connectionLimit: 200,
  host: "localhost",
  user: "api",
  password: "!#apiPASS",
  database: "iot",
  timezone: "+00:00"
};
/*
module.exports = { //MySQL DB pool settings
  connectionLimit: 200,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  timezone: "+00:00",
};
*/
