// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import studentRoutes from "./routes/studentRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import rideRoutes from "./routes/rideRoutes.js"; // <-- ensure this file exists (we added earlier)

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/students", studentRoutes);
app.use("/api/drivers", driverRoutes);   // driver routes (signup/login/approve...)
app.use("/api/rides", rideRoutes);       // ride routes (create/list/update/delete)

// basic root route
app.get("/", (req, res) => res.json({ message: "Rydy backend running" }));

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

process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await mongoose.disconnect();
  process.exit(0);
});
