// backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiters');
const errorHandler = require('./middleware/errorHandler');


// Import routes
const userRoutes = require('./routes/userRoutes');
const artistRoutes = require('./routes/artistRoutes'); // NEW
const artworkRoutes = require('./routes/artworkRoutes'); // NEW

dotenv.config();
  
const app = express();
const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully!');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

connectDB();

// Security middleware
app.use(helmet());

const allowedOrigins = new Set([
  'http://localhost:3000',
  'https://artopusindia-internal.onrender.com',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
]);

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header are server-to-server or local tooling.
    if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ''))) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);


app.get('/', (req, res) => {
  res.send('Artopus Backend API is running!');
});

// Use API Routes
app.use('/api/users', userRoutes);
app.use('/api/artists', artistRoutes); // NEW
app.use('/api/artworks', artworkRoutes); // NEW

// Global error handler
app.use(errorHandler);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});