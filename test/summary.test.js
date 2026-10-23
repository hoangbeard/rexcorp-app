import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { summarizeByCategory } from '../src/summary.js';

test('summarizeByCategory gom theo danh mục và tính tổng, trung bình', () => {
  const summary = summarizeByCategory([
    { id: 'a', category: 'hardware', price: 50 },
    { id: 'b', category: 'hardware', price: 100 },
    { id: 'c', category: 'service', price: 20 },
  ]);
  assert.deepEqual(summary, {
    hardware: { count: 2, totalPrice: 150, averagePrice: 75 },
    service: { count: 1, totalPrice: 20, averagePrice: 20 },
  });
});

test('summarizeByCategory trả về object rỗng khi không có sản phẩm', () => {
  assert.deepEqual(summarizeByCategory([]), {});
});

test('GET /api/summary trả về tổng hợp theo danh mục', async () => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/summary`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.hardware, { count: 2, totalPrice: 178, averagePrice: 89 });
    assert.deepEqual(body.service, { count: 2, totalPrice: 118, averagePrice: 59 });
  } finally {
    server.close();
  }
});
