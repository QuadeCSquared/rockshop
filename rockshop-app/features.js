// features.js
const cv = require('@u4/opencv4nodejs');
const fs = require('fs');

 // Extract a color‐histogram feature vector from an image file.
function extractColorHistogram(imagePath) {
  console.log("========= EXTRACT COLOR HISTOGRAM DEBUG =========");
  console.log("OpenCV version:", cv.version);
  console.log("Image path:", imagePath);
  
  try {
    // Check if file exists
    const stats = fs.statSync(imagePath);
    console.log("File exists, size:", stats.size, "bytes");
  } catch(err) {
    console.error("File access error:", err.message);
    throw new Error(`File not accessible: ${err.message}`);
  }

  try {
    // Read the image
    console.log("Attempting to read image...");
    const src = cv.imread(imagePath);
    
    // Check if the image was loaded properly
    if (!src || src.empty) {
      console.error("Failed to load image - empty or null");
      throw new Error('Failed to load image');
    }
    
    console.log("Image loaded successfully. Size:", src.rows, "×", src.cols);
    
    // Resize for consistency and efficiency
    const resized = src.resize(64, 64);
    console.log("Image resized to 64×64");
    
    // Convert to HSV color space
    const hsv = resized.cvtColor(cv.COLOR_BGR2HSV);
    console.log("HSV conversion successful");
    
    // Get simple statistics 
    const means = hsv.mean();
    console.log("HSV means:", means);
    
    // Create sections of the image and get statistics for each section
    const features = [];
    
    // Divide image into 4×4 grid = 16 sections
    const sectionWidth = Math.floor(resized.cols / 4);
    const sectionHeight = Math.floor(resized.rows / 4);
    
    console.log("Extracting features from 4×4 grid sections");
    
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const section = hsv.getRegion(
          new cv.Rect(x * sectionWidth, y * sectionHeight, sectionWidth, sectionHeight)
        );
        
        const sectionMean = section.mean();
        // Instead of spreading, access the properties directly
        features.push(sectionMean.x, sectionMean.y, sectionMean.z);
      }
    }
    
    // Add global statistics - just the means since stddev isn't available
    // Again, access the properties directly
    features.push(means.x, means.y, means.z);
    
    console.log("Total feature vector length:", features.length);
    console.log("========= EXTRACT COLOR HISTOGRAM COMPLETE =========");
    
    return features;
  } catch (error) {
    console.error(`Error in extractColorHistogram: ${error.message}`);
    throw error;
  }
}

 // Extract an ORB keypoint descriptor vector.
function extractORBDescriptor(imagePath, maxFeatures = 500) {
    // Convert to grey scale
    const src = cv.imread(imagePath).bgrToGray();
    //init an ORB detector to find max features keypoints
    const orb = new cv.ORBDetector({ nFeatures: maxFeatures });
    // detect keypoints in corners or blobs in the image
    const keypoints = orb.detect(src);
    //compute a 32 byte descriptor for each keypoint
    const descriptors = orb.compute(src, keypoints);
    // turn the descriptors Mat into a flat JS array
    let arr = descriptors.getDataAsArray().flat();
    // enforce a fixed length by padding with zeros or slicing
    const desired = maxFeatures * 32;
    if (arr.length < desired) {
    arr = arr.concat(Array(desired - arr.length).fill(0)); // pad
    } else if (arr.length > desired) {
    arr = arr.slice(0, desired);                          // truncate
    }

    return arr;  // length = maxFeatures×32
}

function extractCombinedFeatures(imagePath) {
  // Get the normalized HSV histogram (length 288)
  const colorVec = extractColorHistogram(imagePath);

  // Get the ORB descriptor vector (length = 500×32 = 16,000)
  const orbVec   = extractORBDescriptor(imagePath, 500);

  // Optionally weight color features more heavily
  const colorWeight = 2.0;
  const scaledColor = colorVec.map(v => v * colorWeight);

  // Concatenate into one big vector [288 + 16000 = 16288]
  return scaledColor.concat(orbVec);
}

// calculate euclideandistance
function euclideanDistance(a, b) {
  if (a.length !== b.length) {
    throw new Error('Feature‐vector length mismatch');
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

module.exports = {
  extractColorHistogram,
  extractORBDescriptor,
  extractCombinedFeatures,
  euclideanDistance
};
