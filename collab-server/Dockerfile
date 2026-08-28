FROM node:22.6.0-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY collab-server/package*.json ./
RUN npm install --omit=dev

COPY collab-server/ .
COPY shared/ ./shared/

ENV PORT=1234
EXPOSE ${PORT}

CMD ["node", "server.js"]
