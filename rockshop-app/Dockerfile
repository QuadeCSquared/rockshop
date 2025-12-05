FROM node:20-bullseye-slim

# Install OpenCV and dependencies
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    python3-opencv \
    build-essential \
    cmake \
    git \
    pkg-config \
    python3 \
    libopencv-contrib-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

ENV OPENCV4NODEJS_AUTOBUILD_OPENCV_VERSION=4.8.0
ENV OPENCV4NODEJS_DISABLE_AUTOBUILD=0

# Install dependencies with build support
RUN npm install --build-from-source
RUN npm install dotenv

# Copy app files
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]