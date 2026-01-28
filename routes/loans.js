const express = require("express");
const router = express.Router();
const Borrowed = require("../Models/Loan");

// Get all loans with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, returned, userId, bookId, isOverdue } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (returned !== undefined) filter.returned = returned === 'true';
    if (userId) filter.userId = userId;
    if (bookId) filter.bookId = bookId;
    if (isOverdue !== undefined) filter.isOverdue = isOverdue === 'true';
    
    const loans = await Borrowed.find(filter)
      .populate('userId', 'name email studentId role')
      .populate('bookId', 'title author isbn category')
      .lean()
      .select('-__v')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ borrowDate: -1 });
    
    const total = await Borrowed.countDocuments(filter);
    
    res.json({
      data: loans,
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

// Get a single loan by ID
router.get("/:id", async (req, res) => {
  try {
    const loan = await Borrowed.findById(req.params.id)
      .populate('userId', 'name email studentId role')
      .populate('bookId', 'title author isbn category')
      .lean()
      .select('-__v');
    if (!loan) return res.status(404).json({ error: "Loan not found" });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new loan
router.post("/", async (req, res) => {
  try {
    const loan = new Borrowed(req.body);
    await loan.save();
    await loan.populate('userId', 'name email');
    await loan.populate('bookId', 'title author');
    res.status(201).json(loan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a loan (return book)
router.put("/:id", async (req, res) => {
  try {
    const loan = await Borrowed.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('userId', 'name email')
      .populate('bookId', 'title author');
    if (!loan) return res.status(404).json({ error: "Loan not found" });
    res.json(loan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a loan
router.delete("/:id", async (req, res) => {
  try {
    const loan = await Borrowed.findByIdAndDelete(req.params.id);
    if (!loan) return res.status(404).json({ error: "Loan not found" });
    res.json({ message: "Loan deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's borrowed books
router.get("/user/:userId", async (req, res) => {
  try {
    const { page = 1, limit = 10, returned } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = { userId: req.params.userId };
    if (returned !== undefined) filter.returned = returned === 'true';
    
    const loans = await Borrowed.find(filter)
      .populate('bookId', 'title author category')
      .lean()
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ borrowDate: -1 });
    
    const total = await Borrowed.countDocuments(filter);
    
    res.json({
      data: loans,
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

// Get overdue loans
router.get("/reports/overdue", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const overdue = await Borrowed.find({ isOverdue: true, returned: false })
      .populate('userId', 'name email phone')
      .populate('bookId', 'title author')
      .lean()
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ dueDate: 1 });
    
    const total = await Borrowed.countDocuments({ isOverdue: true, returned: false });
    
    res.json({
      data: overdue,
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

// Get borrowing statistics
router.get("/stats/summary", async (req, res) => {
  try {
    const stats = await Borrowed.aggregate([
      {
        $facet: {
          activeLoans: [
            { $match: { returned: false } },
            { $count: "total" }
          ],
          returnedLoans: [
            { $match: { returned: true } },
            { $count: "total" }
          ],
          overdueLoans: [
            { $match: { isOverdue: true, returned: false } },
            { $count: "total" }
          ]
        }
      }
    ]);
    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
