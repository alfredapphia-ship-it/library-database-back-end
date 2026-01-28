const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Libra';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Routes
const booksRouter = require('./routes/books');
const membersRouter = require('./routes/members');
const loansRouter = require('./routes/loans');
const Borrowed = require('./Models/Loan');

app.use('/books', booksRouter);
app.use('/members', membersRouter);
app.use('/loans', loansRouter);

app.get('/', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

// Borrowed endpoint (optimized)
app.get("/borrowed", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const loans = await Borrowed.find()
      .populate('userId', 'name email')
      .populate('bookId', 'title author')
      .lean()
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ borrowDate: -1 });
    
    const total = await Borrowed.countDocuments();
    
    res.json({
      data: loans,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching borrowed books", error: err.message });
  }
});

// Global error handler (must be last)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const User = require("./Models/Members");

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// MongoDB Connection with optimized options
const mongooseOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 45000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
  retryReads: true
};

mongoose.connect(MONGO_URI, mongooseOptions)
  .then(() => {
    console.log(`MongoDB connected (${MONGO_URI})`);
    console.log('Connection pool size: 10 (max), 5 (min)');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
