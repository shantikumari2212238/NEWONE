// backend/routes/driverRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import Driver from "../models/Driver.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// POST /api/drivers/signup
router.post("/signup", upload.single("photo"), async (req, res) => {
  try {
    const { name, age: rawAge, nic, password } = req.body;

    if (!name || !rawAge || !nic || !password) {
      return res.status(400).json({ message: "All fields are required: name, age, nic, password" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Driver photo is required" });
    }

    const age = Number(rawAge);
    if (isNaN(age) || age < 18 || age > 120) {
      return res.status(400).json({ message: "Invalid age. Must be a number between 18 and 120." });
    }

    // Check NIC uniqueness
    const existing = await Driver.findOne({ nic: nic.trim() }).lean();
    if (existing) {
      return res.status(400).json({ message: "NIC already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newDriver = new Driver({
      name: String(name).trim(),
      age,
      nic: String(nic).trim(),
      password: hashed,
      photo: req.file.path,
      status: "pending",
    });

    await newDriver.save();

    return res.status(201).json({
      message: "Signup submitted successfully! Pending admin approval.",
      driverId: newDriver._id,
    });
  } catch (err) {
    console.error("❌ Driver Signup Error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "NIC already exists", keyValue: err.keyValue });
    }
    return res.status(500).json({ message: "Server error during signup" });
  }
});

// POST /api/drivers/login
router.post("/login", async (req, res) => {
  try {
    const { nic: rawNic, password } = req.body;
    if (!rawNic || !password) return res.status(400).json({ message: "All fields are required" });

    const nic = String(rawNic).trim();
    const driver = await Driver.findOne({ nic }).lean();
    if (!driver) return res.status(401).json({ message: "Invalid NIC or password" });

    const match = await bcrypt.compare(password, driver.password);
    if (!match) return res.status(401).json({ message: "Invalid NIC or password" });

    if (driver.status !== "approved") {
      return res.status(403).json({ message: "Your account is pending admin approval." });
    }

    return res.json({
      message: "Login successful",
      driver: {
        id: driver._id,
        name: driver.name,
        nic: driver.nic,
        age: driver.age,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
});

// Admin endpoints
router.get("/pending", async (req, res) => {
  try {
    const pending = await Driver.find({ status: "pending" }).lean();
    res.json(pending);
  } catch (err) {
    console.error("❌ Fetch Pending Error:", err);
    res.status(500).json({ message: "Failed to fetch pending drivers" });
  }
});

router.get("/approved", async (req, res) => {
  try {
    const approved = await Driver.find({ status: "approved" }).lean();
    res.json(approved);
  } catch (err) {
    console.error("❌ Fetch Approved Error:", err);
    res.status(500).json({ message: "Failed to fetch approved drivers" });
  }
});

router.patch("/approve/:id", async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json({ message: "Driver approved successfully", driver });
  } catch (err) {
    console.error("❌ Approve Error:", err);
    res.status(500).json({ message: "Failed to approve driver" });
  }
});

router.delete("/reject/:id", async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json({ message: "Driver rejected and deleted" });
  } catch (err) {
    console.error("❌ Reject Error:", err);
    res.status(500).json({ message: "Failed to reject driver" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json({ message: "Driver account deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Driver Error:", err);
    res.status(500).json({ message: "Failed to delete driver" });
  }
});

export default router;
