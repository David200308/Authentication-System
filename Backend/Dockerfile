FROM --platform=linux/amd64 docker.io/node:22-alpine

WORKDIR /app
RUN mkdir -p /app/node_modules /app/dist && \
    chown -R node:node /app && \
    chmod -R 755 /app

COPY --chown=node:node package*.json ./
RUN npm install

COPY --chown=node:node . .
RUN chmod -R 755 /app

USER node
RUN npm run build

WORKDIR /app/dist

EXPOSE 3000

CMD [ "node", "main.js" ]
