document.addEventListener('DOMContentLoaded', function() {
  const compareForm = document.getElementById('compare-form');
  const compareResult = document.getElementById('compare-result');
  
  if (compareForm) {
    compareForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Show loading indicator
      compareResult.innerHTML = '<div class="alert alert-info">Processing images...</div>';
      
      const formData = new FormData(compareForm);
      
      try {
        const response = await fetch('/test-compare', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Display the results
        compareResult.innerHTML = `
          <div class="alert alert-success">
            <h4>Comparison Results:</h4>
            <p><strong>Image 1:</strong> ${data.image1}</p>
            <p><strong>Image 2:</strong> ${data.image2}</p>
            <p><strong>Features Extracted from Image 1:</strong> ${data.features1Length} values</p>
            <p><strong>Features Extracted from Image 2:</strong> ${data.features2Length} values</p>
            <p><strong>Distance between features:</strong> ${data.distance.toFixed(2)}</p>
            <p><strong>Similarity:</strong> ${data.similarity}</p>
            <div class="small text-muted">Lower distance values indicate more similar images</div>
          </div>
        `;
      } catch (error) {
        console.error('Error comparing images:', error);
        compareResult.innerHTML = `
          <div class="alert alert-danger">
            Error comparing images: ${error.message}
          </div>
        `;
      }
    });
  }
});