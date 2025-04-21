const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

console.log('Starting Lang Reader API server...');

// Import routes
const projectRoutes = require('./routes/projects');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Set up API routes
console.log('Setting up API routes...');
app.use('/api/projects', projectRoutes);

// API test route
app.get('/api/test', (req, res) => {
  console.log('API test route accessed');
  res.json({ 
    success: true, 
    message: 'API is working correctly',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      hostname: req.hostname,
      protocol: req.protocol
    }
  });
});

// Root route for API status
app.get('/api', (req, res) => {
  console.log('API status route accessed');
  res.json({ message: 'Lang Reader API is running' });
});

// Serve static files from the public directory
console.log('Setting up static file serving...');
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routing - This should be after API routes
app.get('*', (req, res) => {
  console.log(`Serving SPA for path: ${req.path}`);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error in request:', err.stack);
  res.status(500).json({
    message: 'An error occurred',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Check for MongoDB URI
let MONGODB_URI = process.env.AZURE_COSMOS_CONNECTIONSTRING || process.env.MONGODB_URI;

// Handle formatting issues in the connection string
if (MONGODB_URI && MONGODB_URI.includes("'")) {
  console.log('Detected single quotes in connection string, fixing...');
  MONGODB_URI = MONGODB_URI.replace(/'/g, '%27');
  console.log('Connection string has been fixed');
}

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
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API available at http://localhost:${PORT}/api`);
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
  console.log('Attempting to connect to MongoDB...');
  
  // Configure Mongoose connection options
  const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Azure Cosmos DB specific options
    retryWrites: false,
    tlsAllowInvalidCertificates: false, // Secure connection
    serverSelectionTimeoutMS: 30000, // Increase server selection timeout
    socketTimeoutMS: 360000, // Increase socket timeout
    maxIdleTimeMS: 120000, // Maximum idle time
    maxPoolSize: 10 // Connection pool size
  };
  
  // Check if using Azure Cosmos DB connection string
  const isCosmosDB = MONGODB_URI.includes('mongocluster.cosmos.azure.com');
  if (isCosmosDB) {
    console.log('Azure Cosmos DB connection string detected, using specialized configuration');
  }
  
  mongoose.connect(MONGODB_URI, mongooseOptions)
    .then(() => {
      console.log('Connected to MongoDB successfully!');
      
      // Try to list all collections after successful connection
      mongoose.connection.db.listCollections().toArray()
        .then(collections => {
          console.log('Available collections:', collections.map(c => c.name).join(', ') || 'No collections found');
        })
        .catch(err => {
          console.warn('Could not list collections:', err.message);
        });
      
      // Start server
      const PORT = process.env.PORT || 3000;
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API available at http://localhost:${PORT}/api`);
      });
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB:', err.message);
      console.error('Connection string format:', MONGODB_URI.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3'));
      console.error('Full error:', err);
      
      // Try alternate connection options
      if (isCosmosDB) {
        console.log('Attempting to connect with backup options...');
        const backupOptions = {
          ssl: true,
          replicaSet: 'globaldb',
          retryWrites: false,
          maxIdleTimeMS: 120000,
          authSource: 'admin',
          authMechanism: 'SCRAM-SHA-256',
          directConnection: true
        };
        
        mongoose.connect(MONGODB_URI, backupOptions)
          .then(() => {
            console.log('Connected to MongoDB with backup options!');
            const PORT = process.env.PORT || 3000;
            const server = app.listen(PORT, () => {
              console.log(`Server running on port ${PORT}`);
            });
          })
          .catch(backupErr => {
            console.error('Backup connection also failed:', backupErr.message);
            process.exit(1);
          });
      } else {
        process.exit(1);
      }
    });
} 