// backend/routes/studentRoutes.js
import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import fsSync from "fs";
import Student from "../models/Student.js";
import cloudinary from "../config/cloudinary.js"; // your config

const router = express.Router();

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads dir exists for fallback
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
try {
  if (!fsSync.existsSync(UPLOADS_DIR)) {
    fsSync.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Could not ensure uploads dir:", e && e.message ? e.message : e);
}

// Use memory storage so we can upload buffer to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB
});

/**
 * Helper: convert buffer to data URI
 */
function bufferToDataURI(mimetype, buffer) {
  const base64 = buffer.toString("base64");
  return `data:${mimetype};base64,${base64}`;
}

/* ------------------------------------------
   STUDENT SIGNUP
   Accepts multipart/form-data:
     - name, universityId, universityName, password
     - idCard (file)
--------------------------------------------- */
router.post("/signup", upload.single("idCard"), async (req, res) => {
  try {
    if ((!req.body || Object.keys(req.body).length === 0) && !req.file) {
      return res.status(400).json({
        message: "Empty request. Make sure you sent form-data correctly (fields + file).",
      });
    }

    const { name: rawName, universityId: rawId, universityName: rawUni, password } = req.body || {};

    if (!rawName || !rawId || !rawUni || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required: name, universityId, universityName, password" });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "ID card image is required (field name: 'idCard')" });
    }

    const name = String(rawName).trim();
    const universityId = String(rawId).trim().toUpperCase();
    const universityName = String(rawUni).trim();

    // Check uniqueness
    const existing = await Student.findOne({ universityId }).lean();
    if (existing) return res.status(400).json({ message: "University ID already exists" });

    const hashed = await bcrypt.hash(String(password), 10);

    // Upload to Cloudinary if configured
    let idCardImageUrl = null;
    if (cloudinary && cloudinary.uploader) {
      try {
        const dataUri = bufferToDataURI(req.file.mimetype || "image/jpeg", req.file.buffer);
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "rydy_students",
        });
        idCardImageUrl = result && result.secure_url ? result.secure_url : null;
      } catch (err) {
        console.warn("Cloudinary upload failed, falling back to local disk:", err && err.message);
        idCardImageUrl = null;
      }
    }

    // Fallback: write to uploads
    if (!idCardImageUrl) {
      const ext = path.extname(req.file.originalname) || ".jpg";
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      try {
        await fs.writeFile(filePath, req.file.buffer);
        idCardImageUrl = `/uploads/${filename}`;
      } catch (err) {
        console.error("Error writing upload to disk fallback:", err);
        return res.status(500).json({ message: "Failed to save uploaded file" });
      }
    }

    const student = new Student({
      name,
      universityId,
      universityName,
      password: hashed,
      idCardImage: idCardImageUrl,
      status: "pending",
    });

    await student.save();

    return res.status(201).json({ message: "Signup successful, waiting for admin approval." });
  } catch (err) {
    console.error("❌ Student signup error:", err);
    if (err && err.code === 11000) {
      return res.status(400).json({ message: "Duplicate University ID detected" });
    }
    return res.status(500).json({ message: "Server error during signup." });
  }
});

/* ------------------------------------------
   STUDENT LOGIN (returns JWT)
--------------------------------------------- */
router.post("/login", express.json(), async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Empty request body. Ensure Content-Type: application/json." });
    }

    const { universityId: rawId, password } = req.body;
    if (!rawId || !password) return res.status(400).json({ message: "All fields are required" });

    const universityId = String(rawId).trim().toUpperCase();
    const student = await Student.findOne({ universityId });
    if (!student) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(String(password), student.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    if (student.status !== "approved") {
      return res.status(403).json({ message: "Your account is pending admin approval." });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ Missing JWT_SECRET in environment");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const token = jwt.sign({ id: student._id.toString(), role: "student" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login successful",
      token,
      student: {
        id: student._id,
        name: student.name,
        universityId: student.universityId,
        universityName: student.universityName,
        idCardImage: student.idCardImage || null,
      },
    });
  } catch (err) {
    console.error("❌ Student login error:", err);
    return res.status(500).json({ message: "Server error during login." });
  }
});

/* Admin endpoints */
router.get("/pending", async (req, res) => {
  try {
    const pending = await Student.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    console.error("❌ Fetch pending error:", err);
    res.status(500).json({ message: "Failed to fetch pending students" });
  }
});

router.get("/approved", async (req, res) => {
  try {
    const approved = await Student.find({ status: "approved" }).sort({ createdAt: -1 });
    res.json(approved);
  } catch (err) {
    console.error("❌ Fetch approved error:", err);
    res.status(500).json({ message: "Failed to fetch approved students" });
  }
});

router.patch("/approve/:id", async (req, res) => {
  try {
    const s = await Student.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    if (!s) return res.status(404).json({ message: "Student not found" });
    return res.json({ message: "Student approved", student: s });
  } catch (err) {
    console.error("❌ Approve student error:", err);
    res.status(500).json({ message: "Failed to approve student" });
  }
});

router.delete("/reject/:id", async (req, res) => {
  try {
    const s = await Student.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ message: "Student not found" });
    return res.json({ message: "Student rejected and deleted" });
  } catch (err) {
    console.error("❌ Reject student error:", err);
    res.status(500).json({ message: "Failed to reject student" });
  }
});

export default router;
