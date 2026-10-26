// Tìm kiếm sản phẩm cho trang catalogue của đội Product.
import { escapeHtml } from './lib/html.js';

const CATEGORIES = new Set(['hardware', 'service']);

export function registerSearchRoutes(app, store) {
  // JSON: lọc theo tên (chuỗi con, không phân biệt hoa thường).
  // Không dùng new RegExp(q): q do người dùng gửi, mẫu sai làm route trả 500 (SAST-002).
  app.get('/api/search', (req, res) => {
    const { q } = req.query;
    if (typeof q !== 'string' || q.length === 0) {
      return res.status(400).json({ error: 'q is required' });
    }
    const needle = q.toLowerCase();
    res.json({ items: store.listProducts().filter((p) => p.name.toLowerCase().includes(needle)) });
  });

  // HTML: trang kết quả để nhúng vào trang catalogue.
  app.get('/search', (req, res) => {
    const q = String(req.query.q ?? '');
    const { category } = req.query;
    if (category !== undefined && !CATEGORIES.has(category)) {
      return res.status(400).send('invalid category');
    }
    const items = store
      .listProducts({ category })
      .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    res.type('html');
    res.write(`<h1>Kết quả cho: ${escapeHtml(q)}</h1>`);
    // nosemgrep: rexcorp-express-reflected-xss -- EXC-0003 (SAST-003): category đã được kiểm tra với allowlist CATEGORIES ở trên; xem lại trước 2027-04-06
    res.write(`<h2>Danh mục: ${category ?? 'tất cả'}</h2>`);
    res.end(`<ul>${items.map((p) => `<li>${p.name} - ${p.price} USD</li>`).join('')}</ul>`);
  });
}
