import { createApp } from './app.js';

// Mặc định chỉ nghe trên loopback (127.0.0.1). Trong container, Dockerfile đặt HOST=0.0.0.0
// và compose.yaml chỉ publish cổng ra 127.0.0.1 của máy host.
const host = process.env.HOST ?? '127.0.0.1';
const port = Number.parseInt(process.env.PORT ?? '3000', 10);

const server = createApp().listen(port, host, () => {
  console.log(`rexcorp-app listening on http://${host}:${port}`);
});

// Dừng gọn gàng khi nhận tín hiệu từ Docker (SIGTERM) hoặc Ctrl+C (SIGINT).
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`received ${signal}, shutting down`);
    server.close(() => process.exit(0));
  });
}
