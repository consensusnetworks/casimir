# Use Node 16 as the base image
FROM node:16

# Set the working directory to /app
WORKDIR /app

# Copy package.json to the working directory
COPY package.json ./

# Install the dependencies
RUN npm ci

# Copy the rest of the files to the working directory
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose port 8080
EXPOSE 8080

# Run the app when the container launches
CMD ["node", "dist/index.js"]