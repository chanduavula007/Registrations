const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ===== Routes =====
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/students', require('./routes/students'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🎓 Student Registration API is running.' });
});

// ===== Seed default admin =====
const seedAdmin = async () => {
  const Admin = require('./models/Admin');
  const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (!existing) {
    await Admin.create({
      email:    process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      name:     'Administrator',
    });
    console.log(`✅ Admin seeded → ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${process.env.ADMIN_EMAIL}`);
  }
};

// ===== MongoDB Connection =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
