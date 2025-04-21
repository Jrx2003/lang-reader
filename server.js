const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import routes
const projectRoutes = require('./routes/projects');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Set up API routes
app.use('/api/projects', projectRoutes);

// Root route for API status
app.get('/api', (req, res) => {
  res.json({ message: 'Lang Reader API is running' });
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routing - This should be after API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An error occurred',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Check for MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MongoDB connection string not found!');
  console.error('Please set the MONGODB_URI environment variable.');
  console.error('You can:');
  console.error('1. Create a .env file in the root directory with MONGODB_URI=your_connection_string');
  console.error('2. Or set it in the environment: export MONGODB_URI=your_connection_string (Linux/Mac)');
  console.error('3. Or set it in the environment: set MONGODB_URI=your_connection_string (Windows)');
  console.error('4. For GitHub Codespaces, add it in your repository secrets.');
  
  // For GitHub Codespaces, trying to use a default in-memory DB for development
  console.log('Attempting to start with an in-memory MongoDB for development...');
  
  const { MongoMemoryServer } = require('mongodb-memory-server');
  
  // Create a new instance of MongoMemoryServer
  async function startServer() {
    try {
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      console.log('In-memory MongoDB started at:', uri);
      
      // Connect to the in-memory database
      await mongoose.connect(uri);
      console.log('Connected to in-memory MongoDB');
      
      // Start server
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (err) {
      console.error('Failed to start in-memory MongoDB:', err);
      console.error('Application will now exit. Please configure MONGODB_URI and try again.');
      process.exit(1);
    }
  }
  
  // Try to start with in-memory DB
  startServer();
} else {
  // Connect to MongoDB using the provided URI
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      
      // Start server
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB:', err.message);
      process.exit(1);
    });
} 