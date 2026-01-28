const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  author: {
    type: String,
    required: true,
    index: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  available: {
    type: Boolean,
    default: true,
    index: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0
  },
  category: {
    type: String,
    index: true
  },
  publicationYear: {
    type: Number
  }
}, { timestamps: true });

// Compound indexes for common queries
bookSchema.index({ title: 1, author: 1 });
bookSchema.index({ available: 1, category: 1 });

module.exports = mongoose.model("Book", bookSchema);