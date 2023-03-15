# Note: This Dockerfile assumes context is set to the git root (../../)

# Use Node 18 Alpine as the base image
FROM node:18-alpine

# Install git
RUN apk add --no-cache git

# Set the working directory to /tmp
WORKDIR /tmp

# Copy files to the working directory
COPY . .

# Install the dependencies
RUN npm install

# Build the TypeScript project
RUN npm run build --workspace @casimir/users

# Set the working directory to /app
WORKDIR /app

# Copy the build assets to the working directory
COPY /tmp/services/users/dist .

# Expose port 4000
EXPOSE 4000

# Run the app when the container launches
CMD ["node", "index.js"]