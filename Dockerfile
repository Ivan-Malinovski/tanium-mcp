FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
