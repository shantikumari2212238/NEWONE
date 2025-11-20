// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import studentRoutes from "./routes/studentRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";

dotenv.config();

const app = express();

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (make sure uploads/ exists)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/students", studentRoutes);
app.use("/api/drivers", driverRoutes);

// health
app.get("/", (req, res) => res.json({ message: "Rydy backend running" }));

// Connect to Mongo and start server
const PORT = Number(process.env.PORT || 10000);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in environment. Add it to .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Ensure index on universityId and email (unique where present)
    try {
      const coll = mongoose.connection.db.collection("students");
      await coll.createIndex(
        { universityId: 1 },
        { unique: true, partialFilterExpression: { universityId: { $exists: true, $ne: "" } } }
      );
      await coll.createIndex(
        { email: 1 },
        { unique: true, partialFilterExpression: { email: { $exists: true, $ne: "" } } }
      );
      console.log("✅ Ensured indexes on students.universityId and students.email");
    } catch (err) {
      console.warn("⚠️ Could not create indexes (may already exist):", err.message || err);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// graceful shutdown (optional)
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await mongoose.disconnect();
  process.exit(0);
});
