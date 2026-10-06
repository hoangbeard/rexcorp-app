import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createApp } from '../src/app.js';
import { securityHeaders } from '../src/security-headers.js';

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
});

// Mỗi cặp: [đường dẫn, phương thức]. Header phải có trên mọi loại phản hồi: 200, 400, 404.
const RESPONSES = [
  ['/healthz', 'GET'],
  ['/api/products', 'GET'],
  ['/api/products?category=weapons', 'GET'], // 400
  ['/api/products/rx-999', 'GET'], // 404 do route
  ['/khong-ton-tai', 'GET'], // 404 do không có route
];

for (const [path, method] of RESPONSES) {
  test(`${method} ${path} có đủ security header (ASVS 3.4.x)`, async () => {
    const res = await fetch(`${baseUrl}${path}`, { method });
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(res.headers.get('cross-origin-resource-policy'), 'same-origin');
    const csp = res.headers.get('content-security-policy');
    assert.ok(csp.includes("object-src 'none'"), 'thiếu object-src');
    assert.ok(csp.includes("base-uri 'none'"), 'thiếu base-uri');
    assert.ok(csp.includes("frame-ancestors 'none'"), 'thiếu frame-ancestors');
    assert.equal(res.headers.get('x-powered-by'), null);
  });
}

test('không gửi HSTS qua HTTP thường (RFC 6797 §7.2)', async () => {
  const res = await fetch(`${baseUrl}/healthz`);
  assert.equal(res.headers.get('strict-transport-security'), null);
});

test('gửi HSTS max-age >= 1 năm và includeSubDomains khi request đến qua HTTPS (ASVS 3.4.1, L2)', async () => {
  // Mô phỏng reverse proxy kết thúc TLS: bật trust proxy và gửi X-Forwarded-Proto: https.
  const app = express();
  app.set('trust proxy', true);
  app.use(securityHeaders);
  app.get('/', (req, res) => res.json({ ok: true }));
  const proxied = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => proxied.once('listening', resolve));
  try {
    const res = await fetch(`http://127.0.0.1:${proxied.address().port}/`, {
      headers: { 'x-forwarded-proto': 'https' },
    });
    const match = /^max-age=(\d+)/.exec(res.headers.get('strict-transport-security') ?? '');
    assert.ok(match, 'thiếu Strict-Transport-Security');
    assert.ok(Number(match[1]) >= 31536000, 'max-age dưới 1 năm');
    assert.match(res.headers.get('strict-transport-security'), /; includeSubDomains$/, 'thiếu includeSubDomains (L2)');
  } finally {
    proxied.close();
  }
});
