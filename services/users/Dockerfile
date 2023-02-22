# Use Alpine with Node 18 as the base image
FROM --platform=arm64 node:18-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json to the working directory
COPY package.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the files to the working directory
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose port 4000
EXPOSE 4000

# Run the app when the container launches
CMD ["node", "dist/index.js"]