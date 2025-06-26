FROM node:22

WORKDIR /app
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --production --frozen-lockfile
COPY . .

CMD ["node", "--import", "tsx", "./src/index.ts"]
