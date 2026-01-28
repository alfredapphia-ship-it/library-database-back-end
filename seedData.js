const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require('dotenv').config();

const Member = require("./Models/Members");

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Libra';

// Mock data
const mockMembers = [
  {
    name: "John Student",
    email: "john.student@example.com",
    password: "password123", // Will be hashed
    role: "student",
    studentId: "STU001",
    department: "Computer Science",
    phone: "555-0101",
    address: "123 Main St, City",
    isActive: true
  },
  {
    name: "Jane Patron",
    email: "jane.patron@example.com",
    password: "password456",
    role: "patron",
    phone: "555-0102",
    address: "456 Oak Ave, City",
    isActive: true
  },
  {
    name: "Alice Admin",
    email: "alice.admin@example.com",
    password: "admin123",
    role: "admin",
    phone: "555-0103",
    address: "789 Pine Rd, City",
    isActive: true
  },
  {
    name: "Bob Student",
    email: "bob.student@example.com",
    password: "password789",
    role: "student",
    studentId: "STU002",
    department: "Mathematics",
    phone: "555-0104",
    address: "321 Elm St, City",
    isActive: true
  },
  {
    name: "Carol Patron",
    email: "carol.patron@example.com",
    password: "password321",
    role: "patron",
    phone: "555-0105",
    address: "654 Maple Dr, City",
    isActive: false
  },
  {
    name: "David Student",
    email: "david.student@example.com",
    password: "password654",
    role: "student",
    studentId: "STU003",
    department: "Engineering",
    phone: "555-0106",
    address: "987 Cedar Ln, City",
    isActive: true
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing members
    await Member.deleteMany({});
    console.log("Cleared existing members");

    // Hash passwords and create members
    const hashedMembers = await Promise.all(
      mockMembers.map(async (member) => {
        const hashedPassword = await bcrypt.hash(member.password, 10);
        return { ...member, password: hashedPassword };
      })
    );

    // Insert mock data
    const insertedMembers = await Member.insertMany(hashedMembers);
    console.log(`\n✅ Successfully inserted ${insertedMembers.length} members`);

    // Display member info for testing
    console.log("\n📋 Member Data for Testing:\n");
    mockMembers.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name}`);
      console.log(`   Email: ${member.email}`);
      console.log(`   Password: ${member.password}`);
      console.log(`   Role: ${member.role}`);
      if (member.studentId) console.log(`   Student ID: ${member.studentId}`);
      console.log();
    });

    console.log("🎯 Test the login endpoint with any of the above credentials");

    await mongoose.connection.close();
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seedDatabase();
