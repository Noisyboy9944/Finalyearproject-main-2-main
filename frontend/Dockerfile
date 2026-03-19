# Frontend Dockerfile
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies using npm (avoids yarn version conflicts)
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Start the development server
ENV PORT=3001
CMD ["npm", "start"]
