FROM node:22

WORKDIR /app
COPY package*.json ./
RUN corepack enable && yarn install --production=true
COPY . .

CMD ["node", "--import", "tsx", "./src/index.ts"]
