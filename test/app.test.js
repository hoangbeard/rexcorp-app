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

function postNote(id, body, { raw = false } = {}) {
  return fetch(`${baseUrl}/api/products/${id}/notes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw ? body : JSON.stringify(body),
  });
}

test('GET /healthz returns ok', async () => {
  const res = await fetch(`${baseUrl}/healthz`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
  assert.equal(res.headers.get('x-powered-by'), null);
});

test('GET /api/products lists the catalogue and filters by category', async () => {
  const all = await (await fetch(`${baseUrl}/api/products`)).json();
  assert.equal(all.items.length, 4);

  const hw = await (await fetch(`${baseUrl}/api/products?category=hardware`)).json();
  assert.deepEqual(hw.items.map((p) => p.id), ['rx-100', 'rx-300']);
});

test('GET /api/products rejects an unknown category', async () => {
  const res = await fetch(`${baseUrl}/api/products?category=weapons`);
  assert.equal(res.status, 400);
});

test('GET /api/products/:id returns one product or 404', async () => {
  const ok = await fetch(`${baseUrl}/api/products/rx-200`);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).name, 'RexCloud Starter');

  const missing = await fetch(`${baseUrl}/api/products/rx-999`);
  assert.equal(missing.status, 404);
});

test('POST then GET notes for a product', async () => {
  const created = await postNote('rx-200', { author: 'chi.le', text: '  Gia hạn hợp đồng.  ' });
  assert.equal(created.status, 201);
  const note = await created.json();
  assert.equal(note.text, 'Gia hạn hợp đồng.');

  const list = await (await fetch(`${baseUrl}/api/products/rx-200/notes`)).json();
  assert.ok(list.items.some((n) => n.id === note.id));
});

test('POST notes validates author and text', async () => {
  const badAuthor = await postNote('rx-100', { author: 'Chi Le!', text: 'ok' });
  assert.equal(badAuthor.status, 400);

  const emptyText = await postNote('rx-100', { author: 'chi.le', text: '   ' });
  assert.equal(emptyText.status, 400);

  const tooLong = await postNote('rx-100', { author: 'chi.le', text: 'x'.repeat(501) });
  assert.equal(tooLong.status, 400);

  const notObject = await postNote('rx-100', ['chi.le']);
  assert.equal(notObject.status, 400);
});

test('POST notes to an unknown product returns 404', async () => {
  const res = await postNote('rx-999', { author: 'chi.le', text: 'hello' });
  assert.equal(res.status, 404);
});

test('malformed JSON returns a generic 400 without internals', async () => {
  const res = await postNote('rx-100', '{"author":', { raw: true });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'invalid request' });
});

test('unknown routes return 404 JSON', async () => {
  const res = await fetch(`${baseUrl}/admin`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'not found' });
});
