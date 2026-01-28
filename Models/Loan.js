const mongoose = require("mongoose");

const borrowedSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
    index: true
  },
  borrowDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  returnDate: {
    type: Date,
    sparse: true
  },
  returned: {
    type: Boolean,
    default: false,
    index: true
  },
  isOverdue: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

// Compound indexes for common queries
borrowedSchema.index({ userId: 1, returned: 1 });
borrowedSchema.index({ bookId: 1, returned: 1 });
borrowedSchema.index({ dueDate: 1, returned: 1, isOverdue: 1 });

module.exports = mongoose.model("Borrowed", borrowedSchema);