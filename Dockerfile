FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && mkdir -p mock-server/data/uploads && chown -R node:node /app
ENV NODE_ENV=production PORT=7860
USER node
EXPOSE 7860
CMD ["node", "mock-server/server.js"]