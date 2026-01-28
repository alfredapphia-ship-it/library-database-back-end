const express = require("express");
const router = express.Router();
const Book = require("../Models/Books");

// Get all books with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, available, search } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (category) filter.category = category;
    if (available !== undefined) filter.available = available === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }
    
    const books = await Book.find(filter)
      .lean()
      .select('title author isbn category available quantity publicationYear')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Book.countDocuments(filter);
    
    res.json({
      data: books,
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

// Get a single book by ID
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .lean()
      .select('-__v');
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new book
router.post("/", async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a book
router.put("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, lean: true });
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a book
router.delete("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available books count by category
router.get("/stats/by-category", async (req, res) => {
  try {
    const stats = await Book.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          available: { $sum: { $cond: ["$available", 1, 0] } }
        }
      },
      { $sort: { total: -1 } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
