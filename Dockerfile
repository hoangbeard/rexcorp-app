# Image chính thức của Node.js 24 (LTS "Krypton"), biến thể Debian bookworm-slim.
# Pin theo digest để lần build nào cũng dùng đúng một base image; tag chỉ để người đọc dễ hiểu.
FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app

# Cài dependency theo đúng package-lock.json, bỏ devDependencies, rồi xóa cache của npm.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && rm -rf /root/.npm \
 && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-v1.22.22

COPY src ./src

# Chạy bằng user không phải root (user "node", uid 1000, có sẵn trong image chính thức).
USER node

ENV HOST=0.0.0.0 \
    PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "src/server.js"]
