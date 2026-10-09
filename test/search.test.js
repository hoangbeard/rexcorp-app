import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

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

test('GET /search renders a result page for a query and a category', async () => {
  const res = await fetch(`${baseUrl}/search?q=rex&category=service`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const html = await res.text();
  assert.match(html, /RexCloud Starter/);
  assert.doesNotMatch(html, /RexBoard Mini/);
});

test('GET /search rejects an unknown category', async () => {
  const res = await fetch(`${baseUrl}/search?q=rex&category=weapons`);
  assert.equal(res.status, 400);
});
