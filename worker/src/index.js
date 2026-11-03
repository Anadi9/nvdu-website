// Cloudflare Worker for the site's two server tasks. Stubs: no keys live here.
//   POST /api/visit             a visit request from /visit/ → an email to the family
//   POST /api/gift/order        start a Razorpay order for a gift from /support/
//   POST /api/gift/webhook      Razorpay's payment notice → receipt email (and 80G certificate, if it applies)
// Secrets are set with `wrangler secret put` (see README); without them the endpoints answer 503, not a fake success.

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function visit(request, env) {
  let b; try { b = await request.json(); } catch { return json({ error: 'Send the request as JSON.' }, 400); }
  const errors = {};
  if (!b || !String(b.name || '').trim()) errors.name = 'Please add your name.';
  if (!b || !EMAIL.test(String(b.email || ''))) errors.email = 'Please add an email the family can reply to.';
  if (Object.keys(errors).length) return json({ errors }, 422);
  const size = Math.max(1, Math.min(60, parseInt(b.size, 10) || 2));
  const msg = {
    to: env.FAMILY_EMAIL, replyTo: b.email,
    subject: `Visit request · ${b.name}${b.date ? ' · ' + b.date : ''}`,
    text: [`Name: ${b.name}`, `Email: ${b.email}`, `Date: ${b.date || 'not given'}`, `People: ${size}`, `Would like: ${(b.wants || []).join(', ') || 'not given'}`, '', String(b.msg || '')].join('\n'),
  };
  if (!env.FAMILY_EMAIL || !env.MAILER) return json({ error: 'Visit requests are not connected yet.', preview: msg }, 503);
  await env.MAILER.send(msg); // an email binding or a provider client, wired up at deploy time
  return json({ ok: true });
}

export async function giftOrder(request, env) {
  let b; try { b = await request.json(); } catch { return json({ error: 'Send the gift as JSON.' }, 400); }
  const rupees = Number(b && b.amount);
  if (!Number.isFinite(rupees) || rupees < 1) return json({ errors: { amount: 'Choose an amount.' } }, 422);
  if (!b.name || !EMAIL.test(String(b.email || ''))) return json({ errors: { email: 'Please add an email we can send the receipt to.' } }, 422);
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return json({ error: 'Payments are not connected yet.' }, 503);
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Basic ' + btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET) },
    body: JSON.stringify({ amount: Math.round(rupees * 100), currency: 'INR', notes: { purpose: String(b.purpose || ''), name: String(b.name), email: String(b.email), dedication: String(b.ded || ''), show_name: b.show ? 'yes' : 'no', pan: b.pan ? 'given' : 'no' } }),
  });
  if (!res.ok) return json({ error: 'The payment could not be started. Nothing was taken.' }, 502);
  const order = await res.json();
  return json({ order_id: order.id, amount: order.amount, key_id: env.RAZORPAY_KEY_ID });
}

async function hmacHex(secret, body) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
export async function giftWebhook(request, env) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return json({ error: 'Payments are not connected yet.' }, 503);
  const body = await request.text(), given = request.headers.get('x-razorpay-signature') || '';
  const want = await hmacHex(env.RAZORPAY_WEBHOOK_SECRET, body);
  if (given.length !== want.length || given !== want) return json({ error: 'Signature does not match.' }, 401);
  const ev = JSON.parse(body);
  if (ev.event === 'payment.captured' && env.MAILER) {
    const p = ev.payload.payment.entity, n = p.notes || {};
    await env.MAILER.send({ to: n.email, subject: 'Your thread is tied · receipt', text: `Thank you, ${n.name}. We received ₹${(p.amount / 100).toLocaleString('en-IN')} for: ${n.purpose}. Receipt no. ${p.id}. [80G certificate if it applies]` });
  }
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method !== 'POST') return json({ error: 'Not found' }, 404);
    if (pathname === '/api/visit') return visit(request, env);
    if (pathname === '/api/gift/order') return giftOrder(request, env);
    if (pathname === '/api/gift/webhook') return giftWebhook(request, env);
    return json({ error: 'Not found' }, 404);
  },
};
