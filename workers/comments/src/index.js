import { EmailMessage } from 'cloudflare:email';

// AirbrushDOC comments — Cloudflare Worker + D1, moderated via Telegram inline buttons.
// GET  /comments?slug=<slug>   → approved comments, oldest first
// POST /comments               → save as pending, notify Telegram
// POST /tg-webhook             → Telegram callback (approve/reject buttons)

const MAX_AUTHOR = 80;
const MAX_BODY = 2000;
const RATE_LIMIT_PER_HOUR = 5;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    try {
      if (url.pathname === '/comments' && req.method === 'GET') return listComments(url, env, cors);
      if (url.pathname === '/comments' && req.method === 'POST') return createComment(req, env, cors);
      if (url.pathname === '/contact' && req.method === 'POST') return createMessage(req, env, cors);
      if (url.pathname === '/tg-webhook' && req.method === 'POST') return telegramWebhook(req, env);
      return json({ error: 'not found' }, 404, cors);
    } catch (e) {
      console.error(e);
      return json({ error: 'server error' }, 500, cors);
    }
  },
};

function corsHeaders(origin, env) {
  const exact = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = exact.includes(origin) || /^https:\/\/[a-z0-9-]+\.airbrushdoc\.pages\.dev$/.test(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : exact[0] || '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  });
}

async function listComments(url, env, cors) {
  const slug = url.searchParams.get('slug') || '';
  if (!SLUG_RE.test(slug)) return json({ error: 'bad slug' }, 400, cors);
  const { results } = await env.DB.prepare(
    "SELECT id, author, body, parent_id, avatar_hash, created_at FROM comments WHERE slug = ? AND status = 'approved' ORDER BY created_at ASC"
  ).bind(slug).all();
  return json({ comments: results }, 200, cors);
}

async function createComment(req, env, cors) {
  let data;
  try { data = await req.json(); } catch { return json({ error: 'bad json' }, 400, cors); }

  const slug = String(data.slug || '');
  const author = String(data.author || '').trim();
  const body = String(data.body || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const honeypot = String(data.website || '');
  const parentId = Number(data.parent_id) || null;

  if (honeypot) return json({ ok: true }, 200, cors); // bot filled the trap — pretend success
  if (!SLUG_RE.test(slug)) return json({ error: 'bad slug' }, 400, cors);
  if (!author || author.length > MAX_AUTHOR) return json({ error: 'name required (max 80 chars)' }, 400, cors);
  if (!body || body.length > MAX_BODY) return json({ error: 'comment required (max 2000 chars)' }, 400, cors);
  if (email && (email.length > 200 || !email.includes('@'))) return json({ error: 'invalid email' }, 400, cors);

  if (parentId) {
    const parent = await env.DB.prepare(
      "SELECT id FROM comments WHERE id = ? AND slug = ? AND status = 'approved'"
    ).bind(parentId, slug).first();
    if (!parent) return json({ error: 'invalid parent comment' }, 400, cors);
  }

  // email itself is never stored — only its hash, for Gravatar lookup
  const avatarHash = email ? await sha256(email) : null;
  const ip = req.headers.get('CF-Connecting-IP') || '';
  const ipHash = await sha256(ip);

  const { results } = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM comments WHERE ip_hash = ? AND created_at > datetime('now', '-1 hour')"
  ).bind(ipHash).all();
  if (results[0].n >= RATE_LIMIT_PER_HOUR) return json({ error: 'too many comments, try again later' }, 429, cors);

  const res = await env.DB.prepare(
    'INSERT INTO comments (slug, author, body, ip_hash, parent_id, avatar_hash) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(slug, author, body, ipHash, parentId, avatarHash).run();

  await notifyTelegram(env, res.meta.last_row_id, slug, author, body);
  return json({ ok: true, pending: true }, 201, cors);
}

async function createMessage(req, env, cors) {
  let data;
  try { data = await req.json(); } catch { return json({ error: 'bad json' }, 400, cors); }

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const subject = String(data.subject || '').trim().slice(0, 50);
  const body = String(data.message || '').trim();
  const honeypot = String(data.website || '');

  if (honeypot) return json({ ok: true }, 200, cors);
  if (!name || name.length > 80) return json({ error: 'name required (max 80 chars)' }, 400, cors);
  if (!email || email.length > 200 || !email.includes('@')) return json({ error: 'valid email required' }, 400, cors);
  if (!body || body.length > 4000) return json({ error: 'message required (max 4000 chars)' }, 400, cors);

  const ip = req.headers.get('CF-Connecting-IP') || '';
  const ipHash = await sha256(ip);

  const { results } = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM messages WHERE ip_hash = ? AND created_at > datetime('now', '-1 hour')"
  ).bind(ipHash).all();
  if (results[0].n >= 3) return json({ error: 'too many messages, try again later' }, 429, cors);

  const res = await env.DB.prepare(
    'INSERT INTO messages (name, email, subject, body, ip_hash) VALUES (?, ?, ?, ?, ?)'
  ).bind(name, email, subject, body, ipHash).run();

  if (env.TG_BOT_TOKEN && env.TG_CHAT_ID) {
    const text =
      `📨 Contact message #${res.meta.last_row_id}\n` +
      `From: ${name} <${email}>\n` +
      (subject ? `Topic: ${subject}\n` : '') +
      `\n${body.slice(0, 3500)}${body.length > 3500 ? '…' : ''}\n\n` +
      `Reply by email: ${email}`;
    const r = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text }),
    });
    if (!r.ok) console.error('telegram contact notify failed', await r.text());
  }

  // Also deliver as email — Reply-To carries the visitor, so a plain
  // Gmail "Reply" answers them directly.
  if (env.EMAIL) {
    try {
      const clean = (s) => s.replace(/[\r\n]+/g, ' ').trim(); // header-injection guard
      const raw =
        `From: AirbrushDOC Contact Form <noreply@airbrushdoc.com>\r\n` +
        `To: airbrushden@gmail.com\r\n` +
        `Reply-To: ${clean(name)} <${clean(email)}>\r\n` +
        `Subject: [Contact] ${clean(subject) || 'New message'} — ${clean(name)}\r\n` +
        `Message-ID: <contact-${res.meta.last_row_id}-${Date.now()}@airbrushdoc.com>\r\n` +
        `Date: ${new Date().toUTCString()}\r\n` +
        `MIME-Version: 1.0\r\n` +
        `Content-Type: text/plain; charset=utf-8\r\n` +
        `\r\n` +
        `${body}\r\n\r\n—\nMessage #${res.meta.last_row_id} via airbrushdoc.com/contact\nFrom: ${clean(name)} <${clean(email)}>\n`;
      await env.EMAIL.send(new EmailMessage('noreply@airbrushdoc.com', 'airbrushden@gmail.com', raw));
    } catch (e) {
      console.error('email delivery failed', e); // TG + D1 already succeeded — don't fail the request
    }
  }
  return json({ ok: true }, 201, cors);
}

async function notifyTelegram(env, id, slug, author, body) {
  if (!env.TG_BOT_TOKEN || !env.TG_CHAT_ID) return; // not configured yet — comment stays pending
  const text =
    `💬 New comment #${id}\n` +
    `Post: https://airbrushdoc.com/blog/${slug}/\n` +
    `From: ${author}\n\n` +
    body.slice(0, 500) + (body.length > 500 ? '…' : '');
  const r = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TG_CHAT_ID,
      text,
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Approve', callback_data: `a:${id}` },
          { text: '❌ Reject', callback_data: `r:${id}` },
        ]],
      },
    }),
  });
  if (!r.ok) console.error('telegram notify failed', await r.text());
}

async function telegramWebhook(req, env) {
  if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.TG_WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  const update = await req.json();
  const cb = update.callback_query;
  if (!cb || !cb.data) return json({ ok: true });

  const m = cb.data.match(/^([ar]):(\d+)$/);
  if (m) {
    const status = m[1] === 'a' ? 'approved' : 'rejected';
    await env.DB.prepare('UPDATE comments SET status = ? WHERE id = ?').bind(status, Number(m[2])).run();

    const tg = (method, body) =>
      fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: status === 'approved' ? 'Approved ✅' : 'Rejected ❌' });
    await tg('editMessageText', {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: cb.message.text + `\n\n— ${status.toUpperCase()}`,
    });
  }
  return json({ ok: true });
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
