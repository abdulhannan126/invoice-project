const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "productdb",
  password: "admin",   // yahan apna postgres password likho
  port: 5432,
});

module.exports = pool;