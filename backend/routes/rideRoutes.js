// backend/routes/rideRoutes.js
import express from "express";
import mongoose from "mongoose";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * Create ride (driver only)
 * POST /api/rides
 */
router.post("/", requireAuth("driver"), async (req, res) => {
  try {
    const driverId = req.user.id;
    const driver = await Driver.findById(driverId).lean();
    if (!driver || driver.status !== "approved") {
      return res.status(403).json({ message: "Driver not approved to create rides." });
    }

    const { routeFrom, routeFromLoc = null, routeTo, routeToLoc = null, stops = [], time, totalSeats } = req.body;
    if (!routeFrom || !routeTo || !time || totalSeats === undefined) {
      return res.status(400).json({ message: "routeFrom, routeTo, time and totalSeats are required." });
    }

    const total = Number(totalSeats);
    if (!Number.isInteger(total) || total <= 0) {
      return res.status(400).json({ message: "totalSeats must be a positive integer." });
    }

    const ride = new Ride({
      driver: driverId,
      routeFrom,
      routeFromLoc,
      routeTo,
      routeToLoc,
      stops,
      time,
      totalSeats: total,
      seatsAvailable: total,
      bookedStudents: [],
      active: true,
    });

    await ride.save();
    return res.status(201).json({ message: "Ride created successfully", ride });
  } catch (err) {
    console.error("❌ Error creating ride:", err);
    return res.status(500).json({ message: "Server error creating ride" });
  }
});

/**
 * Get rides - supports ?driver=true (for authenticated driver)
 */
router.get("/", requireAuth(), async (req, res) => {
  try {
    const { driver } = req.query;
    if (driver === "true" && req.user.role === "driver") {
      const rides = await Ride.find({ driver: req.user.id }).sort({ createdAt: -1 });
      return res.json(rides);
    }
    const rides = await Ride.find({ active: true }).sort({ createdAt: -1 });
    return res.json(rides);
  } catch (err) {
    console.error("❌ Error fetching rides:", err);
    return res.status(500).json({ message: "Server error fetching rides" });
  }
});

/**
 * GET single ride
 */
router.get("/:id", requireAuth(), async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });
    const ride = await Ride.findById(id).populate("driver", "name nic");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    return res.json(ride);
  } catch (err) {
    console.error("❌ Error fetching ride:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH update ride (driver owner only)
 */
router.patch("/:id", requireAuth("driver"), async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (String(ride.driver) !== String(req.user.id)) return res.status(403).json({ message: "Not authorized to update this ride" });

    const allowed = ["routeFrom","routeFromLoc","routeTo","routeToLoc","stops","time","totalSeats","active"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) ride[key] = req.body[key];
    }

    if (req.body.totalSeats !== undefined) {
      const newTotal = Number(req.body.totalSeats);
      const diff = newTotal - ride.totalSeats;
      ride.totalSeats = newTotal;
      ride.seatsAvailable = Math.max(0, (ride.seatsAvailable || 0) + diff);
    }

    await ride.save();
    return res.json({ message: "Ride updated", ride });
  } catch (err) {
    console.error("❌ Error updating ride:", err);
    return res.status(500).json({ message: "Server error updating ride" });
  }
});

/**
 * DELETE (soft) ride
 */
router.delete("/:id", requireAuth("driver"), async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (String(ride.driver) !== String(req.user.id)) return res.status(403).json({ message: "Not authorized to delete this ride" });

    ride.active = false;
    await ride.save();
    return res.json({ message: "Ride deactivated" });
  } catch (err) {
    console.error("❌ Error deleting ride:", err);
    return res.status(500).json({ message: "Server error deleting ride" });
  }
});

/**
 * PATCH /:id/book (student booking)
 */
router.patch("/:id/book", requireAuth("student"), async (req, res) => {
  try {
    const rideId = req.params.id;
    const studentId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(rideId)) return res.status(400).json({ message: "Invalid ride id" });

    const existingRide = await Ride.findById(rideId).lean();
    if (!existingRide) return res.status(404).json({ message: "Ride not found" });
    if (existingRide.bookedStudents.includes(studentId)) return res.status(400).json({ message: "You have already booked this ride." });

    const updated = await Ride.findOneAndUpdate(
      { _id: rideId, seatsAvailable: { $gt: 0 }, bookedStudents: { $ne: studentId } },
      { $inc: { seatsAvailable: -1 }, $push: { bookedStudents: studentId } },
      { new: true }
    ).lean();

    if (!updated) {
      const fresh = await Ride.findById(rideId).lean();
      if (!fresh) return res.status(404).json({ message: "Ride not found" });
      if (fresh.bookedStudents.includes(studentId)) return res.status(400).json({ message: "You have already booked this ride." });
      if (fresh.seatsAvailable <= 0) return res.status(400).json({ message: "No seats available" });
      return res.status(400).json({ message: "Could not book ride" });
    }

    return res.status(200).json({ message: "Ride booked successfully", ride: updated });
  } catch (err) {
    console.error("❌ Error booking ride:", err);
    return res.status(500).json({ message: "Server error booking ride" });
  }
});

/**
 * PATCH /:id/seats (driver only)
 * Body: { action: "increment"|"decrement"|"set", amount: number }
 */
router.patch("/:id/seats", requireAuth("driver"), async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (String(ride.driver) !== String(req.user.id)) return res.status(403).json({ message: "Not authorized to update this ride" });

    const { action, amount = 1 } = req.body;
    const amt = Number(amount);
    if (!["increment", "decrement", "set"].includes(action)) return res.status(400).json({ message: 'action must be "increment"|"decrement"|"set"' });
    if (!Number.isInteger(amt) || amt < 0) return res.status(400).json({ message: "Invalid amount" });

    if (action === "increment") {
      ride.seatsAvailable = Math.min(ride.seatsAvailable + amt, ride.totalSeats);
    } else if (action === "decrement") {
      ride.seatsAvailable = Math.max(0, ride.seatsAvailable - amt);
    } else if (action === "set") {
      if (amt > ride.totalSeats) return res.status(400).json({ message: "seatsAvailable cannot exceed totalSeats" });
      ride.seatsAvailable = amt;
    }

    await ride.save();
    return res.json({ message: "Seats updated", ride });
  } catch (err) {
    console.error("❌ Error updating seats:", err);
    return res.status(500).json({ message: "Server error updating seats" });
  }
});

export default router;
