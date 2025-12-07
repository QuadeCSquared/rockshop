// public/scripts/logs.js

document.addEventListener("DOMContentLoaded", () => {
  const actionSelect = document.getElementById("filter-action");
  const receiptIdInput = document.getElementById("filter-receipt-id");
  const textInput = document.getElementById("filter-text");
  const tableBody = document.querySelector("#logs-table tbody");
  const statusDiv = document.getElementById("logs-status");

  let allLogs = [];

  async function loadLogs() {
    try {
      statusDiv.textContent = "Loading logs...";
      const res = await fetch("/logs");
      if (!res.ok) throw new Error(`Failed to load logs: ${res.status}`);
      allLogs = await res.json();
      applyFiltersAndRender();
      statusDiv.textContent = `Showing ${allLogs.length} log entries (latest first).`;
    } catch (err) {
      console.error("Error loading logs:", err);
      tableBody.innerHTML =
        '<tr><td colspan="5" class="text-danger">Error loading logs</td></tr>';
      statusDiv.textContent = "Error loading logs.";
    }
  }

  function applyFiltersAndRender() {
    const actionFilter = actionSelect.value;
    const receiptFilterRaw = receiptIdInput.value.trim();
    const receiptFilter = receiptFilterRaw === "" ? null : Number(receiptFilterRaw);
    const textFilter = textInput.value.trim().toLowerCase();

    let filtered = allLogs.slice();

    if (actionFilter) {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    if (receiptFilter !== null && !Number.isNaN(receiptFilter)) {
      filtered = filtered.filter((log) => log.receipt_id === receiptFilter);
    }

    if (textFilter) {
      filtered = filtered.filter((log) => {
        const msg = (log.message || "").toLowerCase();
        return msg.includes(textFilter);
      });
    }

    renderTable(filtered);
    statusDiv.textContent = `Showing ${filtered.length} of ${allLogs.length} log entries.`;
  }

  function renderTable(logs) {
    tableBody.innerHTML = "";

    if (!logs.length) {
      tableBody.innerHTML =
        '<tr><td colspan="5" class="text-center">No logs found</td></tr>';
      return;
    }

    logs.forEach((log) => {
      const tr = document.createElement("tr");

      const createdAt = log.created_at
        ? new Date(log.created_at).toLocaleString()
        : "";

      tr.innerHTML = `
        <td>${log.id}</td>
        <td>${log.receipt_id ?? ""}</td>
        <td><span class="badge bg-${badgeClassForAction(log.action)}">${log.action}</span></td>
        <td>${escapeHtml(log.message || "")}</td>
        <td>${createdAt}</td>
      `;

      tableBody.appendChild(tr);
    });
  }

  function badgeClassForAction(action) {
    switch (action) {
      case "ADD":
        return "success";
      case "UPDATE":
        return "primary";
      case "DELETE":
        return "danger";
      case "SOLD":
        return "warning text-dark";
      case "RETURN":
        return "secondary"
      default:
        return "secondary";
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Wire filters
  actionSelect.addEventListener("change", applyFiltersAndRender);
  receiptIdInput.addEventListener("input", applyFiltersAndRender);
  textInput.addEventListener("input", applyFiltersAndRender);

  // Initial load
  loadLogs();
});