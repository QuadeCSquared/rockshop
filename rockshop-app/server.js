const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./routes");
const cv = require('@u4/opencv4nodejs');


const { extractCombinedFeatures, euclideanDistance } = require("./features");


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, "public"))); // Serves everything in public
app.use("/uploads", express.static(path.join(__dirname, "public/uploads"))); // Explicit image route

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "public", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Mineral routes
app.get("/minerals", db.getMinerals);
app.post("/minerals", upload.single("photo"), db.addMineral);
app.delete("/minerals/:id", db.deleteMineral);
app.put("/minerals/:id", db.updateMineral);

app.post("/identify", upload.single("photo"), async (req, res) => {
  // read the saved file
  const imgPath = path.join(__dirname, "public", "uploads", req.file.filename);
  // extract features
  const feats = await extractCombinedFeatures(imgPath);
  // load your database features…
  const dbFeats = await db.getAllFeatures();
  // compute distances
  const distances = dbFeats.map(d => ({
    id: d.id,
    dist: euclideanDistance(feats, d.features)
  }));
  // pick best
  const best = distances.sort((a,b) => a.dist - b.dist)[0];
  res.json({ matchId: best.id, distance: best.dist });
});


// test endpoint for comparing two images
app.post("/test-compare", upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 }
]), async (req, res) => {
  try {
    // Verify files were uploaded
    if (!req.files || !req.files.image1 || !req.files.image2) {
      throw new Error('Missing uploaded files');
    }

    // Get the paths of the uploaded images
    const image1Path = req.files.image1[0].path;
    const image2Path = req.files.image2[0].path;
    
    console.log("Processing images:");
    console.log("Image 1:", image1Path);
    console.log("Image 2:", image2Path);
    
    // Extract features from both images
    let features1, features2;
    try {
      console.log("Extracting features from Image 1...");
      features1 = extractCombinedFeatures(image1Path);
      console.log("Features 1 length:", features1.length);
    } catch (error) {
      console.error("Error extracting features from image 1:", error);
      throw new Error(`Error processing image 1: ${error.message}`);
    }
    
    try {
      console.log("Extracting features from Image 2...");
      features2 = extractCombinedFeatures(image2Path);
      console.log("Features 2 length:", features2.length);
    } catch (error) {
      console.error("Error extracting features from image 2:", error);
      throw new Error(`Error processing image 2: ${error.message}`);
    }
    
    // Calculate distance between the features
    const distance = euclideanDistance(features1, features2);
    console.log("Euclidean distance:", distance);
    
    // Return the results
    res.json({
      image1: path.basename(image1Path),
      image2: path.basename(image2Path),
      features1Length: features1.length,
      features2Length: features2.length,
      distance: distance,
      // Lower distance means more similar
      similarity: distance < 1000 ? "High" : distance < 5000 ? "Medium" : "Low"
    });
  } catch (error) {
    console.error("Error in test-compare:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});