document.addEventListener("DOMContentLoaded", () => {
  const fetchBtn = document.getElementById("fetch-minerals");
  const nameInput = document.getElementById("search-name");
  const weightInput = document.getElementById("search-weight");
  const tableBody = document.querySelector("#minerals-table tbody");
  let currentSort = { field: null, direction: "asc" };

  async function loadMinerals() {
    try {
      const res = await fetch("/minerals");
      const minerals = await res.json();
      renderTable(minerals);
    } catch (err) {
      console.error("Error loading minerals:", err);
    }
  }

  function renderTable(minerals) {
    tableBody.innerHTML = "";

    let filteredMinerals = minerals.filter(mineral => {
      const nameMatch = mineral.name.toLowerCase().includes(nameInput.value.toLowerCase());
      const weightMatch = !weightInput.value || parseFloat(mineral.weight) === parseFloat(weightInput.value);
      return nameMatch && weightMatch;
    });

    if (currentSort.field) {
      filteredMinerals.sort((a, b) => {
        let aVal = a[currentSort.field];
        let bVal = b[currentSort.field];

        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return currentSort.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    filteredMinerals.forEach(mineral => {
      const row = `<tr>
        <td>${mineral.id}</td>
        <td>${mineral.name}</td>
        <td>$${!isNaN(parseFloat(mineral.price)) ? parseFloat(mineral.price).toFixed(2) : "N/A"}</td>
        <td>${mineral.amount}</td>
        <td>${mineral.weight ? parseFloat(mineral.weight).toFixed(2) : "-"}</td>
        <td>${mineral.photo ? `<img src="/uploads/${mineral.photo.split('/').pop()}" width="50">` : "N/A"}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="startEdit(${mineral.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="confirmDelete(${mineral.id})">Delete</button>
        </td>
      </tr>`;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }

  window.deleteMineral = async (id) => {
    try {
      await fetch(`/minerals/${id}`, { method: "DELETE" });
      loadMinerals();
    } catch (err) {
      console.error("Error deleting mineral:", err);
    }
  };

  window.confirmDelete = (id) => {
    if (confirm("Are you sure you want to delete this mineral?")) {
      deleteMineral(id);
    }
  };

  window.startEdit = (id) => {
    const rows = document.querySelectorAll("#minerals-table tbody tr");

    for (const row of rows) {
      const cellId = parseInt(row.cells[0].textContent.trim());
      if (cellId === id) {
        const [_, name, price, amount, weight, photo, actions] = row.cells;

        name.innerHTML = `<input class="form-control" value="${name.textContent.trim()}">`;
        price.innerHTML = `<input class="form-control" type="number" value="${parseFloat(price.textContent.slice(1))}">`;
        amount.innerHTML = `<input class="form-control" type="number" value="${amount.textContent.trim()}">`;
        weight.innerHTML = `<input class="form-control" type="number" step="0.01" value="${weight.textContent.trim()}">`;

        actions.innerHTML = `<button class="btn btn-sm btn-success" onclick="confirmEdit(${id})">Save</button>`;
        
        break;
      }
    }
  };

  window.confirmEdit = async (id) => {
    const rows = document.querySelectorAll("#minerals-table tbody tr");

    for (const row of rows) {
      const cellId = parseInt(row.cells[0].textContent.trim());
      if (cellId === id) {
        const inputs = row.querySelectorAll("input");

        const updatedData = {
          name: inputs[0].value,
          price: parseFloat(inputs[1].value),
          amount: parseInt(inputs[2].value),
          weight: parseFloat(inputs[3].value)
        };

        try {
          const res = await fetch(`/minerals/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData)
          });

          if (res.ok) {
            loadMinerals();
          } else {
            alert("Failed to update mineral.");
          }
        } catch (err) {
          console.error("Error updating mineral:", err);
        }

        break;
      }
    }
  };

  fetchBtn.addEventListener("click", loadMinerals);
  nameInput.addEventListener("input", loadMinerals);
  weightInput.addEventListener("input", loadMinerals);

  document.querySelectorAll("th[data-sort]").forEach(header => {
    header.style.cursor = "pointer";
    header.addEventListener("click", () => {
      const field = header.dataset.sort;
      if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
      } else {
        currentSort.field = field;
        currentSort.direction = "asc";
      }
      loadMinerals();
    });
  });

  loadMinerals(); // Auto-load on page load
});