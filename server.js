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

// Get the port from environment or use default
const PORT = process.env.PORT || 8080;
console.log(`Using port: ${PORT}`);

// API test route
app.get('/api/test', (req, res) => {
  console.log('API test route accessed');
  res.json({ 
    success: true, 
    message: 'API is working correctly',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: PORT,
      hostname: req.hostname,
      protocol: req.protocol
    }
  });
});

// Diagnostic endpoint
app.get('/api/diagnostics', (req, res) => {
  console.log('Diagnostics endpoint accessed');
  res.json({
    serverInfo: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    },
    request: {
      hostname: req.hostname,
      ip: req.ip,
      path: req.path,
      protocol: req.protocol,
      headers: req.headers
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      // Safely check MongoDB URI without exposing credentials
      hasMongoDBURI: !!process.env.MONGODB_URI,
      hasCosmosDBURI: !!process.env.AZURE_COSMOS_CONNECTIONSTRING,
      // Connection state: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
      dbConnectionState: mongoose.connection.readyState
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

// Configure MIME types for static content
express.static.mime.define({
  'application/javascript': ['js', 'mjs'],
  'text/css': ['css'],
  'image/svg+xml': ['svg'],
  'application/json': ['json']
});

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  // Ensure JavaScript modules are served with the correct content type
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

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

// Implement connection retry logic
const connectWithRetry = (uri, options, maxRetries = 5, delay = 5000) => {
  console.log(`MongoDB connection attempt ${6 - maxRetries} of 5`);
  
  return mongoose.connect(uri, options)
    .then(connection => {
      console.log('Successfully connected to MongoDB');
      return connection;
    })
    .catch(err => {
      if (maxRetries <= 1) {
        console.error('MongoDB connection failed after multiple attempts:', err.message);
        throw err;
      }
      
      console.log(`MongoDB connection failed. Retrying in ${delay/1000} seconds... (${maxRetries-1} attempts left)`);
      console.log('Connection error:', err.message);
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(connectWithRetry(uri, options, maxRetries - 1, delay));
        }, delay);
      });
    });
};

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
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API available at ${PORT === 80 ? '' : ':' + PORT}/api`);
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
    serverSelectionTimeoutMS: 60000, // Increase server selection timeout to 60 seconds
    socketTimeoutMS: 300000, // Increase socket timeout to 5 minutes
    maxIdleTimeMS: 120000, // Maximum idle time
    maxPoolSize: 10, // Connection pool size
    keepAlive: true,
    keepAliveInitialDelay: 300000 // Keep alive initial delay
  };
  
  // Check if using Azure Cosmos DB connection string
  const isCosmosDB = MONGODB_URI.includes('mongocluster.cosmos.azure.com');
  if (isCosmosDB) {
    console.log('Azure Cosmos DB connection string detected, using specialized configuration');
  }
  
  // Use retry logic for connection
  connectWithRetry(MONGODB_URI, mongooseOptions)
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
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API available at ${PORT === 80 ? '' : ':' + PORT}/api`);
      });
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB after all attempts:', err.message);
      console.error('Connection string format:', MONGODB_URI.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3'));
      
      // Fall back to starting server without database if in production
      if (process.env.NODE_ENV === 'production') {
        console.log('Starting server without database connection in production mode');
        const server = app.listen(PORT, () => {
          console.log(`Server running on port ${PORT} (NO DATABASE CONNECTION)`);
          console.log(`API available at ${PORT === 80 ? '' : ':' + PORT}/api`);
        });
      } else {
        process.exit(1);
      }
    });
} 