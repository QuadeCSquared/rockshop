// public/scripts/add.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-form");
  const typeSelect = document.getElementById("type-select");
  const statusDiv = document.getElementById("add-status");

  const kgSection = document.getElementById("kg-section");
  const ppSection = document.getElementById("pp-section");

  // Toggle sections
  typeSelect.addEventListener("change", () => {
    if (typeSelect.value === "kg") {
      kgSection.style.display = "";
      ppSection.style.display = "none";
    } else {
      kgSection.style.display = "none";
      ppSection.style.display = "";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Create payload with all fields (unused ones become 0)
    const payload = {
      wholeseller: document.getElementById("wholeseller").value,
      specimen: document.getElementById("specimen").value,
      bulk_cost_payed: Number(document.getElementById("bulk_cost_payed").value) || 0,

      cost_kg: Number(document.getElementById("cost_kg").value) || 0,
      total_kg: Number(document.getElementById("total_kg").value) || 0,
      retail_kg: Number(document.getElementById("retail_kg").value) || 0,

      cost_pp: Number(document.getElementById("cost_pp").value) || 0,
      total_pp: Number(document.getElementById("total_pp").value) || 0,
      retail_pp: Number(document.getElementById("retail_pp").value) || 0,
    };

    try {
      const res = await fetch("/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Server rejected the receipt");

      form.reset();
      statusDiv.className = "text-success";
      statusDiv.textContent = "Receipt added successfully!";

    } catch (err) {
      console.error("Error adding receipt:", err);
      statusDiv.className = "text-danger";
      statusDiv.textContent = "Error adding receipt.";
    }
  });
});