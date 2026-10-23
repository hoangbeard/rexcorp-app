// Test của rule rexcorp-express-reflected-xss. Chạy: semgrep --test .semgrep/rules/
// "ruleid:" = dòng NGAY SAU phải bị báo. "ok:" = dòng NGAY SAU không được bị báo.
// "todoruleid:" = lỗi thật mà rule CHƯA bắt được (giới hạn đã biết); test không fail vì dòng này.
import express from 'express';
import { escapeHtml } from '../../src/lib/html.js';

const app = express();
const store = { listProducts: () => [], listNotes: () => [] };   // đặt sau dòng `const app = express();`

app.get('/a', (req, res) => {
  // ruleid: rexcorp-express-reflected-xss
  res.send(`<h1>Kết quả cho: ${req.query.q}</h1>`);
});

app.get('/b', (req, res) => {
  const q = String(req.query.q ?? '');
  // ruleid: rexcorp-express-reflected-xss
  res.write('<h1>Kết quả cho: ' + q + '</h1>');
});

app.get('/c', (req, res) => {
  const { name } = req.params;
  // ruleid: rexcorp-express-reflected-xss
  res.status(200).send('<p>' + name + '</p>');
});

app.get('/d', (req, res) => {
  const q = req.query.q ?? '';
  // ok: rexcorp-express-reflected-xss
  res.send(`<h1>Kết quả cho: ${escapeHtml(q)}</h1>`);
});

app.get('/e', (req, res) => {
  // ok: rexcorp-express-reflected-xss
  res.send('<h1>Trang tìm kiếm</h1>');
});

app.get('/f', (req, res) => {
  const { q } = req.query;
  // ok: rexcorp-express-reflected-xss
  res.json({ q });
});

app.get('/g', (req, res) => {
  const items = store.listProducts({ category: req.query.category });
  // ok: rexcorp-express-reflected-xss
  res.end(`<ul>${items.map((p) => `<li>${p.name}</li>`).join('')}</ul>`);
});

app.get('/h', (req, res) => {
  // Ranh giới của sanitizer: chỉ listProducts được tin. listNotes (ghi chú do người dùng nhập)
  // không được thêm vào rule, nên dữ liệu đi qua nó vẫn bị báo.
  const notes = store.listNotes(req.params.id);
  // ruleid: rexcorp-express-reflected-xss
  res.end(`<ul>${notes.map((n) => `<li>${n.text}</li>`).join('')}</ul>`);
});

// Giới hạn đã biết: taint của Semgrep CE chỉ theo dõi trong MỘT hàm. Ở đây q là tham số của
// sendPage(), không có nguồn req.* nào nhìn thấy được bên trong hàm này.
function sendPage(res, q) {
  // todoruleid: rexcorp-express-reflected-xss
  res.send(`<h1>${q}</h1>`);
}

app.get('/i', (req, res) => sendPage(res, req.query.q));
