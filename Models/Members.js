const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["student", "patron", "admin"],
    default: "student",
    index: true
  },
  studentId: {
    type: String,
    sparse: true,
    index: true
  },
  department: {
    type: String,
    index: true
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
  registrationDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

// Compound index for frequently searched combinations
memberSchema.index({ role: 1, isActive: 1 });
memberSchema.index({ department: 1, role: 1 });

module.exports = mongoose.model("Member", memberSchema);