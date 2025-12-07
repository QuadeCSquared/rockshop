// src/server.js
const express = require("express");
const path = require("path");
const dbRoutes = require("./routes/receipts");
const { upload } = require("./middleware/uploads");
const { extractCombinedFeatures, euclideanDistance } =
  require("./services/features");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

app.get("/receipts", dbRoutes.getReceipts);
app.post("/receipts", dbRoutes.addReceipt);
app.put("/receipts/:id", dbRoutes.updateReceipt);
app.delete("/receipts/:id", dbRoutes.deleteReceipt);
app.post("/receipts/:id/sold", dbRoutes.markSold);
app.post("/receipts/:id/unsold", dbRoutes.markUnsold);
app.get("/logs", dbRoutes.getLogs);

// Image identification
app.post("/identify", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imgPath = path.join(
      __dirname,
      "public",
      "uploads",
      req.file.filename
    );

    const feats = await extractCombinedFeatures(imgPath);

    // Right now we just echo back the features length,
    // you can later hook this into DB-stored features if you like.
    res.json({
      message: "Features extracted successfully",
      featureLength: feats.length,
    });
  } catch (err) {
    console.error("Error in /identify route:", err);
    res.status(500).json({ error: err.message });
  }
});

// Test endpoint – compare two uploaded images directly.
app.post(
  "/test-compare",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.image1 || !req.files.image2) {
        return res
          .status(400)
          .json({ error: "Both image1 and image2 files must be provided" });
      }

      const image1Path = req.files.image1[0].path;
      const image2Path = req.files.image2[0].path;

      const features1 = await extractCombinedFeatures(image1Path);
      const features2 = await extractCombinedFeatures(image2Path);

      const distance = euclideanDistance(features1, features2);

      res.json({
        image1: path.basename(image1Path),
        image2: path.basename(image2Path),
        features1Length: features1.length,
        features2Length: features2.length,
        distance: distance,
        similarity:
          distance < 1000 ? "High" : distance < 5000 ? "Medium" : "Low",
      });
    } catch (error) {
      console.error("Error in test-compare:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});