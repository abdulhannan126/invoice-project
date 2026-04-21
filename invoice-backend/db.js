const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "productsdb",
  password: "admin12",   // yahan apna postgres password likho
  port: 5432,
});

module.exports = pool;