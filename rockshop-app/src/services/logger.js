// src/services/logger.js
const { pool } = require("./db");

/**
 * Logs actions taken on receipts.
 * @param {number} receiptId
 * @param {"ADD"|"UPDATE"|"DELETE"|"SOLD"} action
 * @param {string} message
 */
async function logAction(receiptId, action, message = "") {
  try {
    await pool.query(
      `INSERT INTO logs (receipt_id, action, message)
       VALUES ($1, $2, $3)`,
      [receiptId, action, message]
    );
  } catch (err) {
    console.error("Failed to write log:", err);
  }
}

module.exports = { logAction };