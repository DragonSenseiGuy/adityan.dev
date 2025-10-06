/**
 * Local Express server for sending email via Gmail SMTP.
 *
 * Environment variables (define these in a .env file for local testing):
 * - EMAIL_ADDRESS       The Gmail address that will receive messages
 * - GMAIL_APP_PASSWORD  The Gmail "App password" (not your normal password)
 * - PORT                Optional. Defaults to 3000
 * - ALLOWED_ORIGIN      Optional. CORS allowed origin (e.g., http://localhost:5173)
 *
 * Notes:
 * - Your email address is never exposed to the client in any response.
 * - The "replyTo" header is set to the sender's email so you can reply directly.
 *
 * Usage:
 *   1) npm install express cors nodemailer dotenv
 *   2) Create a .env file in the same folder as this file:
 *        EMAIL_ADDRESS=your.name@gmail.com
 *        GMAIL_APP_PASSWORD=your_app_password_here
 *        PORT=3000
 *        ALLOWED_ORIGIN=http://localhost:3000
 *   3) node server.js
 *   4) POST to http://localhost:3000/api/send-email with JSON:
 *        {
 *          "name": "Sender Name",
 *          "from": "sender@example.com",
 *          "subject": "Hello",
 *          "message": "Your message here"
 *        }
 */

'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Simple in-memory rate limiter per IP (best-effort)
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

// Basic email format check (not exhaustive)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const app = express();
const PORT = Number(process.env.PORT || 3000);

// CORS
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGIN === '*' || origin === ALLOWED_ORIGIN) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 86400,
    credentials: false,
  })
);

// JSON body parsing
app.use(express.json({ limit: '1mb' }));

// Simple request logging
app.use((req, _res, next) => {
  // Avoid logging sensitive bodies
  const { method, url } = req;
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] ${method} ${url}`);
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, status: 'healthy' });
});

// Preflight
app.options('/api/send-email', (req, res) => {
  res.status(204).send();
});
app.options('/api/send-feedback', (req, res) => {
  res.status(204).send();
});

// Email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const toAddress = process.env.EMAIL_ADDRESS;
    const appPassword = process.env.GMAIL_APP_PASSWORD;

    if (!toAddress || !appPassword) {
      return res
        .status(500)
        .json({ ok: false, error: 'Server email configuration is missing' });
    }

    // Simple rate limiting per IP
    const clientIp = getClientIp(req);
    if (!allowRequest(clientIp)) {
      return res.status(429).json({ ok: false, error: 'Too many requests' });
    }
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const from = String(body.from || '').trim();
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();
    const website = String(body.website || '').trim();
    const ts = Number(body.ts);

    // Honeypot and dwell-time checks (pretend success to avoid helping bots)
    if (website) {
      return res.status(200).json({ ok: true });
    }
    const nowTs = Date.now();
    if (!Number.isFinite(ts) || ts > nowTs + 300000 || (nowTs - ts) < 2000) {
      return res.status(200).json({ ok: true });
    }

    if (!name) {
      return res.status(400).json({ ok: false, error: 'Name is required' });
    }
    if (!from || !EMAIL_RE.test(from)) {
      return res
        .status(400)
        .json({ ok: false, error: 'A valid email is required' });
    }
    if (!subject) {
      return res.status(400).json({ ok: false, error: 'Subject is required' });
    }
    if (!message) {
      return res.status(400).json({ ok: false, error: 'Message is required' });
    }

    // Sanitize/limit sizes server-side
    const safeName = name.slice(0, 200).replace(/[\r\n]+/g, ' ');
    const safeSubject = subject.slice(0, 200).replace(/[\r\n]+/g, ' ');
    const safeMessage = message.slice(0, 10000);

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

    // Compose email
    const textBody = [
      `From: ${safeName} <${from}>`,
      `Subject: ${safeSubject}`,
      '',
      safeMessage,
    ].join('\n');

    const htmlBody = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111;">
        <p><strong>From:</strong> ${escapeHtml(safeName)} &lt;${escapeHtml(
      from
    )}&gt;</p>
        <p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;" />
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0;">${escapeHtml(
          safeMessage
        )}</pre>
      </div>
    `;

    await transporter.sendMail({
      from: `"${safeName}" <${toAddress}>`, // must be authenticated user for Gmail
      to: toAddress,
      replyTo: from, // replies go to the sender
      subject: `[Website Contact] ${safeSubject}`,
      text: textBody,
      html: htmlBody,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Email send failed:', err && err.message);
    return res.status(500).json({ ok: false, error: 'Failed to send message' });
  }
});

// Optionally serve your static site for local preview.
// Adjust this if your index.html lives elsewhere.
// Feedback endpoint
app.post('/api/send-feedback', async (req, res) => {
  try {
    const toAddress = process.env.EMAIL_ADDRESS;
    const appPassword = process.env.GMAIL_APP_PASSWORD;

    if (!toAddress || !appPassword) {
      return res
        .status(500)
        .json({ ok: false, error: 'Server email configuration is missing' });
    }

    // Simple rate limiting per IP
    const clientIp = getClientIp(req);
    if (!allowRequest(clientIp)) {
      return res.status(429).json({ ok: false, error: 'Too many requests' });
    }
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const from = String(body.from || '').trim();
    const subjectInput = String(body.subject || 'Website Feedback').trim();
    const message = String(body.message || '').trim();
    const website = String(body.website || '').trim();
    const ts = Number(body.ts);

    // Honeypot and dwell-time checks (pretend success)
    if (website) {
      return res.status(200).json({ ok: true });
    }
    const nowTs = Date.now();
    if (!Number.isFinite(ts) || ts > nowTs + 300000 || (nowTs - ts) < 2000) {
      return res.status(200).json({ ok: true });
    }

    if (!name) {
      return res.status(400).json({ ok: false, error: 'Name is required' });
    }
    if (!from || !EMAIL_RE.test(from)) {
      return res
        .status(400)
        .json({ ok: false, error: 'A valid email is required' });
    }
    if (!message) {
      return res
        .status(400)
        .json({ ok: false, error: 'Feedback message is required' });
    }

    const safeName = name.slice(0, 200).replace(/[\r\n]+/g, ' ');
    const safeSubject = subjectInput.slice(0, 200).replace(/[\r\n]+/g, ' ');
    const safeMessage = message.slice(0, 10000);

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
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

    await transporter.sendMail({
      from: `"${safeName}" <${toAddress}>`,
      to: toAddress,
      replyTo: from,
      subject: `[Website Feedback] ${safeSubject}`,
      text: textBody,
      html: htmlBody,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Feedback send failed:', err && err.message);
    return res.status(500).json({ ok: false, error: 'Failed to send feedback' });
  }
});

app.use(express.static(path.join(__dirname)));

// Fallback to index.html (optional; good for SPAs)
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Local server running on http://localhost:${PORT}\n` +
      `POST emails to http://localhost:${PORT}/api/send-email`
  );
});

/** Minimal HTML escaping for safe HTML bodies */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}