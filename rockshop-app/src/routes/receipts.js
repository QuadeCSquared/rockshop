const { pool } = require("../services/db");

exports.getReceipts = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM receipts ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching receipts:", err);
    res.status(500).send("Error fetching receipts");
  }
};

/**
 * POST /receipts
 * Creates a new receipt.
 */
exports.addReceipt = async (req, res) => {
  try {
    const {
      wholeseller,
      specimen,
      bulk_cost_payed,
      cost_kg,
      total_kg,
      retail_kg,
      cost_pp,
      total_pp,
      retail_pp,
    } = req.body;

    const query = `
      INSERT INTO receipts
        (wholeseller, specimen, bulk_cost_payed, cost_kg, total_kg, retail_kg, cost_pp, total_pp, retail_pp)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      wholeseller || "default",
      specimen || "default",
      bulk_cost_payed === undefined || bulk_cost_payed === "" ? 0 : Number(bulk_cost_payed),
      cost_kg === undefined || cost_kg === "" ? 0 : Number(cost_kg),
      total_kg === undefined || total_kg === "" ? 0 : Number(total_kg),
      retail_kg === undefined || retail_kg === "" ? 0 : Number(retail_kg),
      cost_pp === undefined || cost_pp === "" ? 0 : Number(cost_pp),
      total_pp === undefined || total_pp === "" ? 0 : Number(total_pp),
      retail_pp === undefined || retail_pp === "" ? 0 : Number(retail_pp),
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding receipt:", err);
    res.status(500).send("Error adding receipt");
  }
};

/**
 * PUT /receipts/:id
 * Updates an existing receipt.
 */
exports.updateReceipt = async (req, res) => {
  const { id } = req.params;
  const {
    wholeseller,
    specimen,
    bulk_cost_payed,
    cost_kg,
    total_kg,
    retail_kg,
    cost_pp,
    total_pp,
    retail_pp,
  } = req.body;

  try {
    const query = `
      UPDATE receipts
      SET
        wholeseller = $1,
        specimen = $2,
        bulk_cost_payed = $3,
        cost_kg = $4,
        total_kg = $5,
        retail_kg = $6,
        cost_pp = $7,
        total_pp = $8,
        retail_pp = $9
      WHERE id = $10
      RETURNING *;
    `;

    const values = [
      wholeseller || "default",
      specimen || "default",
      bulk_cost_payed === undefined || bulk_cost_payed === "" ? 0 : Number(bulk_cost_payed),
      cost_kg === undefined || cost_kg === "" ? 0 : Number(cost_kg),
      total_kg === undefined || total_kg === "" ? 0 : Number(total_kg),
      retail_kg === undefined || retail_kg === "" ? 0 : Number(retail_kg),
      cost_pp === undefined || cost_pp === "" ? 0 : Number(cost_pp),
      total_pp === undefined || total_pp === "" ? 0 : Number(total_pp),
      retail_pp === undefined || retail_pp === "" ? 0 : Number(retail_pp),
      id,
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).send("Receipt not found");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating receipt:", err);
    res.status(500).send("Error updating receipt");
  }
};

/**
 * DELETE /receipts/:id
 * Deletes a receipt.
 */
exports.deleteReceipt = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM receipts WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).send("Receipt not found");
    }

    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting receipt:", err);
    res.status(500).send("Error deleting receipt");
  }
};

// Export pool in case other modules need DB access later.
exports.pool = pool;