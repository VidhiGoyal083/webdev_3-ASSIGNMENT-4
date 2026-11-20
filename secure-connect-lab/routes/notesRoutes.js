const express = require("express");
const mongoose = require("mongoose");
const Note = require("../models/Note");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const appEvents = require("../events/appEvents");

const router = express.Router();

router.use(authenticateToken);

// POST /api/notes
router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" });
    }

    const note = await Note.create({
      title,
      content,
      owner: req.user.id
    });

    appEvents.emit("note:created", note);

    return res.status(201).json({
      _id: note._id.toString(),
      title: note.title,
      content: note.content,
      owner: note.owner.toString(),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    });
  } catch (err) {
    console.error("Create note error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/notes
router.get("/", async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { owner: req.user.id };
    const notes = await Note.find(filter).sort({ createdAt: 1 });

    const formatted = notes.map((n) => ({
      _id: n._id.toString(),
      title: n.title,
      content: n.content,
      owner: n.owner.toString(),
      createdAt: n.createdAt,
      updatedAt: n.updatedAt
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("Get notes error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/notes/admin/all (RBAC)
router.get("/admin/all", authorizeRoles("admin"), async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: 1 });
    return res.status(200).json({ total: notes.length, notes });
  } catch (err) {
    console.error("Admin notes error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/notes/:id
router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid note ID" });
  }
  const note = await Note.findById(req.params.id);
  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }
  if (note.owner.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: you do not own this note" });
  }
  return res.status(200).json(note);
});

// PUT /api/notes/:id
router.put("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid note ID" });
  }
  const note = await Note.findById(req.params.id);
  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }
  if (note.owner.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: you do not own this note" });
  }

  if (req.body.title !== undefined) note.title = req.body.title;
  if (req.body.content !== undefined) note.content = req.body.content;
  await note.save();

  return res.status(200).json(note);
});

// DELETE /api/notes/:id
router.delete("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid note ID" });
  }
  const note = await Note.findById(req.params.id);
  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }
  if (note.owner.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: you do not own this note" });
  }

  await note.deleteOne();
  return res.status(200).json({ message: "Note deleted" });
});

module.exports = router;