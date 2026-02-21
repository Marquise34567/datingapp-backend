FROM node:20-bullseye-slim

WORKDIR /app

# Install dependencies (including dev dependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "start"]
