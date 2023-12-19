# Note: This Dockerfile assumes context is set to the git root (../../)

# Use Node 18 Alpine as the base image
FROM node:18-alpine

# Install git
RUN apk add --no-cache git

# Copy all files to /tmp
COPY . .

# Install dependencies
RUN npm i --omit=optional --ignore-scripts

# Build the blog service
RUN npm run build --workspace @casimir/blog

# Move the blog service build assets to /app
RUN mv services/blog/dist /app

# Set the working directory to /app
WORKDIR /app

# Expose port 4001
EXPOSE 4001

# Run the app when the container launches
CMD ["node", "index.js"]