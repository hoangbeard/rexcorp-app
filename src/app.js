import express from 'express';
import { createStore } from './store.js';
import { summarizeByCategory } from './summary.js';

const CATEGORIES = new Set(['hardware', 'service']);
const AUTHOR_PATTERN = /^[a-z0-9._-]{1,40}$/;
const MAX_NOTE_LENGTH = 500;

// Kiểm tra dữ liệu đầu vào của một ghi chú. Trả về danh sách lỗi (rỗng nếu hợp lệ).
function validateNote(body) {
  const errors = [];
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return ['body must be a JSON object'];
  }
  const { author, text } = body;
  if (typeof author !== 'string' || !AUTHOR_PATTERN.test(author)) {
    errors.push('author must be 1-40 characters: a-z, 0-9, dot, underscore or hyphen');
  }
  if (typeof text !== 'string' || text.trim().length === 0) {
    errors.push('text is required');
  } else if (text.length > MAX_NOTE_LENGTH) {
    errors.push(`text must be at most ${MAX_NOTE_LENGTH} characters`);
  }
  return errors;
}

export function createApp({ store = createStore() } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  app.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/products', (req, res) => {
    const { category } = req.query;
    if (category !== undefined && (typeof category !== 'string' || !CATEGORIES.has(category))) {
      return res.status(400).json({ error: `category must be one of: ${[...CATEGORIES].join(', ')}` });
    }
    res.json({ items: store.listProducts({ category }) });
  });

  app.get('/api/summary', (req, res) => {
    res.json(summarizeByCategory(store.listProducts()));
  });

  app.get('/api/products/:id', (req, res) => {
    const product = store.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'product not found' });
    }
    res.json(product);
  });

  app.get('/api/products/:id/notes', (req, res) => {
    if (!store.getProduct(req.params.id)) {
      return res.status(404).json({ error: 'product not found' });
    }
    res.json({ items: store.listNotes(req.params.id) });
  });

  app.post('/api/products/:id/notes', (req, res) => {
    if (!store.getProduct(req.params.id)) {
      return res.status(404).json({ error: 'product not found' });
    }
    const errors = validateNote(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    const note = store.addNote(req.params.id, {
      author: req.body.author,
      text: req.body.text.trim(),
    });
    res.status(201).json(note);
  });

  // Route không tồn tại.
  app.use((req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  // Xử lý lỗi tập trung: không trả stack trace hay chi tiết nội bộ cho client.
  app.use((err, req, res, next) => {
    const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
    if (status === 500) {
      console.error(err);
    }
    res.status(status).json({ error: status === 500 ? 'internal server error' : 'invalid request' });
  });

  return app;
}
