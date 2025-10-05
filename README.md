# Personal Website

A macOS-inspired personal website with draggable, resizable app windows, a top bar, and multiple built-in apps:
- Blog (Markdown viewer)
- Tutorial.md (raw Markdown viewer with syntax highlighting)
- About Me
- Email (contact form)
- Feedback (feedback form)
- Python IDE (in-browser Python via Skulpt + CodeMirror)

Everything runs as static HTML/CSS/JS on the client, with optional serverless/local endpoints for sending emails and feedback.

---

## Features

- Window system
  - Consistent headers and window controls (minimize, fullscreen, close)
  - Draggable by header, resizable via a bottom-right handle
  - Click-to-front stacking and z-index management (windows are always above the top bar)
  - Fullscreen respects configurable offsets under the top bar
  - Centered by default with a white panel, rounded corners, and shadow

- Apps
  - Blog: Loads `.md` posts from `blogs/`, renders with Marked + DOMPurify, code highlighted via highlight.js
  - Tutorial.md: Shows raw Markdown (code view) with syntax highlighting
  - About Me: Placeholder text and social links (GitHub/Discord) using SVG icons you provide
  - Email: Contact form posts to `/api/send-email` (Gmail SMTP via serverless/local API)
  - Feedback: Simple feedback form posts to `/api/send-feedback` (same backend flow)
  - Python IDE: Skulpt + CodeMirror, run Python code in the browser with a console panel

- Deployment flexibility
  - Vercel serverless functions provided for production
  - Local Express server for easy local testing (no Vercel required)

---

## Tech Stack

- Frontend
  - HTML/CSS/JS, custom window manager
  - Marked (Markdown parsing) + DOMPurify (sanitization)
  - highlight.js (code highlighting)
  - CodeMirror (Python syntax highlighting)
  - Skulpt (Python-in-the-browser)

- Backend (for email/feedback)
  - nodemailer (Gmail SMTP)
  - Vercel Serverless Functions (production)
  - Express server (local development)

---

## Project Structure

```
Personal Website/
├─ index.html                 # Main page (apps, desktop icons, scripts)
├─ static/
│  ├─ css/                    # Styles
│  ├─ js/                     # Site scripts (window management, etc.)
│  └─ images/                 # Icons/images (supply SVGs here)
├─ blogs/
│  ├─ HowToMakeBlog.md        # Authoring guide for blog posts
│  ├─ Tutorial.md             # Tutorial app content (raw markdown display)
│  └─ index.json              # Optional manifest for blog posts on production
├─ api/
│  ├─ send-email.js           # Vercel serverless function for contact form
│  └─ send-feedback.js        # Vercel serverless function for feedback form
├─ server.js                  # Local Express server (email/feedback + static)
├─ package.json               # Dependencies (for local server + serverless)
├─ .nojekyll                  # Disables Jekyll on GitHub Pages (safe to keep)
├─ README.md                  # This file
└─ VercelSetup.md             # Detailed Vercel deployment instructions
```

---

## Getting Started (Local)

You can run everything locally without Vercel. The frontend is static and the backend is an Express server that mimics the serverless endpoints.

1) Prerequisites
- Node.js ≥ 18 and npm

2) Install dependencies (in the `Personal Website` directory)
```
npm install
```

3) Create a `.env` file (in the `Personal Website` directory)
```
EMAIL_ADDRESS=your.name@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password   # App Password (2FA required), not your normal Gmail password
PORT=3000
ALLOWED_ORIGIN=http://localhost:3000
```

4) Start the local server
```
npm start
```

5) Open the site
- http://localhost:3000

6) Test email and feedback
- Open the Email app and send a message
- Open the Feedback app and send feedback
- You should see success in the UI and receive emails at `EMAIL_ADDRESS`

---

## Production Deployment (Vercel)

This repository is already structured for Vercel (static site + `api/` serverless functions). Use the included guide:

- See: `VercelSetup.md` for step-by-step instructions

Key points:
- Set the project root to `Personal Website`
- Set environment variables in Vercel:
  - `EMAIL_ADDRESS`
  - `GMAIL_APP_PASSWORD`
  - (optional) `ALLOWED_ORIGIN` if calling API cross-origin
- The frontend posts to `/api/send-email` and `/api/send-feedback` (no changes required)

---

## Blog Authoring

- Put blog posts as `.md` files in `Personal Website/blogs/`
- On production (like Vercel), directory listing isn’t guaranteed. Use a manifest file:
  - `Personal Website/blogs/index.json`
  - Example:
    ```
    [
      "Tutorial.md",
      "HowToMakeBlog.md"
    ]
    ```
- The blog list ignores timestamps and displays filenames (without `.md`) as titles
- See `HowToMakeBlog.md` for authoring tips

---

## Python IDE Notes

- Editor: CodeMirror with Python mode
- Runner: Skulpt
- Console shows program output and errors
- Some Python modules/libraries may not be available in Skulpt
- If cursor or selection visuals look off after resizing/fullscreen toggle, the IDE auto-refreshes the editor

---

## Customization (CSS Variables)

Tune window positions, default sizes, and fullscreen offsets via CSS variables (in your CSS). Common examples:

- Fullscreen offsets (global)
```
:root {
  --window-top-offset: 100px;
  --window-side-margin: 16px;
  --window-bottom-margin: 16px;
}
```

- Per-app fullscreen offsets (override global)
```
:root {
  --blog-window-top-offset: var(--window-top-offset);
  --tutorial-window-top-offset: var(--window-top-offset);
  --about-window-top-offset: var(--window-top-offset);
  --email-window-top-offset: var(--window-top-offset);
  --feedback-window-top-offset: var(--window-top-offset);
  --pyide-window-top-offset: var(--window-top-offset);
}
```

- Default window sizes
```
:root {
  --blog-default-width: min(960px, 90vw);
  --blog-default-height: min(680px, calc(100vh - 120px));

  --tutorial-default-width: min(960px, 90vw);
  --tutorial-default-height: min(680px, calc(100vh - 120px));

  --about-default-width: min(720px, 80vw);
  --about-default-height: min(520px, calc(100vh - 160px));

  --email-default-width: min(900px, 90vw);
  --email-default-height: min(680px, calc(100vh - 120px));

  --pyide-default-width: min(1000px, 95vw);
  --pyide-default-height: min(720px, calc(100vh - 140px));
}
```

- Desktop icon positions
```
:root {
  --tutorial-app-top: 200px;  --tutorial-app-left: 140px;
  --about-app-top: 280px;     --about-app-left: 35px;
  --email-app-top: 360px;     --email-app-left: 35px;
  --feedback-app-top: 420px;  --feedback-app-left: 35px;
  --pyide-app-top: 500px;     --pyide-app-left: 35px;
}
```

Notes:
- Windows are always layered above the top bar by design
- Windows default to centered layout (absolute + translate)

---

## Security & Best Practices

- Email and feedback endpoints use Gmail SMTP with an App Password:
  - Enable 2FA on your Google account, generate an App Password, and store it in env vars
  - Never hardcode secrets in client-side code
- The Blog renderer sanitizes HTML via DOMPurify
- Consider adding honeypot fields or captcha if spam becomes an issue
- CORS: set `ALLOWED_ORIGIN` if you serve the frontend and API from different origins

---

## Troubleshooting

- “Message sent!” but no email received:
  - Confirm `EMAIL_ADDRESS` and `GMAIL_APP_PASSWORD` in env vars
  - Ensure App Password is correct and 2FA is enabled
  - Check server logs for SMTP errors

- Blog posts not showing in production:
  - Add `blogs/index.json` manifest
  - Verify file names/extensions are correct and deploy includes the files

- Windows behind the top bar or not draggable:
  - This project sets windows to z-index above the top bar by default
  - Dragging is bound to headers; ensure app header ID selectors are correct

- Local wildcard route error in Express:
  - This project uses a regex catch-all (`app.get(/.*/, ...)`) compatible with Express v5/path-to-regexp v6

---

## Acknowledgements

- Marked — Markdown parsing
- DOMPurify — XSS-safe HTML sanitization
- highlight.js — Code highlighting for Markdown
- CodeMirror — Editor for the Python IDE
- Skulpt — In-browser Python runtime
- nodemailer — Email sending via SMTP

---

## License

No license specified. All rights reserved by the project owner. If you intend to reuse parts of this code, please contact the owner.

---