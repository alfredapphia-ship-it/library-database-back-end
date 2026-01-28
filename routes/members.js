const express = require("express");
const router = express.Router();
const Member = require("../Models/Members");
const bcrypt = require('bcryptjs');

console.log("Members router loaded, bcrypt available:", typeof bcrypt === 'object');

// Login endpoint
router.post("/login", async (req, res) => {
  console.log("Login endpoint hit");
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  
  try {
    const user = await Member.findOne({ email }).lean();
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ message: "login successful", user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student Registration (must come before /:id routes)
router.post("/register/student", async (req, res) => {
  try {
    const { name, email, password, studentId, department, phone, address } = req.body;
    
    if (!name || !email || !password || !studentId) {
      return res.status(400).json({ error: "Missing required fields: name, email, password, studentId" });
    }

    const existingMember = await Member.findOne({ email }).lean();
    if (existingMember) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = new Member({
      name,
      email,
      password: hashedPassword,
      role: "student",
      studentId,
      department,
      phone,
      address
    });

    await student.save();
    res.status(201).json({ message: "Student registered successfully", _id: student._id, email: student.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Patron Registration
router.post("/register/patron", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields: name, email, password" });
    }

    const existingMember = await Member.findOne({ email }).lean();
    if (existingMember) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const patron = new Member({
      name,
      email,
      password: hashedPassword,
      role: "patron",
      phone,
      address
    });

    await patron.save();
    res.status(201).json({ message: "Patron registered successfully", _id: patron._id, email: patron.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all members with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const members = await Member.find(filter)
      .lean()
      .select('-password -__v')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ registrationDate: -1 });
    
    const total = await Member.countDocuments(filter);
    
    res.json({
      data: members,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single member by ID
router.get("/:id", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .lean()
      .select("-password -__v");
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new member
router.post("/", async (req, res) => {
  try {
    const member = new Member(req.body);
    await member.save();
    res.status(201).json({ message: "Member created", _id: member._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a member
router.put("/:id", async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const member = await Member.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .lean()
      .select("-password -__v");
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json({ message: "Member updated successfully", member });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update student profile
router.put("/:id/student", async (req, res) => {
  try {
    const { studentId, department, phone, address, name, email } = req.body;
    const updateData = { studentId, department, phone, address, name, email };
    
    const member = await Member.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .lean()
      .select("-password -__v");
    if (!member) return res.status(404).json({ error: "Student not found" });
    if (member.role !== "student") return res.status(400).json({ error: "User is not a student" });
    
    res.json({ message: "Student profile updated successfully", member });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update patron profile
router.put("/:id/patron", async (req, res) => {
  try {
    const { phone, address, name, email } = req.body;
    const updateData = { phone, address, name, email };
    
    const member = await Member.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .lean()
      .select("-password -__v");
    if (!member) return res.status(404).json({ error: "Patron not found" });
    if (member.role !== "patron") return res.status(400).json({ error: "User is not a patron" });
    
    res.json({ message: "Patron profile updated successfully", member });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a member
router.delete("/:id", async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json({ message: "Member deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get member statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const stats = await Member.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: { $sum: { $cond: ["$isActive", 1, 0] } }
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
