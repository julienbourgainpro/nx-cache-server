FROM node:22

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

CMD ["node", "--import", "tsx", "./src/index.ts"]
