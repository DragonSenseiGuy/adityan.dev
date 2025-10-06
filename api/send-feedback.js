'use strict';

/**
 * Vercel Serverless Function: Send feedback via Gmail SMTP
 *
 * Environment variables:
 * - EMAIL_ADDRESS        -> the destination Gmail address (owner's inbox)
 * - GMAIL_APP_PASSWORD   -> the Gmail App Password (NOT your normal password)
 * - ALLOWED_ORIGIN       -> optional CORS origin (default: *)
 *
 * Notes:
 * - The "from" header must be the authenticated Gmail address for Gmail SMTP.
 *   The user's email is inserted as "replyTo" so you can reply directly.
 * - Do not expose EMAIL_ADDRESS in client code; it is read only on the server.
 *
 * Dependencies:
 * - Ensure "nodemailer" is listed in package.json dependencies.
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

// Basic email check (not exhaustive, just avoids obvious bad input)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function json(res, status, payload, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  };
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  // CORS
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
  if (req.method === 'OPTIONS') {
    return json(
      res,
      204,
      {},
      {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
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
      { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
    );
  }

  const toAddress = process.env.EMAIL_ADDRESS;
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  if (!toAddress || !appPassword) {
    return json(
      res,
      500,
      { ok: false, error: 'Server email configuration is missing' },
      { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
    );
  }

  // Simple rate limiting per IP
    const clientIp = getClientIp(req);
    if (!allowRequest(clientIp)) {
      const entry = rateLimiter.get(clientIp) || {};
      console.warn('[send-feedback] Declined: rate_limit', {
        ip: clientIp,
        ua: req.headers['user-agent'] || '',
        count: entry.count,
        reset: entry.reset
      });
      return json(
        res,
        429,
        { ok: false, error: 'Too many requests' },
        { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
      );
    }

  // Parse body safely (Vercel may give parsed JSON or a raw string)
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {
      // leave as string for validation failure below
    }
  }

  const { name, from, message, website, ts } = (body && typeof body === 'object') ? body : {};
  // Optional subject; default to "Website Feedback"
  const subject = (body && typeof body === 'object' && body.subject) ? String(body.subject) : 'Website Feedback';

  // Honeypot: if hidden field is filled, likely a bot. Pretend success.
  if (website && String(website).trim() !== '') {
    console.warn('[send-feedback] Declined: honeypot', {
      ip: clientIp,
      ua: req.headers['user-agent'] || '',
      from
    });
    return json(
      res,
      200,
      { ok: true },
      { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
    );
  }

  // Timestamp check: require minimal dwell time; also guard against future timestamps.
  const nowTs = Date.now();
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || tsNum > nowTs + 300000 || (nowTs - tsNum) < 2000) {
    const delta = Number.isFinite(tsNum) ? (nowTs - tsNum) : null;
    console.warn('[send-feedback] Declined: fast_submit', {
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
      { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
    );
  }

  // Validate fields
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return json(
      res,
      400,
      { ok: false, error: 'Name is required' },
      { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
    );
  }

  if (!from || typeof from !== 'string' || !EMAIL_RE.test(from)) {
    return json(
      res,
      400,
      { ok: false, error: 'A valid email is required' },
      { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
    );
  }

  if (!message || typeof message !== 'string' || message.trim().length < 1) {
    return json(
      res,
      400,
      { ok: false, error: 'Feedback message is required' },
      { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
    );
  }

  // Limit sizes server-side
  const safeName = name.trim().slice(0, 200).replace(/[\r\n]+/g, ' ');
  const safeSubject = String(subject).trim().slice(0, 200).replace(/[\r\n]+/g, ' ');
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

  const textBody = [
    `Feedback from: ${safeName} <${from}>`,
    `Subject: ${safeSubject}`,
    '',
    safeMessage,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111;">
      <p><strong>Feedback from:</strong> ${escapeHtml(safeName)} &lt;${escapeHtml(from)}&gt;</p>
      <p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;" />
      <pre style="white-space:pre-wrap;word-break:break-word;margin:0;">${escapeHtml(safeMessage)}</pre>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${safeName}" <${toAddress}>`, // must match authenticated account for Gmail
      to: toAddress,
      replyTo: from, // reply directly to the sender
      subject: `[Website Feedback] ${safeSubject}`,
      text: textBody,
      html: htmlBody,
    });

    return json(
      res,
      200,
      { ok: true },
      { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
    );
  } catch (err) {
    return json(
      res,
      500,
      { ok: false, error: 'Failed to send feedback' },
      { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
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