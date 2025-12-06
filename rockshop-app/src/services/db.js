const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.MRUSER,
  host: "db",
  database: process.env.MRDATABASE,
  password: process.env.MRPASSWORD,
  port: 5432,
});

module.exports = { pool };