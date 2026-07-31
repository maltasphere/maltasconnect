# MaltaSConnect!

A brutalist, technical, and ultra-minimalist voice & text communication app built with React, Express, SQLite, and LiveKit. Designed with a clean JetBrains Mono UI and optimized for both web browsers and Tauri desktop application integration.

---

## Features

- **Real-Time Voice & Video**: Powered by LiveKit for low-latency audio rooms, screen sharing, and camera streams.
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
Ensure you have **Node.js** (v18+) and **Docker** installed on your machine/server.

### 2. Environment Variables (`.env`)
Create a `.env` file in the root directory of the project:

```env
VITE_LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret_123456789
VITE_API_URL=https://yourdomain.com
```

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

## Self-Hosted LiveKit Server Setup (Home Server / VPS)

LiveKit is fully open-source and can be self-hosted on your home server or VPS with **zero usage limits** and **full support for screen sharing, audio, and video**.

### 1. Run LiveKit Server with Docker (Auto-Start on Boot)

Run the following command on your Home Server. The `--restart unless-stopped` flag ensures that the LiveKit container **automatically starts whenever the computer or Docker restarts**:

```bash
sudo docker run -d \
  --name livekit-server \
  --restart unless-stopped \
  -p 7880:7880 \
  -p 7881:7881 \
  -p 7882:7882/udp \
  -e LIVEKIT_KEYS="your_key: your_secret" \
  livekit/livekit-server \
  --config /dev/null
```

> **Note:** Make sure Docker service itself is enabled on system boot (standard on Ubuntu/Debian):
> ```bash
> sudo systemctl enable docker
> ```

### 2. Cloudflare Tunnel Configuration

1. Open **Cloudflare Zero Trust Dashboard** -> **Networks** -> **Tunnels** -> Edit your tunnel.
2. Add a Public Hostname:
   - **Subdomain:** `livekit`
   - **Domain:** `yourdomain.com`
   - **Type:** `HTTP`
   - **URL:** `localhost:7880`
3. Test by opening `https://livekit.yourdomain.com` in your browser. It should display `OK`.

### 3. Useful Docker Commands

- **Check LiveKit status:** `sudo docker ps`
- **View LiveKit logs:** `sudo docker logs -f livekit-server`
- **Restart LiveKit:** `sudo docker restart livekit-server`
- **Stop LiveKit:** `sudo docker stop livekit-server`

---

## Production & Tunnel Deployment

When publishing the application using **Cloudflare Tunnel** or similar reverse proxies:
- The rate limiter will automatically resolve clients' real IPs via headers (like `X-Forwarded-For`), protecting the app from brute-force/DDoS attempts without blocking all users.
- LiveKit tokens are securely generated server-side and fully redacted from client-side console logs to prevent exposure to unauthorized users.
- Any uploaded files are safely sanitized and stored under the `/uploads` route with executable extensions (such as `.html`, `.js`, etc.) strictly blocked.

---

## License
Private / Proprietary. Owned by maltasphere.
