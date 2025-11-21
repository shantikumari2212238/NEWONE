// backend/routes/driverRoutes.js
import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Driver from "../models/Driver.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// POST /api/drivers/signup
router.post("/signup", upload.single("photo"), async (req, res) => {
  try {
    const { name, age: rawAge, nic, username, password } = req.body;
    if (!name || !rawAge || !nic || !username || !password)
      return res.status(400).json({ message: "All fields required: name, age, nic, username, password" });

    if (!req.file) return res.status(400).json({ message: "Driver photo is required" });

    const age = Number(rawAge);
    if (isNaN(age) || age < 18 || age > 120) return res.status(400).json({ message: "Invalid age" });

    const existing = await Driver.findOne({ $or: [{ nic: nic.trim() }, { username: username.trim() }] }).lean();
    if (existing) {
      if (existing.nic === nic.trim()) return res.status(400).json({ message: "NIC already registered" });
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newDriver = new Driver({
      name: String(name).trim(),
      age,
      nic: String(nic).trim(),
      username: String(username).trim(),
      password: hashed,
      photo: req.file.path,
      status: "pending",
    });

    await newDriver.save();
    return res.status(201).json({ message: "Signup submitted successfully! Pending admin approval.", driverId: newDriver._id });
  } catch (err) {
    console.error("❌ Driver signup error:", err);
    if (err.code === 11000) return res.status(400).json({ message: "Duplicate field", keyValue: err.keyValue });
    return res.status(500).json({ message: "Server error during signup" });
  }
});

// POST /api/drivers/login (login by username)
router.post("/login", async (req, res) => {
  try {
    const { username: rawUsername, password } = req.body;
    if (!rawUsername || !password) return res.status(400).json({ message: "All fields are required" });

    const username = String(rawUsername).trim();
    const driver = await Driver.findOne({ username });
    if (!driver) return res.status(401).json({ message: "Invalid username or password" });

    const match = await bcrypt.compare(password, driver.password);
    if (!match) return res.status(401).json({ message: "Invalid username or password" });

    if (driver.status !== "approved") return res.status(403).json({ message: "Your account is pending admin approval." });

    if (!process.env.JWT_SECRET) {
      console.error("❌ Missing JWT_SECRET");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const token = jwt.sign({ id: driver._id.toString(), role: "driver" }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      message: "Login successful",
      token,
      driver: { id: driver._id, name: driver.name, username: driver.username, nic: driver.nic, age: driver.age }
    });
  } catch (err) {
    console.error("❌ Driver login error:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
});

/* Admin endpoints for drivers */
router.get("/pending", async (req, res) => {
  try { const pending = await Driver.find({ status: "pending" }).sort({ createdAt: -1 }); return res.json(pending); }
  catch (err) { console.error(err); return res.status(500).json({ message: "Failed to fetch pending drivers" }); }
});

router.get("/approved", async (req, res) => {
  try { const approved = await Driver.find({ status: "approved" }).sort({ createdAt: -1 }); return res.json(approved); }
  catch (err) { console.error(err); return res.status(500).json({ message: "Failed to fetch approved drivers" }); }
});

router.patch("/approve/:id", async (req, res) => {
  try { const d = await Driver.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true }); if (!d) return res.status(404).json({ message: "Driver not found" }); return res.json({ message: "Driver approved", driver: d }); }
  catch (err) { console.error(err); return res.status(500).json({ message: "Failed to approve driver" }); }
});

router.delete("/reject/:id", async (req, res) => {
  try { const d = await Driver.findByIdAndDelete(req.params.id); if (!d) return res.status(404).json({ message: "Driver not found" }); return res.json({ message: "Driver rejected and deleted" }); }
  catch (err) { console.error(err); return res.status(500).json({ message: "Failed to reject driver" }); }
});

export default router;
