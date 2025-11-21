// backend/routes/driverRoutes.js
import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import fsSync from "fs";
import Driver from "../models/Driver.js";
import cloudinary from "../config/cloudinary.js"; // your config file

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
  // non-fatal
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

/* ---------------------------
   DRIVER SIGNUP
   POST /api/drivers/signup
   fields: name, age, nic, username, password, photo (file)
----------------------------*/
router.post("/signup", upload.single("photo"), async (req, res) => {
  try {
    // Defensive checks
    if ((!req.body || Object.keys(req.body).length === 0) && !req.file) {
      return res.status(400).json({
        message:
          "Empty request. Make sure you sent form-data correctly (multipart/form-data with fields + file).",
      });
    }

    const { name, age: rawAge, nic: rawNic, username: rawUsername, password } = req.body || {};

    if (!name || !rawAge || !rawNic || !rawUsername || !password) {
      return res
        .status(400)
        .json({ message: "All fields required: name, age, nic, username, password" });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "Driver photo is required (field name: 'photo')" });
    }

    const age = Number(rawAge);
    if (Number.isNaN(age) || age < 18 || age > 120) {
      return res.status(400).json({ message: "Invalid age. Must be a number between 18 and 120." });
    }

    const nic = String(rawNic).trim();
    const username = String(rawUsername).trim();

    // check uniqueness
    const existing = await Driver.findOne({ $or: [{ nic }, { username }] }).lean();
    if (existing) {
      if (existing.nic === nic) return res.status(400).json({ message: "NIC already registered" });
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashed = await bcrypt.hash(String(password), 10);

    // Upload to Cloudinary (preferred)
    let photoUrl = null;
    if (cloudinary && cloudinary.uploader) {
      try {
        const dataUri = bufferToDataURI(req.file.mimetype || "image/jpeg", req.file.buffer);
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "rydy_drivers",
          // optional: transformation, public_id settings etc.
        });
        photoUrl = result && result.secure_url ? result.secure_url : null;
      } catch (err) {
        console.warn("Cloudinary upload failed, falling back to local disk:", err && err.message);
        photoUrl = null;
      }
    }

    // Fallback: write to /uploads and serve via /uploads/<filename>
    if (!photoUrl) {
      const ext = path.extname(req.file.originalname) || ".jpg";
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      try {
        await fs.writeFile(filePath, req.file.buffer);
        photoUrl = `/uploads/${filename}`; // served by express static in server.js
      } catch (err) {
        console.error("Failed to write driver photo to disk fallback:", err);
        return res.status(500).json({ message: "Failed to store uploaded photo" });
      }
    }

    const newDriver = new Driver({
      name: String(name).trim(),
      age,
      nic,
      username,
      password: hashed,
      photo: photoUrl,
      status: "pending",
    });

    await newDriver.save();

    return res.status(201).json({
      message: "Signup submitted successfully! Pending admin approval.",
      driverId: newDriver._id,
    });
  } catch (err) {
    console.error("❌ Driver signup error:", err);
    if (err && err.code === 11000) {
      return res.status(400).json({ message: "Duplicate field", keyValue: err.keyValue || null });
    }
    return res.status(500).json({ message: "Server error during signup" });
  }
});

/* ---------------------------
   DRIVER LOGIN
   POST /api/drivers/login
   accepts: { username, password } OR { nic, password }
----------------------------*/
router.post("/login", express.json(), async (req, res) => {
  // Note: express.json() placed here as defensive measure if global JSON parser not active
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: "Request body is empty or not parsed. Ensure Content-Type: application/json." });
    }

    const usernameOrNic = (req.body.username || req.body.nic || "").toString().trim();
    const password = req.body.password;

    if (!usernameOrNic || !password) {
      return res.status(400).json({ message: "All fields are required: username (or nic) and password" });
    }

    let driver = await Driver.findOne({ username: usernameOrNic });
    if (!driver) {
      driver = await Driver.findOne({ nic: usernameOrNic });
    }
    if (!driver) return res.status(401).json({ message: "Invalid username or password" });

    const match = await bcrypt.compare(String(password), driver.password);
    if (!match) return res.status(401).json({ message: "Invalid username or password" });

    if (driver.status !== "approved") return res.status(403).json({ message: "Your account is pending admin approval." });

    const secret = process.env.JWT_SECRET || process.env.FALLBACK_JWT || "dev_temporary_secret_change_me";
    if (!process.env.JWT_SECRET) {
      console.warn("⚠️ JWT_SECRET not set in env. Using fallback secret (dev only).");
    }

    const token = jwt.sign({ id: driver._id.toString(), role: "driver" }, secret, { expiresIn: "7d" });

    return res.json({
      message: "Login successful",
      token,
      driver: {
        id: driver._id,
        name: driver.name,
        username: driver.username,
        nic: driver.nic,
        age: driver.age,
        photo: driver.photo || null,
      },
    });
  } catch (err) {
    console.error("❌ Driver login error:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
});

/* Admin endpoints */
router.get("/pending", async (req, res) => {
  try {
    const pending = await Driver.find({ status: "pending" }).sort({ createdAt: -1 });
    return res.json(pending);
  } catch (err) {
    console.error("❌ Fetch pending drivers error:", err);
    return res.status(500).json({ message: "Failed to fetch pending drivers" });
  }
});

router.get("/approved", async (req, res) => {
  try {
    const approved = await Driver.find({ status: "approved" }).sort({ createdAt: -1 });
    return res.json(approved);
  } catch (err) {
    console.error("❌ Fetch approved drivers error:", err);
    return res.status(500).json({ message: "Failed to fetch approved drivers" });
  }
});

router.patch("/approve/:id", async (req, res) => {
  try {
    const d = await Driver.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    if (!d) return res.status(404).json({ message: "Driver not found" });
    return res.json({ message: "Driver approved", driver: d });
  } catch (err) {
    console.error("❌ Approve driver error:", err);
    return res.status(500).json({ message: "Failed to approve driver" });
  }
});

router.delete("/reject/:id", async (req, res) => {
  try {
    const d = await Driver.findByIdAndDelete(req.params.id);
    if (!d) return res.status(404).json({ message: "Driver not found" });
    return res.json({ message: "Driver rejected and deleted" });
  } catch (err) {
    console.error("❌ Reject driver error:", err);
    return res.status(500).json({ message: "Failed to reject driver" });
  }
});

export default router;
