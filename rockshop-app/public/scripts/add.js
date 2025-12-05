// add.js — handles form submission for adding a new mineral

document.getElementById("add-mineral-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const data = new FormData(form);

  const res = await fetch("/minerals", {
    method: "POST",
    body: data
  });

  if (res.ok) {
    alert("Mineral added!");
    form.reset();
  } else {
    alert("Error adding mineral.");
  }
});