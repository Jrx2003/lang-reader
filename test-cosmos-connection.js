const mongoose = require('mongoose');
require('dotenv').config();

// Get the connection string
const connectionString = process.env.AZURE_COSMOS_CONNECTIONSTRING || process.env.MONGODB_URI;

if (!connectionString) {
  console.error('No MongoDB connection string found in environment variables!');
  process.exit(1);
}

// Format password - handle special characters in the password
const formatConnectionString = (connStr) => {
  // Check for obvious formatting issues (common single quote problems)
  if (connStr.includes("'")) {
    console.warn('WARNING: Connection string contains single quotes, which may cause parsing errors');
    
    // Try replacing single quotes with URL encoding
    const fixedStr = connStr.replace(/'/g, '%27');
    console.log('Connection string has been fixed');
    return fixedStr;
  }
  return connStr;
};

// Fix connection string
const fixedConnectionString = formatConnectionString(connectionString);

console.log('Connection string format check completed');
console.log('Connection string type:', typeof fixedConnectionString);
console.log('Connection string length:', fixedConnectionString.length);
// Print partially masked connection string
console.log('Partial connection string:', fixedConnectionString.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3'));

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: false,
  ssl: true,
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 360000,
  maxIdleTimeMS: 120000
};

console.log('Attempting to connect to MongoDB...');

// Try to connect
mongoose.connect(fixedConnectionString, options)
  .then(() => {
    console.log('Connection successful!');
    
    // Try to read collection list
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    if (collections.length === 0) {
      console.log('No collections in database, attempting to create collection...');
      
      // Create a test model
      const TestSchema = new mongoose.Schema({
        name: String,
        createdAt: { type: Date, default: Date.now }
      });
      
      const Test = mongoose.model('Test', TestSchema);
      
      // Create a test item
      return Test.create({ name: 'test-item' });
    } else {
      console.log('Existing collections:', collections.map(c => c.name).join(', '));
      return Promise.resolve();
    }
  })
  .then(() => {
    console.log('Test completed, disconnecting');
    return mongoose.disconnect();
  })
  .then(() => {
    console.log('Connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed!');
    console.error('Error details:', err);
    
    // Try backup options
    console.log('Retrying with backup options...');
    const backupOptions = {
      ssl: true,
      replicaSet: 'globaldb',
      retryWrites: false,
      maxIdleTimeMS: 120000,
      authSource: 'admin',
      authMechanism: 'SCRAM-SHA-256'
    };
    
    return mongoose.connect(fixedConnectionString, backupOptions)
      .then(() => {
        console.log('Connection successful with backup options!');
        return mongoose.disconnect();
      })
      .then(() => {
        console.log('Connection closed');
        process.exit(0);
      })
      .catch(backupErr => {
        console.error('Backup options also failed:', backupErr);
        
        // Provide solution suggestions
        console.log('\nPossible solutions:');
        console.log('1. Check if username and password are correct');
        console.log('2. Confirm Azure Cosmos DB account is created and enabled');
        console.log('3. Check network firewall settings to ensure Azure App Service access is allowed');
        console.log('4. Check Cosmos DB logs in Azure Portal for detailed errors');
        
        process.exit(1);
      });
  }); 