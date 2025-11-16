const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Database setup
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  // Users table (link creators)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    profile_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Links table
  db.run(`CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    link_code TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Messages table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER NOT NULL,
    sender_username TEXT NOT NULL,
    message_text TEXT,
    message_state TEXT,
    is_dice_question INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (link_id) REFERENCES links(id)
  )`);

  // Message states table (harf harf takip için)
  db.run(`CREATE TABLE IF NOT EXISTS message_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    state_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id)
  )`);
});

// Upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece görsel dosyaları yükleyebilirsiniz!'));
    }
  }
});

// Rastgele sorular
const randomQuestions = [
  "İkinci şanslara inanır mısın?",
  "En büyük korkun nedir?",
  "Hayatındaki en mutlu an?",
  "Bir dilek hakkın olsa ne dilerdin?",
  "En sevdiğin anı?",
  "Gelecekte nerede olmak istersin?",
  "En çok özlediğin kişi kim?",
  "Hayatının anlamı nedir?",
  "En çok neyden korkarsın?",
  "Mutluluğun sırrı nedir?",
  "En büyük hayalin?",
  "Geçmişte değiştirmek istediğin bir şey?",
  "En sevdiğin hobi?",
  "Hayatındaki en önemli ders?",
  "En çok neye değer verirsin?"
];

// API Routes

// Get random question
app.get('/api/random-question', (req, res) => {
  const randomIndex = Math.floor(Math.random() * randomQuestions.length);
  res.json({ question: randomQuestions[randomIndex] });
});

// Create user and link
app.post('/api/setup', upload.single('profileImage'), async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Kullanıcı adı gereklidir!' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Profil görseli gereklidir!' });
    }

    // Clean username (remove @ if exists)
    const cleanUsername = username.replace('@', '').trim().toLowerCase();
    const linkCode = cleanUsername;

    // Check if user exists
    db.get('SELECT id FROM users WHERE username = ?', [cleanUsername], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası!' });
      }

      const profileImagePath = `/uploads/${req.file.filename}`;
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      if (user) {
        // Update existing user
        db.run('UPDATE users SET profile_image = ? WHERE username = ?', 
          [profileImagePath, cleanUsername], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Kullanıcı güncellenemedi!' });
          }

          // Create new link
          db.run('INSERT INTO links (user_id, link_code, expires_at) VALUES (?, ?, ?)',
            [user.id, linkCode, expiresAt.toISOString()], function(err) {
            if (err) {
              return res.status(500).json({ error: 'Bağlantı oluşturulamadı!' });
            }
            res.json({ 
              success: true, 
              link: `/${linkCode}`,
              linkId: this.lastID
            });
          });
        });
      } else {
        // Create new user
        db.run('INSERT INTO users (username, profile_image) VALUES (?, ?)',
          [cleanUsername, profileImagePath], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Kullanıcı oluşturulamadı!' });
          }

          const userId = this.lastID;

          // Create link
          db.run('INSERT INTO links (user_id, link_code, expires_at) VALUES (?, ?, ?)',
            [userId, linkCode, expiresAt.toISOString()], function(err) {
            if (err) {
              return res.status(500).json({ error: 'Bağlantı oluşturulamadı!' });
            }
            res.json({ 
              success: true, 
              link: `/${linkCode}`,
              linkId: this.lastID
            });
          });
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası!' });
  }
});

// Get link info
app.get('/api/link/:linkCode', (req, res) => {
  const { linkCode } = req.params;

  db.get(`SELECT l.*, u.username, u.profile_image 
          FROM links l 
          JOIN users u ON l.user_id = u.id 
          WHERE l.link_code = ? AND l.is_active = 1`,
    [linkCode], (err, link) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası!' });
    }

    if (!link) {
      return res.status(404).json({ error: 'Bağlantı bulunamadı!' });
    }

    // Check if link expired
    const now = new Date();
    const expiresAt = new Date(link.expires_at);
    
    if (now > expiresAt) {
      db.run('UPDATE links SET is_active = 0 WHERE id = ?', [link.id]);
      return res.status(410).json({ error: 'Bu bağlantı süresi dolmuş!' });
    }

    res.json({
      username: link.username,
      profileImage: link.profile_image,
      expiresAt: link.expires_at,
      createdAt: link.created_at
    });
  });
});

// Send message
app.post('/api/message', (req, res) => {
  const { linkCode, senderUsername, messageText, messageStates, isDiceQuestion } = req.body;

  if (!linkCode || !senderUsername || !messageText) {
    return res.status(400).json({ error: 'Eksik bilgi!' });
  }

  // Find active link
  db.get('SELECT id FROM links WHERE link_code = ? AND is_active = 1', 
    [linkCode], (err, link) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası!' });
    }

    if (!link) {
      return res.status(404).json({ error: 'Bağlantı bulunamadı!' });
    }

    // Check expiration
    db.get('SELECT expires_at FROM links WHERE id = ?', [link.id], (err, linkInfo) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası!' });
      }

      const now = new Date();
      const expiresAt = new Date(linkInfo.expires_at);
      
      if (now > expiresAt) {
        db.run('UPDATE links SET is_active = 0 WHERE id = ?', [link.id]);
        return res.status(410).json({ error: 'Bu bağlantı süresi dolmuş!' });
      }

      // Insert message
      db.run('INSERT INTO messages (link_id, sender_username, message_text, is_dice_question) VALUES (?, ?, ?, ?)',
        [link.id, senderUsername, messageText, isDiceQuestion ? 1 : 0], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Mesaj kaydedilemedi!' });
        }

        const messageId = this.lastID;

        // Insert message states if provided (only unique states)
        if (messageStates && messageStates.length > 0) {
          const uniqueStates = [...new Set(messageStates)]; // Remove duplicates
          const stmt = db.prepare('INSERT INTO message_states (message_id, state_text) VALUES (?, ?)');
          uniqueStates.forEach(state => {
            if (state && state.trim().length > 0) {
              stmt.run([messageId, state]);
            }
          });
          stmt.finalize();
        }
        
        // Always save the final message text as a state
        db.run('INSERT INTO message_states (message_id, state_text) VALUES (?, ?)',
          [messageId, messageText]);

        res.json({ success: true, messageId });
      });
    });
  });
});

// Admin panel routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  const adminUsername = 'Deno08';
  const adminPassword = '@3105_6';

  if (username === adminUsername && password === adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı!' });
  }
});

// Get all links for admin
app.get('/api/admin/links', (req, res) => {
  db.all(`SELECT l.*, u.username, u.profile_image,
          (SELECT COUNT(*) FROM messages WHERE link_id = l.id) as message_count
          FROM links l
          JOIN users u ON l.user_id = u.id
          ORDER BY l.created_at DESC`,
    [], (err, links) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası!' });
    }

    const now = new Date();
    const linksWithStatus = links.map(link => {
      const expiresAt = new Date(link.expires_at);
      const hoursLeft = Math.max(0, Math.floor((expiresAt - now) / (1000 * 60 * 60)));
      return {
        ...link,
        hoursLeft,
        isExpired: now > expiresAt
      };
    });

    res.json(linksWithStatus);
  });
});

// Get messages for a link
app.get('/api/admin/link/:linkId/messages', (req, res) => {
  const { linkId } = req.params;

  db.all(`SELECT m.*, 
          (SELECT COUNT(*) FROM message_states WHERE message_id = m.id) as state_count
          FROM messages m
          WHERE m.link_id = ?
          ORDER BY m.created_at DESC`,
    [linkId], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası!' });
    }

    // Get message states for each message
    const messagesWithStates = messages.map((msg, index) => {
      return new Promise((resolve) => {
        db.all('SELECT state_text, created_at FROM message_states WHERE message_id = ? ORDER BY created_at ASC',
          [msg.id], (err, states) => {
          if (err) {
            resolve({ ...msg, states: [] });
          } else {
            resolve({ ...msg, states: states.map(s => s.state_text) });
          }
        });
      });
    });

    Promise.all(messagesWithStates).then(results => {
      res.json(results);
    });
  });
});

// Deactivate link
app.post('/api/admin/link/:linkId/deactivate', (req, res) => {
  const { linkId } = req.params;

  db.run('UPDATE links SET is_active = 0 WHERE id = ?', [linkId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Bağlantı iptal edilemedi!' });
    }
    res.json({ success: true });
  });
});

// Main route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Dynamic route for user links
app.get('/:linkCode', (req, res) => {
  const { linkCode } = req.params;
  res.sendFile(path.join(__dirname, 'public', 'message.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Cleanup expired links periodically
setInterval(() => {
  const now = new Date().toISOString();
  db.run('UPDATE links SET is_active = 0 WHERE expires_at < ? AND is_active = 1', [now], (err) => {
    if (err) {
      console.error('Error cleaning expired links:', err);
    } else {
      console.log('Expired links cleaned');
    }
  });
}, 60 * 60 * 1000); // Every hour

