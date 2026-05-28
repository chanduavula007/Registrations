const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
// Allow all origins (tunnel URLs change every time, so wildcard is fine)
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

// ===== API Routes =====
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/students', require('./routes/students'));

// ===== Serve React Frontend =====
// Works both locally (../client/dist) and on Render (same relative path from repo root)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
console.log(`📁 Serving static files from: ${clientDist}`);
app.use(express.static(clientDist));

// For any non-API route, serve the React app (SPA fallback)
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Could not serve index.html:', err.message);
      res.status(404).json({ error: 'Frontend not found. Build may be missing.' });
    }
  });
});

// ===== Seed default admins =====
const seedAdmin = async () => {
  const Admin = require('./models/Admin');

  const admins = [
    {
      email:    process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      name:     'Administrator',
    },
    {
      email:    'chanduavula007@gmail.com',
      password: 'Chandu@0007',
      name:     'Chandu Avula',
    },
  ];

  for (const a of admins) {
    if (!a.email) continue;
    const existing = await Admin.findOne({ email: a.email.toLowerCase() });
    if (!existing) {
      await Admin.create(a);
      console.log(`✅ Admin seeded → ${a.email}`);
    } else {
      console.log(`ℹ️  Admin already exists: ${a.email}`);
    }
  }
};

// ===== MongoDB Connection =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    await seedAdmin();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📡 To share on internet, run: npx localtunnel --port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
