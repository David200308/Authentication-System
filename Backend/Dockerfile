FROM --platform=linux/amd64 docker.io/node:22-alpine

WORKDIR /app
RUN mkdir -p /app/node_modules && chown -R node:node /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

WORKDIR /app/dist

EXPOSE 3001

USER node

CMD [ "node", "main.js" ]
