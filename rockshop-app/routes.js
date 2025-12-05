const { Pool } = require("pg");
const path = require("path");

require('dotenv').config();

const pool = new Pool({
  user: process.env.MRUSER,
  host: "db",
  database: process.env.MRDATABASE,
  password: process.env.MRPASSWORD,
  port: 5432,
});

exports.getMinerals = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM minerals ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching minerals:", err);
    res.status(500).send("Error fetching data");
  }
};

exports.addMineral = async (req, res) => {
  const { name, price, amount, weight } = req.body;
  const photo = req.file ? req.file.filename : null;

  try {
    await pool.query(
      "INSERT INTO minerals (name, price, amount, weight, photo) VALUES ($1, $2, $3, $4, $5)",
      [name, price, amount, weight, photo]
    );
    res.status(201).send("Mineral added");
  } catch (err) {
    console.error("Error adding mineral:", err);
    res.status(500).send("Error adding mineral");
  }
};

exports.deleteMineral = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM minerals WHERE id = $1", [id]);
    res.send("Deleted");
  } catch (err) {
    console.error("Error deleting mineral:", err);
    res.status(500).send("Error deleting mineral");
  }
};

exports.updateMineral = async (req, res) => {
  const { id } = req.params;
  const { name, price, amount, weight } = req.body;

  try {
    await pool.query(
      "UPDATE minerals SET name = $1, price = $2, amount = $3, weight = $4 WHERE id = $5",
      [name, price, amount, weight, id]
    );
    res.send("Mineral updated");
  } catch (err) {
    console.error("Error updating mineral:", err);
    res.status(500).send("Error updating mineral");
  }
};