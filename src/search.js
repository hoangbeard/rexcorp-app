// Tìm kiếm sản phẩm cho trang catalogue của đội Product.
const CATEGORIES = new Set(['hardware', 'service']);

export function registerSearchRoutes(app, store) {
  // JSON: lọc theo tên. Cho phép nhập mẫu regex để tìm kiểu "rex.*pro".
  app.get('/api/search', (req, res) => {
    const { q } = req.query;
    if (typeof q !== 'string' || q.length === 0) {
      return res.status(400).json({ error: 'q is required' });
    }
    const pattern = new RegExp(q, 'i');
    res.json({ items: store.listProducts().filter((p) => pattern.test(p.name)) });
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
    res.write(`<h1>Kết quả cho: ${q}</h1>`);
    res.write(`<h2>Danh mục: ${category ?? 'tất cả'}</h2>`);
    res.end(`<ul>${items.map((p) => `<li>${p.name} - ${p.price} USD</li>`).join('')}</ul>`);
  });
}
