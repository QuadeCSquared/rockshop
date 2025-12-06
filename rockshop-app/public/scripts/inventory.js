document.addEventListener("DOMContentLoaded", () => {
  const fetchBtn = document.getElementById("fetch-minerals");
  const nameInput = document.getElementById("search-name");
  const weightInput = document.getElementById("search-weight");
  const tableBody = document.querySelector("#minerals-table tbody");

  let allReceipts = [];
  let currentSort = { field: null, direction: "asc" };

  async function loadReceipts() {
    try {
      const res = await fetch("/receipts");
      if (!res.ok) {
        throw new Error("Failed to load receipts");
      }
      allReceipts = await res.json();
      applyFiltersAndSort();
    } catch (err) {
      console.error("Error loading receipts:", err);
      tableBody.innerHTML =
        '<tr><td colspan="11" class="text-danger">Error loading receipts</td></tr>';
    }
  }

  function applyFiltersAndSort() {
    const nameFilter = (nameInput.value || "").trim().toLowerCase();
    const weightFilterRaw = (weightInput.value || "").trim();
    const weightFilter = weightFilterRaw === "" ? NaN : Number(weightFilterRaw);

    let rows = allReceipts.slice();

    // Filter by wholeseller/specimen
    if (nameFilter) {
      rows = rows.filter((r) => {
        const w = (r.wholeseller || "").toLowerCase();
        const s = (r.specimen || "").toLowerCase();
        return w.includes(nameFilter) || s.includes(nameFilter);
      });
    }

    // Filter by minimum total_kg
    if (!isNaN(weightFilter)) {
      rows = rows.filter((r) => {
        const totalKg = Number(r.total_kg || 0);
        return totalKg >= weightFilter;
      });
    }

    // Sorting
    if (currentSort.field) {
      const field = currentSort.field;
      const dir = currentSort.direction === "asc" ? 1 : -1;
      rows.sort((a, b) => {
        const av = a[field];
        const bv = b[field];

        const aNum = Number(av);
        const bNum = Number(bv);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return (aNum - bNum) * dir;
        }

        const as = (av ?? "").toString().toLowerCase();
        const bs = (bv ?? "").toString().toLowerCase();
        if (as < bs) return -1 * dir;
        if (as > bs) return 1 * dir;
        return 0;
      });
    }

    renderTable(rows);
  }

  function renderTable(receipts) {
    tableBody.innerHTML = "";

    if (!receipts.length) {
      tableBody.innerHTML =
        '<tr><td colspan="11" class="text-center">No receipts found</td></tr>';
      return;
    }

    receipts.forEach((r) => {
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
          <button class="btn btn-sm btn-danger delete-btn">Delete</button>
        </td>
      `;

      const saveBtn = tr.querySelector(".save-btn");
      const deleteBtn = tr.querySelector(".delete-btn");

      saveBtn.addEventListener("click", () => handleSave(tr));
      deleteBtn.addEventListener("click", () => handleDelete(tr));

      tableBody.appendChild(tr);
    });
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to update receipt ${id}`);
      }

      await loadReceipts();
    } catch (err) {
      console.error("Error updating receipt:", err);
      alert("Error updating receipt");
    }
  }

  async function handleDelete(row) {
    const id = row.dataset.id;
    if (!confirm(`Delete receipt #${id}?`)) return;

    try {
      const res = await fetch(`/receipts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete receipt ${id}`);
      }
      await loadReceipts();
    } catch (err) {
      console.error("Error deleting receipt:", err);
      alert("Error deleting receipt");
    }
  }

  if (fetchBtn) {
    fetchBtn.addEventListener("click", loadReceipts);
  }

  nameInput.addEventListener("input", applyFiltersAndSort);
  weightInput.addEventListener("input", applyFiltersAndSort);

  document
    .querySelectorAll("#minerals-table thead th[data-sort]")
    .forEach((header) => {
      header.style.cursor = "pointer";
      header.addEventListener("click", () => {
        const field = header.dataset.sort;
        if (currentSort.field === field) {
          currentSort.direction =
            currentSort.direction === "asc" ? "desc" : "asc";
        } else {
          currentSort.field = field;
          currentSort.direction = "asc";
        }
        applyFiltersAndSort();
      });
    });

  loadReceipts();
});