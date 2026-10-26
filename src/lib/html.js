// Mã hóa ký tự đặc biệt của HTML. Dùng cho MỌI giá trị từ người dùng được đưa vào HTML.
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}
