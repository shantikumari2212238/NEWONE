import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import Student from "../models/Student.js";

const router = express.Router();

// Path fix for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config (save uploads locally)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/* ---------------------------
   Signup - POST /api/students/signup
   --------------------------- */
router.post("/signup", upload.single("idCard"), async (req, res) => {
  try {
    const { name, universityId: rawId, universityName, password } = req.body;

    if (!name || !rawId || !universityName || !password)
      return res.status(400).json({ message: "All fields are required" });
    if (!req.file)
      return res.status(400).json({ message: "ID card image is required" });

    const universityId = rawId.trim().toUpperCase();

    // Check if ID already exists
    const existing = await Student.findOne({ universityId });
    if (existing)
      return res.status(400).json({ message: "University ID already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const student = new Student({
      name: name.trim(),
      universityId,
      universityName: universityName.trim(),
      password: hashed,
      idCardImage: req.file.path,
    });

    await student.save();
    return res
      .status(201)
      .json({ message: "Signup successful, waiting for admin approval." });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    if (err.code === 11000)
      return res
        .status(400)
        .json({ message: "Duplicate University ID detected" });
    res.status(500).json({ message: "Server error during signup." });
  }
});

/* ---------------------------
   Login - POST /api/students/login
   --------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { universityId: rawId, password } = req.body;
    if (!rawId || !password)
      return res.status(400).json({ message: "All fields are required" });

    const universityId = rawId.trim().toUpperCase();
    const student = await Student.findOne({ universityId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const match = await bcrypt.compare(password, student.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    if (student.status !== "approved")
      return res
        .status(403)
        .json({ message: "Your account is pending admin approval." });

    res.json({
      message: "Login successful!",
      student: {
        id: student._id,
        name: student.name,
        universityName: student.universityName,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

/* ---------------------------
   Admin - Approve / Reject / List
   --------------------------- */
router.get("/pending", async (req, res) => {
  const pending = await Student.find({ status: "pending" });
  res.json(pending);
});

router.get("/approved", async (req, res) => {
  const approved = await Student.find({ status: "approved" });
  res.json(approved);
});

router.patch("/approve/:id", async (req, res) => {
  await Student.findByIdAndUpdate(req.params.id, { status: "approved" });
  res.json({ message: "Student approved" });
});

router.delete("/reject/:id", async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ message: "Student rejected and deleted" });
});

export default router;
