FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source and config
COPY . .

# Build TypeScript
RUN npm run build

# Port for healthcheck
EXPOSE 8080

# Run the app
CMD ["npm", "start"]
