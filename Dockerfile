FROM node:18-bullseye

# Install ffmpeg + dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install --no-cache-dir yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

RUN npm install

# Copy rest of project
COPY . .

# Expose radio port
EXPOSE 3000

# Start your bot (change index.js if your entry file is different)
CMD ["node", "index.js"]
