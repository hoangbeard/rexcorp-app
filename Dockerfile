# Hai giai đoạn (multi-stage): giai đoạn "deps" có npm để cài dependency; image chạy thật không có npm, shell hay apt.
# Mọi base image pin theo digest; tag chỉ để người đọc dễ hiểu. Xem ADR-0006 vì sao chọn distroless.

# Giai đoạn 1: cài dependency theo đúng package-lock.json, bỏ devDependencies.
FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Giai đoạn 2: image chạy. Distroless Node.js 24 trên Debian 13, biến thể nonroot (uid 65532).
# Không có shell và không có package manager; ENTRYPOINT của image đã là "/nodejs/bin/node".
FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:cb606325b7ec4af55462cb0b424a53b452a5b4a894ffe841fcf1048d216fb9f8

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
WORKDIR /app

COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src

# Chạy bằng user không phải root, viết dạng số để Kubernetes (runAsNonRoot) kiểm tra được.
USER 65532:65532
EXPOSE 3000

# Không có shell nên HEALTHCHECK phải ở dạng exec; gọi thẳng binary node.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["src/server.js"]
