// backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

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

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Artopus Backend API is running!');
});

// Use API Routes
app.use('/api/users', userRoutes);
app.use('/api/artists', artistRoutes); // NEW
app.use('/api/artworks', artworkRoutes); // NEW


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});