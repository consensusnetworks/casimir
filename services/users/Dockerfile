# Use Node 18 Alpine as the base image
FROM node:18-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json to the working directory
COPY package.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the files to the working directory
COPY . .

# Build the TypeScript project
RUN npm run build --workspace @casimir/users

# Expose port 4000
EXPOSE 4000

WORKDIR /app/services/users/dist

# Run the app when the container launches
CMD ["node", "index.js"]