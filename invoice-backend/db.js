const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "productsdb",
  password: "admin12",   //  postgres password 
  port: 5432,
});

module.exports = pool;

