import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPaymentRequest } from '../src/payments.js';

test('buildPaymentRequest tạo yêu cầu POST tới /payments', () => {
  const req = buildPaymentRequest({ orderId: 'ord-1001', amount: 250000 });
  assert.equal(req.method, 'POST');
  assert.equal(req.url, 'https://pay.rexcorp.example/v1/payments');
  assert.deepEqual(JSON.parse(req.body), { orderId: 'ord-1001', amount: 250000, currency: 'VND' });
});

test('buildPaymentRequest từ chối số tiền không hợp lệ', () => {
  assert.throws(() => buildPaymentRequest({ orderId: 'ord-1001', amount: -5 }), /amount/);
  assert.throws(() => buildPaymentRequest({ orderId: '', amount: 100 }), /orderId/);
});
