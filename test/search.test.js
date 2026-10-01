import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { escapeHtml } from '../src/lib/html.js';

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

test('GET /api/search finds products by name, ignoring case', async () => {
  const res = await fetch(`${baseUrl}/api/search?q=sensor`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.items.map((p) => p.id), ['rx-300']);
});

test('GET /api/search requires q', async () => {
  const res = await fetch(`${baseUrl}/api/search`);
  assert.equal(res.status, 400);
});

test('GET /api/search treats q as plain text, not as a regular expression', async () => {
  const broken = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent('(')}`);
  assert.equal(broken.status, 200);
  assert.deepEqual((await broken.json()).items, []);

  const pattern = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent('rex.*pro')}`);
  assert.deepEqual((await pattern.json()).items, []);
});

test('GET /search renders a result page for a query and a category', async () => {
  const res = await fetch(`${baseUrl}/search?q=rex&category=service`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const html = await res.text();
  assert.match(html, /RexCloud Starter/);
  assert.doesNotMatch(html, /RexBoard Mini/);
});

test('GET /search escapes the query in the HTML it returns', async () => {
  const payload = '<script>alert(1)</script>';
  const res = await fetch(`${baseUrl}/search?q=${encodeURIComponent(payload)}`);
  const html = await res.text();
  assert.ok(!html.includes(payload));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('GET /search rejects an unknown category', async () => {
  const res = await fetch(`${baseUrl}/search?q=rex&category=weapons`);
  assert.equal(res.status, 400);
});

test('escapeHtml encodes the five HTML-special characters', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});
