FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server ./server
COPY icons ./icons
COPY README.md ./

ENV PORT=8787
ENV DATA_DIR=/app/data
ENV VAULT_TOKEN=""

RUN mkdir -p /app/data

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8787/api/health || exit 1

CMD ["node", "server/server.js"]
