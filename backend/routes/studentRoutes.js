import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import Student from "../models/Student.js";

const router = express.Router();

// ESM path fix
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

/* ------------------------------------------
   STUDENT SIGNUP
--------------------------------------------- */
router.post("/signup", upload.single("idCard"), async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "Empty request. Make sure you sent form-data correctly."
      });
    }

    const { name, universityId: rawId, universityName, password } = req.body;

    if (!name || !rawId || !universityName || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "ID card image is required" });
    }

    const universityId = rawId.trim().toUpperCase();

    // Check uniqueness
    const existing = await Student.findOne({ universityId }).lean();
    if (existing)
      return res.status(400).json({ message: "University ID already exists" });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const student = new Student({
      name: name.trim(),
      universityId,
      universityName: universityName.trim(),
      password: hashed,
      idCardImage: req.file.path,
      status: "pending",
    });

    await student.save();

    return res.status(201).json({
      message: "Signup successful, waiting for admin approval."
    });

  } catch (err) {
    console.error("❌ Student signup error:", err);
    if (err.code === 11000)
      return res.status(400).json({ message: "Duplicate University ID" });

    return res.status(500).json({ message: "Server error during signup." });
  }
});

/* ------------------------------------------
   STUDENT LOGIN
--------------------------------------------- */
router.post("/login", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "Empty request body. Ensure Content-Type: application/json."
      });
    }

    const { universityId: rawId, password } = req.body;

    if (!rawId || !password)
      return res.status(400).json({ message: "All fields are required" });

    const universityId = String(rawId).trim().toUpperCase();
    const student = await Student.findOne({ universityId });

    if (!student)
      return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, student.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    if (student.status !== "approved") {
      return res.status(403).json({
        message: "Your account is pending admin approval."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ Missing JWT_SECRET");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const token = jwt.sign(
      { id: student._id.toString(), role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      student: {
        id: student._id,
        name: student.name,
        universityId: student.universityId,
        universityName: student.universityName,
      },
    });

  } catch (err) {
    console.error("❌ Student login error:", err);
    return res.status(500).json({ message: "Server error during login." });
  }
});

/* ------------------------------------------
   ADMIN: SHOW PENDING STUDENTS
--------------------------------------------- */
router.get("/pending", async (req, res) => {
  try {
    const pending = await Student.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    res.json(pending);
  } catch (err) {
    console.error("❌ Fetch pending error:", err);
    res.status(500).json({ message: "Failed to fetch pending students" });
  }
});

/* ------------------------------------------
   ADMIN: SHOW APPROVED STUDENTS
--------------------------------------------- */
router.get("/approved", async (req, res) => {
  try {
    const approved = await Student.find({ status: "approved" }).sort({
      createdAt: -1,
    });
    res.json(approved);
  } catch (err) {
    console.error("❌ Fetch approved error:", err);
    res.status(500).json({ message: "Failed to fetch approved students" });
  }
});

/* ------------------------------------------
   ADMIN: APPROVE A STUDENT
--------------------------------------------- */
router.patch("/approve/:id", async (req, res) => {
  try {
    const s = await Student.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!s)
      return res.status(404).json({ message: "Student not found" });

    return res.json({
      message: "Student approved",
      student: s,
    });

  } catch (err) {
    console.error("❌ Approve student error:", err);
    res.status(500).json({ message: "Failed to approve student" });
  }
});

/* ------------------------------------------
   ADMIN: REJECT A STUDENT (DELETE)
--------------------------------------------- */
router.delete("/reject/:id", async (req, res) => {
  try {
    const s = await Student.findByIdAndDelete(req.params.id);
    if (!s)
      return res.status(404).json({ message: "Student not found" });

    return res.json({ message: "Student rejected and deleted" });

  } catch (err) {
    console.error("❌ Reject student error:", err);
    res.status(500).json({ message: "Failed to reject student" });
  }
});

export default router;
