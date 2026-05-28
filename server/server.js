const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ===== CORS =====
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

// ===== API Routes =====
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/students', require('./routes/students'));

// ===== Serve React Frontend (for Render — single server setup) =====
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({ message: 'Student Registration API is running.' });
    }
  });
});

// ===== Seed Admins =====
const seedAdmin = async () => {
  const Admin = require('./models/Admin');
  const admins = [
    { email: process.env.ADMIN_EMAIL,    password: process.env.ADMIN_PASSWORD, name: 'Administrator' },
    { email: 'chanduavula007@gmail.com', password: process.env.ADMIN2_PASSWORD || 'Chandu0007', name: 'Chandu Avula' },
  ];
  for (const a of admins) {
    if (!a.email) continue;
    const existing = await Admin.findOne({ email: a.email.toLowerCase() });
    if (!existing) {
      await Admin.create(a);
      console.log(`✅ Admin seeded: ${a.email}`);
    }
  }
};

// ===== MongoDB =====
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in environment variables.');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedAdmin();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
