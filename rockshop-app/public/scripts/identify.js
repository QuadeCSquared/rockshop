document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("identify-form");
  const resultDiv = document.getElementById("identify-result");
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    resultDiv.textContent = "Processing...";

    const fileInput = document.getElementById("photo");
    const formData = new FormData();
    formData.append("photo", fileInput.files[0]);

    try {
      const res = await fetch("/identify", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      // Show the result
      resultDiv.innerHTML = `
        <strong>Comparison Result:</strong><br>
        Match ID: ${data.matchId}<br>
        Distance: ${data.distance}
      `;

      // Optionally, show the feature arrays if you modify the server to return them
      if (data.feats && data.bestFeatures) {
        resultDiv.innerHTML += `
          <hr>
          <strong>Uploaded Features:</strong><br>
          <pre>${JSON.stringify(data.feats, null, 2)}</pre>
          <strong>Best Match Features:</strong><br>
          <pre>${JSON.stringify(data.bestFeatures, null, 2)}</pre>
        `;
      }
    } catch (err) {
      resultDiv.textContent = "Error: " + err.message;
    }
  });
});