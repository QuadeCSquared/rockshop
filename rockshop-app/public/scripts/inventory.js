// public/scripts/inventory.js

document.addEventListener("DOMContentLoaded", () => {
  const fetchBtn = document.getElementById("fetch-receipts");
  const nameInput = document.getElementById("search-name");
  const viewSelect = document.getElementById("view-select");

  const kgSection = document.getElementById("kg-section");
  const ppSection = document.getElementById("pp-section");
  const combinedSection = document.getElementById("combined-section");
  const soldSection = document.getElementById("sold-section");

  const kgTbody = document.querySelector("#kg-table tbody");
  const ppTbody = document.querySelector("#pp-table tbody");
  const combinedTbody = document.querySelector("#combined-table tbody");
  const soldTbody = document.querySelector("#sold-table tbody");

  let allReceipts = [];

  // ---- VIEW MODE HANDLING ----
  function updateViewMode() {
    if (!viewSelect) return;

    const mode = viewSelect.value;

    if (kgSection) kgSection.style.display = mode === "kg" ? "" : "none";
    if (ppSection) ppSection.style.display = mode === "pp" ? "" : "none";
    if (combinedSection) combinedSection.style.display = mode === "combined" ? "" : "none";
    if (soldSection) soldSection.style.display = mode === "sold" ? "" : "none";
  }

  if (viewSelect) {
    viewSelect.addEventListener("change", updateViewMode);
  }

  // ---- LOAD RECEIPTS FROM API ----
  async function loadReceipts() {
    if (!kgTbody && !ppTbody && !combinedTbody && !soldTbody) return;

    try {
      const res = await fetch("/receipts");
      if (!res.ok) throw new Error("Failed to load receipts");

      allReceipts = await res.json();
      applyFiltersAndRender();
    } catch (err) {
      console.error("Error loading receipts:", err);
      const errRow8 =
        '<tr><td colspan="8" class="text-danger">Error loading receipts</td></tr>';
      const errRow11 =
        '<tr><td colspan="11" class="text-danger">Error loading receipts</td></tr>';

      if (kgTbody) kgTbody.innerHTML = errRow8;
      if (ppTbody) ppTbody.innerHTML = errRow8;
      if (combinedTbody) combinedTbody.innerHTML = errRow11;
      if (soldTbody) soldTbody.innerHTML = errRow11;
    }
  }

  // ---- FILTER + SPLIT LOGIC ----
  function applyFiltersAndRender() {
    if (!kgTbody && !ppTbody && !combinedTbody && !soldTbody) return;

    const nameFilter = (nameInput?.value || "").trim().toLowerCase();

    let filtered = allReceipts.slice();

    // Text filter
    if (nameFilter) {
      filtered = filtered.filter((r) => {
        const w = (r.wholeseller || "").toLowerCase();
        const s = (r.specimen || "").toLowerCase();
        return w.includes(nameFilter) || s.includes(nameFilter);
      });
    }

    const unsold = filtered.filter((r) => !r.sold);
    const sold = filtered.filter((r) => r.sold);

    // Among unsold, split into kg vs pp
    const kgItems = unsold.filter((r) => {
      return (
        Number(r.cost_kg || 0) !== 0 ||
        Number(r.total_kg || 0) !== 0 ||
        Number(r.retail_kg || 0) !== 0
      );
    });

    const ppItems = unsold.filter((r) => {
      return (
        Number(r.cost_pp || 0) !== 0 ||
        Number(r.total_pp || 0) !== 0 ||
        Number(r.retail_pp || 0) !== 0
      );
    });

    renderKgTable(kgItems);
    renderPpTable(ppItems);
    renderCombinedTable(unsold);
    renderSoldTable(sold);
  }

  // ---- RENDERING ----
  function renderKgTable(items) {
    if (!kgTbody) return;

    kgTbody.innerHTML = "";

    if (!items.length) {
      kgTbody.innerHTML =
        '<tr><td colspan="8" class="text-center">No kilogram items found</td></tr>';
      return;
    }

    items.forEach((r) => {
      const tr = document.createElement("tr");
      tr.dataset.id = r.id;

      tr.innerHTML = `
        <td>${r.id}</td>
        <td contenteditable="true" data-field="wholeseller">${r.wholeseller ?? ""}</td>
        <td contenteditable="true" data-field="specimen">${r.specimen ?? ""}</td>
        <td contenteditable="true" data-field="bulk_cost_payed">${r.bulk_cost_payed ?? 0}</td>
        <td contenteditable="true" data-field="cost_kg">${r.cost_kg ?? 0}</td>
        <td contenteditable="true" data-field="total_kg">${r.total_kg ?? 0}</td>
        <td contenteditable="true" data-field="retail_kg">${r.retail_kg ?? 0}</td>
        <td>
          <button class="btn btn-sm btn-success save-btn">Save</button>
          <button class="btn btn-sm btn-warning sold-btn">Sold</button>
          <button class="btn btn-sm btn-danger delete-btn">Delete</button>
        </td>
      `;

      attachRowHandlers(tr);
      kgTbody.appendChild(tr);
    });
  }

  function renderPpTable(items) {
    if (!ppTbody) return;

    ppTbody.innerHTML = "";

    if (!items.length) {
      ppTbody.innerHTML =
        '<tr><td colspan="8" class="text-center">No per-piece items found</td></tr>';
      return;
    }

    items.forEach((r) => {
      const tr = document.createElement("tr");
      tr.dataset.id = r.id;

      tr.innerHTML = `
        <td>${r.id}</td>
        <td contenteditable="true" data-field="wholeseller">${r.wholeseller ?? ""}</td>
        <td contenteditable="true" data-field="specimen">${r.specimen ?? ""}</td>
        <td contenteditable="true" data-field="bulk_cost_payed">${r.bulk_cost_payed ?? 0}</td>
        <td contenteditable="true" data-field="cost_pp">${r.cost_pp ?? 0}</td>
        <td contenteditable="true" data-field="total_pp">${r.total_pp ?? 0}</td>
        <td contenteditable="true" data-field="retail_pp">${r.retail_pp ?? 0}</td>
        <td>
          <button class="btn btn-sm btn-success save-btn">Save</button>
          <button class="btn btn-sm btn-warning sold-btn">Sold</button>
          <button class="btn btn-sm btn-danger delete-btn">Delete</button>
        </td>
      `;

      attachRowHandlers(tr);
      ppTbody.appendChild(tr);
    });
  }

  function renderCombinedTable(items) {
    if (!combinedTbody) return;

    combinedTbody.innerHTML = "";

    if (!items.length) {
      combinedTbody.innerHTML =
        '<tr><td colspan="11" class="text-center">No items found</td></tr>';
      return;
    }

    items.forEach((r) => {
      const tr = document.createElement("tr");
      tr.dataset.id = r.id;

      tr.innerHTML = `
        <td>${r.id}</td>
        <td contenteditable="true" data-field="wholeseller">${r.wholeseller ?? ""}</td>
        <td contenteditable="true" data-field="specimen">${r.specimen ?? ""}</td>
        <td contenteditable="true" data-field="bulk_cost_payed">${r.bulk_cost_payed ?? 0}</td>

        <td contenteditable="true" data-field="cost_kg">${r.cost_kg ?? 0}</td>
        <td contenteditable="true" data-field="total_kg">${r.total_kg ?? 0}</td>
        <td contenteditable="true" data-field="retail_kg">${r.retail_kg ?? 0}</td>

        <td contenteditable="true" data-field="cost_pp">${r.cost_pp ?? 0}</td>
        <td contenteditable="true" data-field="total_pp">${r.total_pp ?? 0}</td>
        <td contenteditable="true" data-field="retail_pp">${r.retail_pp ?? 0}</td>

        <td>
          <button class="btn btn-sm btn-success save-btn">Save</button>
          <button class="btn btn-sm btn-warning sold-btn">Sold</button>
          <button class="btn btn-sm btn-danger delete-btn">Delete</button>
        </td>
      `;

      attachRowHandlers(tr);
      combinedTbody.appendChild(tr);
    });
  }

  function renderSoldTable(items) {
    if (!soldTbody) return;

    soldTbody.innerHTML = "";

    if (!items.length) {
      soldTbody.innerHTML =
        '<tr><td colspan="11" class="text-center">No sold items</td></tr>';
      return;
    }

    items.forEach((r) => {
      const tr = document.createElement("tr");
      tr.dataset.id = r.id;

      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.wholeseller ?? ""}</td>
        <td>${r.specimen ?? ""}</td>
        <td>${r.bulk_cost_payed ?? 0}</td>

        <td>${r.cost_kg ?? 0}</td>
        <td>${r.total_kg ?? 0}</td>
        <td>${r.retail_kg ?? 0}</td>

        <td>${r.cost_pp ?? 0}</td>
        <td>${r.total_pp ?? 0}</td>
        <td>${r.retail_pp ?? 0}</td>

        <td>
          <button class="btn btn-sm btn-primary return-btn">Return</button>
          <button class="btn btn-sm btn-danger delete-btn">Delete</button>
        </td>
      `;


      const returnBtn = tr.querySelector(".return-btn");
      if (returnBtn) {
        returnBtn.addEventListener("click", () => handleReturn(tr));
      }
      const deleteBtn = tr.querySelector(".delete-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => handleDelete(tr));
      }

      soldTbody.appendChild(tr);
    });
  }

  // ---- EDIT / DELETE / SOLD ----
  function attachRowHandlers(row) {
    const saveBtn = row.querySelector(".save-btn");
    const deleteBtn = row.querySelector(".delete-btn");
    const soldBtn = row.querySelector(".sold-btn");

    if (saveBtn) saveBtn.addEventListener("click", () => handleSave(row));
    if (deleteBtn) deleteBtn.addEventListener("click", () => handleDelete(row));
    if (soldBtn) soldBtn.addEventListener("click", () => handleSold(row));
  }

  async function handleSave(row) {
    const id = row.dataset.id;
    const cells = row.querySelectorAll("[data-field]");
    const payload = {};

    cells.forEach((cell) => {
      const field = cell.dataset.field;
      const value = cell.textContent.trim();

      if (
        [
          "bulk_cost_payed",
          "cost_kg",
          "total_kg",
          "retail_kg",
          "cost_pp",
          "total_pp",
          "retail_pp",
        ].includes(field)
      ) {
        payload[field] = value === "" ? 0 : Number(value);
      } else {
        payload[field] = value;
      }
    });

    try {
      const res = await fetch(`/receipts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update");

      await loadReceipts();
    } catch (err) {
      console.error("Error updating:", err);
      alert("Error updating receipt");
    }
  }

  async function handleDelete(row) {
    const id = row.dataset.id;
    if (!confirm(`Delete receipt #${id}?`)) return;

    try {
      const res = await fetch(`/receipts/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");

      await loadReceipts();
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Error deleting receipt");
    }
  }

  async function handleSold(row) {
    const id = row.dataset.id;

    try {
      const res = await fetch(`/receipts/${id}/sold`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark sold");

      await loadReceipts();
    } catch (err) {
      console.error("Error marking sold:", err);
      alert("Error marking as sold");
    }
  }

  async function handleReturn(row) {
    const id = row.dataset.id;

    try {
      const res = await fetch(`/receipts/${id}/unsold`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to return item");

      alert(`Receipt #${id} returned to active inventory.`);
      await loadReceipts();
    } catch (err) {
      console.error("Error returning item:", err);
      alert("Error returning item");
    }
  }

  // ---- EVENTS ----
  if (fetchBtn) {
    fetchBtn.addEventListener("click", loadReceipts);
  }
  if (nameInput) {
    nameInput.addEventListener("input", applyFiltersAndRender);
  }

  // Initial state
  updateViewMode();
  loadReceipts();
});