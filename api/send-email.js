'use strict';

/**
 * Vercel Serverless Function: Send email via Gmail SMTP
 *
 * Requirements:
 * - Set environment variables:
 *   - EMAIL_ADDRESS        -> the Gmail address that will receive messages
 *   - GMAIL_APP_PASSWORD   -> the Gmail App Password (NOT your normal password)
 *
 * Notes:
 * - The "from" header will use EMAIL_ADDRESS (as required by Gmail). The user's
 *   email from the form is placed in "replyTo" so you can reply directly.
 * - Never expose your EMAIL_ADDRESS on the client. Keep it only in env vars.
 *
 * Dependencies:
 * - Add "nodemailer" to your project dependencies.
 */

const nodemailer = require('nodemailer');

// Simple in-memory rate limiter per IP (best-effort in serverless)
// Limits: 3 requests per 60 seconds per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 3;
const rateLimiter = new Map();

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  if (Array.isArray(xf) && xf.length) return String(xf[0]).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || '';
}

function allowRequest(ip) {
  const now = Date.now();
  const entry = rateLimiter.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + RATE_LIMIT_WINDOW_MS;
  }
  entry.count += 1;
  rateLimiter.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

// Basic email check (not exhaustive, but avoids obviously bad input)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function json(res, status, payload, extraHeaders = {}) {
  const allowOrigin =
    (typeof res.getHeader === 'function' && res.getHeader('Access-Control-Allow-Origin')) ||
    (extraHeaders && extraHeaders['Access-Control-Allow-Origin']);

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
    ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin } : {}),
  };
  if (headers['Access-Control-Allow-Origin']) {
    headers['Vary'] = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  try { console.log('[send-email] Entry', { method: req.method, origin: req.headers['origin'] || '', ip: getClientIp(req) }); } catch (_) {}
  // CORS (adjust ALLOWED_ORIGIN if you want to restrict)
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
  const ORIGIN = req.headers['origin'] || ALLOWED_ORIGIN;
  const SPAM_PROTECTION = String(process.env.SPAM_PROTECTION || 'on').toLowerCase() !== 'off';
  const ENABLE_SPAM = SPAM_PROTECTION && process.env.NODE_ENV === 'production';
  // Prime CORS headers for all responses
  try {
    res.setHeader('Access-Control-Allow-Origin', ORIGIN);
    res.setHeader('Vary', 'Origin');
  } catch (_) {}
  if (req.method === 'OPTIONS') {
    return json(
      res,
      204,
      {},
      {
        'Access-Control-Allow-Origin': ORIGIN,
        'Vary': 'Origin',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    );
  }

  if (req.method !== 'POST') {
    return json(
      res,
      405,
      { ok: false, error: 'Method Not Allowed' },
      { 'Access-Control-Allow-Origin': ORIGIN }
    );
  }

  const toAddress = process.env.EMAIL_ADDRESS;
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  if (!toAddress || !appPassword) {
    return json(
      res,
      500,
      { ok: false, error: 'Server email configuration is missing' },
      { 'Access-Control-Allow-Origin': ORIGIN }
    );
  }

  // Simple rate limiting per IP
    const clientIp = getClientIp(req);
    if (ENABLE_SPAM && !allowRequest(clientIp)) {
      const entry = rateLimiter.get(clientIp) || {};
      console.warn('[send-email] Declined: rate_limit', {
        ip: clientIp,
        ua: req.headers['user-agent'] || '',
        count: entry.count,
        reset: entry.reset
      });
      return json(
        res,
        429,
        { ok: false, error: 'Too many requests' },
        { 'Access-Control-Allow-Origin': ORIGIN }
      );
    }

  // Parse body safely
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // fall through, body remains string (invalid)
    }
  }

  const { name, from, subject, message, website, ts } = (body && typeof body === 'object') ? body : {};

  // Honeypot field: if filled, likely a bot. Pretend success.
  if (ENABLE_SPAM && website && String(website).trim() !== '') {
    console.warn('[send-email] Declined: honeypot', {
      ip: clientIp,
      ua: req.headers['user-agent'] || '',
      from
    });
    return json(
      res,
      200,
      { ok: true },
      { 'Access-Control-Allow-Origin': ORIGIN }
    );
  }

  // Basic timestamp check: require minimal dwell time to deter bots. Pretend success if suspicious.
  const nowTs = Date.now();
  const tsNum = Number(ts);
  if (ENABLE_SPAM && Number.isFinite(tsNum) && (tsNum > nowTs + 300000 || (nowTs - tsNum) < 2000)) {
    const delta = Number.isFinite(tsNum) ? (nowTs - tsNum) : null;
    console.warn('[send-email] Declined: fast_submit', {
      ip: clientIp,
      ua: req.headers['user-agent'] || '',
      from,
      ts: tsNum,
      delta
    });
    return json(
      res,
      200,
      { ok: true },
      { 'Access-Control-Allow-Origin': ORIGIN }
    );
  }

  // Validate fields
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return json(
      res,
      400,
      { ok: false, error: 'Name is required' },
      { 'Access-Control-Allow-Origin': ORIGIN }
    );
  }

  if (!from || typeof from !== 'string' || !EMAIL_RE.test(from)) {
    return json(
      res,
      400,
      { ok: false, error: 'A valid email is required' },
      { 'Access-Control-Allow-Origin': ORIGIN }
    );
  }

  if (!subject || typeof subject !== 'string' || subject.trim().length < 1) {
    return json(
      res,
      400,
      { ok: false, error: 'Subject is required' },
      { 'Access-Control-Allow-Origin': ORIGIN }
    );
  }

  if (!message || typeof message !== 'string' || message.trim().length < 1) {
    return json(
      res,
      400,
      { ok: false, error: 'Message is required' },
      { 'Access-Control-Allow-Origin': ORIGIN }
    );
  }

  // Optional: truncate very large input
  const safeSubject = subject.trim().slice(0, 200).replace(/[\r\n]+/g, ' ');
  const safeName = name.trim().slice(0, 200).replace(/[\r\n]+/g, ' ');
  const safeMessage = message.trim().slice(0, 10000);

  // Create SMTP transporter for Gmail
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // SSL
    secure: true,
    auth: {
      user: toAddress,
      pass: appPassword,
    },
  });

  // Build message
  const textBody = [
    `From: ${safeName} <${from}>`,
    `Subject: ${safeSubject}`,
    '',
    safeMessage,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111;">
      <p><strong>From:</strong> ${escapeHtml(safeName)} &lt;${escapeHtml(from)}&gt;</p>
      <p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;" />
      <pre style="white-space:pre-wrap;word-break:break-word;margin:0;">${escapeHtml(safeMessage)}</pre>
    </div>
  `;

  try {
    // Optional: verify connection
    // await transporter.verify();

    await transporter.sendMail({
      from: `"${safeName}" <${toAddress}>`, // must be authenticated user for Gmail
      to: toAddress,
      replyTo: from, // reply directly to the sender
      subject: `[Website Contact] ${safeSubject}`,
      text: textBody,
      html: htmlBody,
    });

    console.log('[send-email] Success', {
      ip: clientIp,
      ua: req.headers['user-agent'] || '',
      from,
      subject: `[Website Contact] ${safeSubject}`
    });

    return json(
      res,
      200,
      { ok: true },
      { 'Access-Control-Allow-Origin': ORIGIN }
    );
  } catch (err) {
    // Avoid leaking sensitive info
    return json(
      res,
      500,
      { ok: false, error: 'Failed to send message' },
      { 'Access-Control-Allow-Origin': ORIGIN }
    );
  }
};

/** Minimal HTML escaping for safe HTML body */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}