# Use the official Node.js 18 image as a base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app/

# Copy package.json and package-lock.json first
COPY package.json .

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose port 8080
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"]