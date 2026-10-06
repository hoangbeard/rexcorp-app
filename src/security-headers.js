// Security header cho một API JSON. Đặt trước mọi route, nên cả 404 và lỗi 500 cũng có header.
//
// Căn cứ: OWASP ASVS 5.0.0, mục 3.4 "Browser Security Mechanism Headers".
// Đây là API, không phục vụ HTML, nên CSP chặn mọi thứ: không có script, ảnh hay iframe nào cần tải.

// ASVS 3.4.3 (CSP): tối thiểu có object-src 'none' và base-uri 'none', kèm allowlist (ở đây là default-src 'none').
// ASVS 3.4.6: frame-ancestors, để không ai nhúng được phản hồi vào iframe.
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
].join('; ');

// ASVS 3.4.1 (HSTS): max-age tối thiểu 1 năm. RFC 6797 §7.2: không gửi header này qua HTTP thường.
const ONE_YEAR_SECONDS = 31536000;
const STRICT_TRANSPORT_SECURITY = `max-age=${ONE_YEAR_SECONDS}`;

export function securityHeaders(req, res, next) {
  res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  res.setHeader('X-Content-Type-Options', 'nosniff'); // ASVS 3.4.4
  res.setHeader('Referrer-Policy', 'no-referrer'); // ASVS 3.4.5
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin'); // chặn site khác nhúng tài nguyên (Spectre)
  // req.secure chỉ đúng khi Express biết request đến qua HTTPS: trực tiếp, hoặc sau reverse proxy đã
  // cấu hình `trust proxy`. Mặc định (HTTP thường) thì không gửi HSTS.
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', STRICT_TRANSPORT_SECURITY);
  }
  next();
}
