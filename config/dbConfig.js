/**
 * MongoDB Configuration for Optimal Performance
 * This file contains all connection pooling and optimization settings
 */

const mongoose = require('mongoose');

const mongooseOptions = {
  // Connection Pool Settings
  maxPoolSize: 10,           // Maximum number of connections to maintain
  minPoolSize: 5,            // Minimum number of connections to maintain
  maxIdleTimeMS: 45000,      // Close idle connections after 45 seconds
  
  // Connection Timeout Settings
  serverSelectionTimeoutMS: 5000,  // Time to select a server before error
  socketTimeoutMS: 45000,          // Socket timeout for operations
  
  // Reliability Settings
  retryWrites: true,         // Automatically retry writes on transient errors
  w: 'majority',             // Write concern - wait for majority of nodes
  retryReads: true,          // Automatically retry reads on transient errors
  
  // Performance Settings
  connectTimeoutMS: 10000,   // Initial connection timeout
  
  // Logging
  loggerLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
};

/**
 * Create MongoDB connection
 * @param {string} mongoUri - MongoDB connection string
 * @returns {Promise} MongoDB connection
 */
async function connectDB(mongoUri) {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    const connection = await mongoose.connect(mongoUri, mongooseOptions);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`   URI: ${mongoUri}`);
    console.log(`   Pool Size: ${mongooseOptions.maxPoolSize} (max), ${mongooseOptions.minPoolSize} (min)`);
    
    // Monitor connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    return connection;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

/**
 * Close MongoDB connection gracefully
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
    process.exit(1);
  }
}

module.exports = {
  mongooseOptions,
  connectDB,
  disconnectDB
};
