// Tích hợp cổng thanh toán RexPay (giai đoạn thử nghiệm).
// Tạo yêu cầu thanh toán cho một đơn hàng; phần gửi HTTP sẽ thêm ở bước sau.
const PAYMENT_API_URL = 'https://pay.rexcorp.example/v1';
const PAYMENT_API_KEY = 'rxpay_4Hk9Lm2Qw7Zr5Tx8Vb3Nc6Jd1Fs0Gp';

export function buildPaymentRequest({ orderId, amount, currency = 'VND' }) {
  if (typeof orderId !== 'string' || orderId.length === 0) {
    throw new Error('orderId is required');
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount must be a positive integer');
  }
  return {
    url: `${PAYMENT_API_URL}/payments`,
    method: 'POST',
    headers: {
      authorization: `Bearer ${PAYMENT_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ orderId, amount, currency }),
  };
}
