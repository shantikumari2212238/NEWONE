// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import Driver from "../models/Driver.js";
import Student from "../models/Student.js";

/**
 * requireAuth(roles)
 * - roles: optional string or array of allowed roles, e.g. "driver", "student"
 *
 * Usage:
 *   import { requireAuth } from "../middleware/auth.js";
 *   router.get("/protected", requireAuth("driver"), handler);
 */
export const requireAuth = (roles = []) => {
  if (typeof roles === "string") roles = [roles];

  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader) return res.status(401).json({ message: "No authorization header" });

      const parts = authHeader.split(" ");
      if (parts.length !== 2) return res.status(401).json({ message: "Invalid authorization header format" });

      const token = parts[1];
      if (!token) return res.status(401).json({ message: "No token provided" });

      // verify token
      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token", error: err.message });
      }

      if (!payload || !payload.id) return res.status(401).json({ message: "Invalid token payload" });

      // Attach minimal user info to req.user depending on role
      if (payload.role === "driver") {
        const driver = await Driver.findById(payload.id).lean();
        if (!driver) return res.status(401).json({ message: "Driver not found" });
        req.user = { id: payload.id, role: payload.role, status: driver.status };
      } else if (payload.role === "student") {
        const student = await Student.findById(payload.id).lean();
        if (!student) return res.status(401).json({ message: "Student not found" });
        req.user = { id: payload.id, role: payload.role };
      } else {
        // fallback: check driver then student
        const driver = await Driver.findById(payload.id).lean();
        if (driver) req.user = { id: payload.id, role: "driver", status: driver.status };
        else {
          const student = await Student.findById(payload.id).lean();
          if (student) req.user = { id: payload.id, role: "student" };
          else return res.status(401).json({ message: "User not found" });
        }
      }

      // role check if roles provided
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden: role not allowed" });
      }

      return next();
    } catch (err) {
      console.error("Auth error:", err && err.message ? err.message : err);
      return res.status(401).json({ message: "Unauthorized", error: err?.message ?? String(err) });
    }
  };
};
