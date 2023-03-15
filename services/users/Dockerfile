# Note: This Dockerfile assumes context is set to the git root (../../)

# Use Node 18 Alpine as the base image
FROM node:18-alpine

# Install git
RUN apk add --no-cache git

# Set the working directory to /tmp
WORKDIR /tmp

# Copy all files to /tmp
COPY . .

# Install and build all workspaces (including the users service)
RUN npm install

# Copy the users service build assets to /app
COPY ./services/users/dist /app

# Set the working directory to /app
WORKDIR /app

# Expose port 4000
EXPOSE 4000

# Run the app when the container launches
CMD ["node", "index.js"]