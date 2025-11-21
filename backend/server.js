// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import studentRoutes from "./routes/studentRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 10000);
const MONGO_URI = process.env.MONGO_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const NODE_ENV = process.env.NODE_ENV || "development";

/* Basic env checks */
if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in environment. Add it to .env");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.warn("⚠️ Warning: JWT_SECRET not set. Protected routes using JWT may fail. Set JWT_SECRET in .env");
}

/* Middleware */
app.use(
  cors({
    origin: CORS_ORIGIN,
  })
);

// Accept JSON and urlencoded bodies. Put these BEFORE route mounting.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Also accept plain/text bodies for debugging / brittle clients
app.use(express.text({ type: ["text/*"], limit: "1mb" }));

// Quick request logger for debugging (only in development)
if (NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} Content-Type:${req.headers["content-type"]}`);
    // careful: body could be large; we print only for debugging
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      try {
        const bodyPreview = typeof req.body === "string" ? req.body.slice(0, 1000) : JSON.stringify(req.body || {}).slice(0, 1000);
        console.log("  body:", bodyPreview);
      } catch (e) {
        console.log("  body: <unserializable>");
      }
    }
    next();
  });
}

// serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* API routes - mounted AFTER body parsers */
app.use("/api/students", studentRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/admin", adminRoutes);

/* health / root */
app.get("/", (req, res) =>
  res.json({
    message: "Rydy backend running",
    env: NODE_ENV,
    uptime_s: process.uptime(),
    timestamp: new Date().toISOString(),
  })
);

/* 404 handler for unknown API routes */
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API endpoint not found" });
  }
  next();
});

/* Error handler (last middleware) */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && err.stack ? err.stack : err);
  // helpful debug info when body parsing fails
  if (NODE_ENV === "development") {
    console.error("Request headers:", req.headers);
    console.error("Request body (type):", typeof req.body);
    try { console.error("Request body:", req.body); } catch (e) {}
  }
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ message, error: NODE_ENV === "development" ? String(err) : undefined });
});

/* Mongo + server start */
let server = null;

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("✅ MongoDB connected");

    // ensure indexes (best-effort)
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
      console.warn("⚠️ Could not create student indexes (may already exist):", err && err.message ? err.message : err);
    }

    try {
      const collDrivers = mongoose.connection.db.collection("drivers");
      await collDrivers.createIndex({ nic: 1 }, { unique: true, partialFilterExpression: { nic: { $exists: true, $ne: "" } } });
      console.log("✅ Ensured index on drivers.nic");
    } catch (err) {
      console.warn("⚠️ Could not create drivers index (may already exist):", err && err.message ? err.message : err);
    }

    server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* Graceful shutdown */
const gracefulShutdown = async (signal) => {
  try {
    console.log(`\nReceived ${signal} - shutting down gracefully...`);
    if (server) {
      server.close(() => {
        console.log("HTTP server closed");
      });
    }
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
