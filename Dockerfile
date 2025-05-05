FROM denoland/deno:2.3.1

WORKDIR /app
COPY . .
RUN deno install

CMD ["deno", "task", "start"]
