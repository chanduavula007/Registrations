const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// ===== Routes =====
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/students', require('./routes/students'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🎓 Student Registration API is running.' });
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
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
