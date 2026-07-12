import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust Cloudflare Tunnel proxy to capture the correct client IP for rate limiting
const port = process.env.PORT || 3013;

// Initialize SQLite database
const db = new sqlite3.Database('chat.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      room TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      replyTo TEXT,
      time TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room)`);
});

// Configure File Upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeName = path.basename(file.originalname, safeExt)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .substring(0, 50);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${safeName}-${uniqueSuffix}${safeExt}`);
  }
});

// Safe Mime Types
const ALLOWED_MIME_TYPES = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/markdown',
  'application/zip', 'application/x-zip-compressed'
];

// Safe Extensions corresponding to allowed MIME types
const ALLOWED_EXTENSIONS = [
  '.png', '.jpeg', '.jpg', '.gif', '.webp',
  '.pdf',
  '.txt', '.md',
  '.zip'
];

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB Limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only images, PDFs, text, and zip files are allowed.'));
    }
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Invalid file extension. Only .png, .jpeg, .jpg, .gif, .webp, .pdf, .txt, .md, and .zip files are allowed.'));
    }
    cb(null, true);
  }
});

// 1. Security Headers with Helmet
// Configure CSP to allow LiveKit WebSockets and local resources
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "connect-src": ["'self'", "wss://*.livekit.cloud", "https://*.livekit.cloud"],
      "img-src": ["'self'", "data:", "blob:"],
    },
  },
}));

// 2. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

app.use(express.json());

// 3. CORS - Allow all origins for Tauri compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

const MAX_ROOMS = 50;

// API Routes
app.get('/api/token', async (req, res) => {
  const { room, identity } = req.query;

  // Basic Input Validation
  if (!room || !identity || room.length > 50 || identity.length > 50) {
    return res.status(400).json({ error: 'Invalid room or identity' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'LiveKit API key or secret not configured' });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
    });
    
    at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    res.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

app.get('/api/messages', (req, res) => {
  const { room } = req.query;
  if (!room || room.length > 50) {
    return res.status(400).json({ error: 'Invalid room name' });
  }

  db.all(
    `SELECT id, sender, text, replyTo, time FROM messages WHERE room = ? ORDER BY created_at DESC LIMIT 100`,
    [room],
    (err, rows) => {
      if (err) {
        console.error('Error reading messages:', err);
        return res.status(500).json({ error: 'Failed to retrieve messages' });
      }
      const messages = rows.reverse().map(row => ({
        id: row.id,
        sender: row.sender,
        text: row.text,
        replyTo: row.replyTo ? JSON.parse(row.replyTo) : null,
        time: row.time
      }));
      res.json(messages);
    }
  );
});

app.post('/api/messages', (req, res) => {
  const { room, sender, text, replyTo } = req.body;
  
  if (!room || !sender || !text || room.length > 50 || sender.length > 50 || text.length > 500) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  db.get(`SELECT COUNT(1) as count FROM messages WHERE room = ?`, [room], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (row.count === 0) {
      db.get(`SELECT COUNT(DISTINCT room) as totalRooms FROM messages`, [], (err, roomRow) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (roomRow.totalRooms >= MAX_ROOMS) {
          return res.status(400).json({ error: 'Server room limit reached. Try again later.' });
        }
        saveMessage();
      });
    } else {
      saveMessage();
    }
  });

  function saveMessage() {
    const messageId = `msg_${Math.random().toString(36).substring(2, 11)}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const replyToStr = replyTo ? JSON.stringify(replyTo) : null;
    const createdAt = Date.now();

    db.run(
      `INSERT INTO messages (id, room, sender, text, replyTo, time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [messageId, room, sender, text, replyToStr, time, createdAt],
      function(err) {
        if (err) {
          console.error('Error saving message:', err);
          return res.status(500).json({ error: 'Failed to save message' });
        }

        db.run(
          `DELETE FROM messages WHERE room = ? AND id NOT IN (
            SELECT id FROM messages WHERE room = ? ORDER BY created_at DESC LIMIT 100
          )`,
          [room, room],
          (err) => {
            if (err) console.error('Error cleaning up messages:', err);
          }
        );

        res.status(201).json({
          id: messageId,
          sender,
          text,
          replyTo,
          time
        });
      }
    );
  }
});

// File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the React app (Vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// Error handling middleware for Multer and other errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Max limit is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
