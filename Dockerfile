FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# En desarrollo: nodemon con hot-reload
# En producción (NODE_ENV=production): node directamente
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'production' ]; then node server.js; else npm run dev; fi"]
