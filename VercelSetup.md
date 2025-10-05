# Deploying “Personal Website” to Vercel

This document explains how to deploy this project to Vercel, configure environment variables, and verify the email sending endpoint. The site is a static front-end with a serverless API for sending emails via Gmail SMTP.

## Overview

- Frontend: Static files served from “Personal Website/”
- Serverless API: “Personal Website/api/send-email.js” (POST /api/send-email)
- Local dev server (for local only): “Personal Website/server.js” (do not use on Vercel)
- Email sending via Gmail SMTP using environment variables:
  - `EMAIL_ADDRESS`
  - `GMAIL_APP_PASSWORD`

The frontend Email app posts to `/api/send-email`. In production, this is handled by the serverless function. Locally, it can be handled by the Express server or by Vercel CLI emulation.

---

## Repository layout (relevant parts)

- `Personal Website/index.html` — the main page
- `Personal Website/static/` — CSS, JS, images
- `Personal Website/api/send-email.js` — Vercel Serverless Function for sending emails
- `Personal Website/package.json` — dependencies for the serverless function (e.g., nodemailer)
- `Personal Website/server.js` — local Express server for email testing (not used on Vercel)
- `Personal Website/.nojekyll` — irrelevant to Vercel but harmless

---

## Prerequisites

- A Git provider (e.g., GitHub) connected to Vercel
- A Gmail account with 2FA enabled and a Gmail App Password generated
- The repo contains the `Personal Website/` directory at the root of the repo

---

## One-time Vercel project setup

1) Import the repository
- Log in to Vercel and click “Add New Project” → “Import Git Repository.”

2) Configure the Project Settings
- Root Directory: set to `Personal Website`
  - This ensures Vercel treats `Personal Website/` as the project root (serving static files and picking up the `api/` function).
- Framework Preset: `Other`
- Build & Output:
  - Build Command: leave empty (no build step required)
  - Output Directory: `.` (the root of `Personal Website`)
  - Install Command: leave default (Vercel will install dependencies from `Personal Website/package.json` for functions)

3) Environment Variables (Settings → Environment Variables)
- Add the following for each environment (Preview/Production):
  - `EMAIL_ADDRESS` — your Gmail address that will receive messages
  - `GMAIL_APP_PASSWORD` — the Gmail App Password (NOT your normal password)
  - (Optional) `ALLOWED_ORIGIN` — set if the site will call the API from a different origin. If the frontend and API are on the same Vercel domain, this is not necessary.

4) Deploy
- Click “Deploy.” Vercel will upload your static site and configure the serverless function at `/api/send-email`.

---

## How the API and frontend interact

- The Email app posts to `/api/send-email`.
- The serverless function at `api/send-email.js`:
  - Validates inputs (`name`, `from`, `subject`, `message`)
  - Uses `nodemailer` to send email via Gmail SMTP
  - Uses `EMAIL_ADDRESS` for the authenticated user and `GMAIL_APP_PASSWORD` for authentication
  - Sets `replyTo` to the sender’s email so you can reply without exposing your address on the client

Note: Your email address and app password never appear in the frontend code.

---

## Local development options

Option A: Local Express server
- Install dependencies:
  - From `Personal Website/`: `npm install`
- Create `Personal Website/.env`:
  ```
  EMAIL_ADDRESS=your.name@gmail.com
  GMAIL_APP_PASSWORD=your_gmail_app_password
  PORT=3000
  ALLOWED_ORIGIN=http://localhost:3000
  ```
- Run: `npm start`
- Open `http://localhost:3000` and test the Email app.

Option B: Vercel CLI
- Install the Vercel CLI and run `vercel dev` from `Personal Website/` to emulate serverless functions locally.
- This uses the same `/api/send-email` path and environment variables.

---

## Testing the API

Using the UI
- Open the site, go to the Email app, fill the form, click “Send.”
- On success, you should see “Message sent!” in the UI and receive an email at `EMAIL_ADDRESS`.

Using curl
```
curl -X POST https://<your-vercel-deployment>/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "from":"test@example.com",
    "subject":"Hello",
    "message":"This is a test"
  }'
```

---

## Troubleshooting

- 404 at `/api/send-email`:
  - Ensure Vercel Project “Root Directory” is `Personal Website` so that `api/` is at the project root for Vercel.
- SMTP auth failed:
  - Verify `EMAIL_ADDRESS` and `GMAIL_APP_PASSWORD` are set in Vercel Environment Variables.
  - `GMAIL_APP_PASSWORD` must be an App Password created after enabling 2FA.
- CORS error:
  - If frontend and API are on different origins, set `ALLOWED_ORIGIN` to your frontend origin.
- Function cold starts:
  - Serverless functions may have a slight delay on first call. This is normal and usually minimal.

---

## Security best practices

- Do not expose your email in client-side code.
- Use Gmail App Passwords and 2FA; never use a regular Gmail password for SMTP.
- Consider rate limiting, spam traps/honeypots, or captcha for production contact forms.

---

## Deployment checklist

- [ ] Vercel project created and linked to repo
- [ ] Root Directory set to `Personal Website`
- [ ] Framework Preset `Other`
- [ ] Build Command: (empty), Output Directory: `.`
- [ ] `EMAIL_ADDRESS` and `GMAIL_APP_PASSWORD` set in Vercel env
- [ ] (Optional) `ALLOWED_ORIGIN` set if needed
- [ ] Deployed successfully
- [ ] `/api/send-email` returns 200 OK via UI or curl test

---

## Notes about `server.js` (local only)

- `server.js` is for local development convenience and will not run on Vercel.
- Vercel runs the serverless function in `api/send-email.js` for all production and preview environments.

---

## Summary

- The frontend is static, the email endpoint is a Vercel Serverless Function at `/api/send-email`.
- Environment variables drive the email credentials and optional CORS policy.
- With the project root set to `Personal Website`, Vercel will discover both static files and the `api/` folder automatically.
