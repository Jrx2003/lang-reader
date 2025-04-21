const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// 确保.env文件存在并加载环境变量
if (fs.existsSync(path.join(__dirname, '.env'))) {
  console.log('Found .env file, loading environment variables...');
  dotenv.config();
} else {
  console.log('No .env file found, using default settings');
}

// 设置默认MongoDB连接字符串
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jerryxu2487826822:9TJEFlFrrvtMa9jn@cluster0.6f4w2f5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
console.log('Using MongoDB URI:', MONGODB_URI.replace(/\/\/.*:(.*)@/, '//*****:*****@')); // 安全打印，隐藏密码

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

// 连接到MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    console.log('Please check your MONGODB_URI environment variable or .env file');
    process.exit(1);
  }); 