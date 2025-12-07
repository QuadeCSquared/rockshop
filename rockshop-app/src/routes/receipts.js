const { pool } = require("../services/db");
const { logAction } = require("../services/logger"); // adjust path as needed

exports.getReceipts = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM receipts ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching receipts:", err);
    res.status(500).send("Error fetching receipts");
  }
};

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
    const newRow = result.rows[0];

    await logAction(newRow.id, "ADD", `Added receipt for ${newRow.specimen}`);

    res.status(201).json(newRow);
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

    await logAction(id, "UPDATE", `Updated receipt ${id}`);

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

    await logAction(id, "DELETE", `Deleted receipt ${id}`);

    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting receipt:", err);
    res.status(500).send("Error deleting receipt");
  }
};

exports.markSold = async (req, res) => {
  const { id } = req.params;

  try {
    // You can store sold=true in DB, or skip this if you don't track sold-state
    await logAction(id, "SOLD", `Receipt ${id} marked as sold`);

    res.json({ message: `Receipt ${id} marked as sold.` });
  } catch (err) {
    console.error("Error marking sold:", err);
    res.status(500).send("Error marking as sold");
  }
};

exports.getLogs = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM logs ORDER BY created_at DESC LIMIT 200"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error loading logs:", err);
    res.status(500).send("Error loading logs");
  }
};

exports.markSold = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE receipts
       SET sold = TRUE
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Receipt not found");
    }

    await logAction(id, "SOLD", `Receipt ${id} marked as sold`);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error marking sold:", err);
    res.status(500).send("Error marking as sold");
  }
};

exports.markUnsold = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE receipts
       SET sold = FALSE
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Receipt not found");
    }

    await logAction(id, "RETURN", `Receipt ${id} returned to inventory`);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error marking unsold:", err);
    res.status(500).send("Error marking as unsold");
  }
};

// Export pool in case other modules need DB access later.
exports.pool = pool;