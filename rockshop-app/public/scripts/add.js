// add.js — handles form submission for adding a new receipt

document
  .getElementById("add-mineral-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // Convert numeric fields to numbers (or 0)
    [
      "bulk_cost_payed",
      "cost_kg",
      "total_kg",
      "retail_kg",
      "cost_pp",
      "total_pp",
      "retail_pp",
    ].forEach((field) => {
      const raw = payload[field];
      payload[field] = raw === undefined || raw === "" ? 0 : Number(raw);
    });

    try {
      const res = await fetch("/receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Receipt added!");
        form.reset();
      } else {
        const text = await res.text();
        alert("Error adding receipt: " + text);
      }
    } catch (err) {
      console.error("Error adding receipt:", err);
      alert("Error adding receipt: " + err.message);
    }
  });