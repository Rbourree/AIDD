FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache openssl
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache openssl
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]