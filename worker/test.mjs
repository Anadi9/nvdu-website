// Runs the Worker's handlers in Node 22 with fake requests. No network, no keys.
import worker from './src/index.js';
import assert from 'node:assert/strict';
const post = (path, body, headers = {}) => new Request('https://example.test' + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const sent = []; const MAILER = { send: async (m) => sent.push(m) };

let r = await worker.fetch(post('/api/visit', { name: '', email: 'x' }), {});
assert.equal(r.status, 422); assert.deepEqual((await r.json()).errors, { name: 'Please add your name.', email: 'Please add an email the family can reply to.' });
r = await worker.fetch(post('/api/visit', { name: 'Asha', email: 'asha@example.com', size: 2, wants: ['Night at the telescope'] }), {});
assert.equal(r.status, 503, 'not connected without settings');
r = await worker.fetch(post('/api/visit', { name: 'Asha', email: 'asha@example.com', size: 2, wants: ['Night at the telescope'] }), { FAMILY_EMAIL: 'family@example.com', MAILER });
assert.equal(r.status, 200); assert.equal(sent[0].replyTo, 'asha@example.com'); assert.match(sent[0].text, /Night at the telescope/);

r = await worker.fetch(post('/api/gift/order', { amount: 1100, name: 'Asha', email: 'asha@example.com' }), {});
assert.equal(r.status, 503, 'no keys, no payment');
r = await worker.fetch(post('/api/gift/order', { amount: 0, name: 'Asha', email: 'asha@example.com' }), {});
assert.equal(r.status, 422);

const secret = 'test-secret', body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_test1', amount: 110000, notes: { name: 'Asha', email: 'asha@example.com', purpose: 'Digitise a manuscript' } } } } });
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const sig = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))].map((x) => x.toString(16).padStart(2, '0')).join('');
r = await worker.fetch(post('/api/gift/webhook', body, { 'x-razorpay-signature': 'bad' + sig.slice(3) }), { RAZORPAY_WEBHOOK_SECRET: secret, MAILER });
assert.equal(r.status, 401);
r = await worker.fetch(post('/api/gift/webhook', body, { 'x-razorpay-signature': sig }), { RAZORPAY_WEBHOOK_SECRET: secret, MAILER });
assert.equal(r.status, 200); assert.match(sent.at(-1).text, /₹1,100 for: Digitise a manuscript/);

r = await worker.fetch(new Request('https://example.test/api/visit'), {});
assert.equal(r.status, 404);
console.log('worker: all checks passed');
