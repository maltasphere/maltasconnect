# MaltaSConnect!

A brutalist, technical, and ultra-minimalist voice & text communication app built with React, Express, SQLite, and LiveKit. Designed with a clean JetBrains Mono UI and optimized for both web browsers and Tauri desktop application integration.

---

## Features

- **Real-Time Voice & Video**: Powered by LiveKit Cloud for low-latency audio rooms, screen sharing, and camera streams.
- **Persistent Text Chat**: Text chat rooms with history saved locally in a SQLite database (`chat.db`).
- **Interactive UI Indicators**: Live visual speaking waves, mute/unmute indicators, and connection status/latency (RTT) monitors.
- **Secure File Sharing**: Integrated upload channel for files (images, PDFs, ZIPs, text documents) with strict file-type & extension validation on the server side to prevent script execution vulnerabilities.
- **Security-First Architecture**: 
  - **Global Console Redaction**: Intercepts browser logs to redact sensitive LiveKit access tokens and connection parameters.
  - **Reverse Proxy Protection**: Trust-proxy headers configured for seamless Cloudflare Tunnel usage (safeguarding rate limiting from blocking local tunnel interfaces).
  - **Security Headers**: Standard Helmet security headers and request throttling (rate limiting) on api routes.

---

## Tech Stack

- **Frontend**: React, Vite (Production assets served statically under `dist/`)
- **Styling**: JetBrains Mono & brutalist styling, responsive layout transitions
- **Backend**: Node.js, Express
- **Real-Time RTC**: LiveKit Client SDK (Client) & LiveKit Server SDK (Token management)
- **Database**: SQLite3
- **File Uploads**: Multer (configured with strict MIME & extension verification)

---

## Setup & Running

### 1. Prerequisites
Ensure you have **Node.js** (v18+) installed on your machine.

### 2. Environment Variables (`.env`)
Create a `.env` file in the root directory of the project:

```env
PORT=3013
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
```

*Note: You can retrieve your credentials by setting up a free project on [LiveKit Cloud](https://livekit.io/).*

### 3. Installation
Install all dependencies using npm:

```bash
npm install
```

### 4. Running the Application
Start the Node.js Express server to serve both the backend API and the static React bundle:

```bash
npm run server
```

The application will be running at `http://localhost:3013`.

---

## Production & Tunnel Deployment

When publishing the application using **Cloudflare Tunnel** or similar reverse proxies:
- The rate limiter will automatically resolve clients' real IPs via headers (like `X-Forwarded-For`), protecting the app from brute-force/DDoS attempts without blocking all users.
- LiveKit tokens are securely generated server-side and fully redacted from client-side console logs to prevent exposure to unauthorized users.
- Any uploaded files are safely sanitized and stored under the `/uploads` route with executable extensions (such as `.html`, `.js`, etc.) strictly blocked.

---

## License
Private / Proprietary. Owned by maltasphere.
