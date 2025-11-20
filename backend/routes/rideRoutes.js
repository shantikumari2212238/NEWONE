// server/routes/rideRoutes.js
import express from "express";
import Ride from "../models/Ride.js"; // import the Mongoose Ride model

// Initialize a new Express Router instance
const router = express.Router();

/* ===========================================================
   🧩 POST /api/rides — Create a new ride (Driver)
   ===========================================================
   → Called by: Driver from "CreateRide" screen (frontend)
   → Purpose: Store a new ride record in MongoDB
   → Expected body: { routeFrom, routeTo, time, totalSeats }
   → Returns: created ride object with message
*/
router.post("/", async (req, res) => {
  try {
    const { routeFrom, routeTo, time, totalSeats } = req.body;

    // Basic validation: ensure all required fields are present
    if (!routeFrom || !routeTo || !time || !totalSeats) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create a new Ride document with default seat tracking values
    const newRide = new Ride({
      routeFrom,             // starting point
      routeTo,               // destination
      time,                  // ride time (string)
      totalSeats,            // maximum seats
      bookedSeats: 0,        // initially 0
      bookedStudents: [],    // initially empty array
    });

    // Save new ride to MongoDB
    await newRide.save();

    // Return success response
    res
      .status(201)
      .json({ message: "Ride created successfully", ride: newRide });
  } catch (err) {
    console.error("❌ Error creating ride:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* ===========================================================
   🧩 GET /api/rides — Fetch all rides
   ===========================================================
   → Called by: Student app (BookRide.js)
   → Purpose: Display all currently available rides
   → Returns: Array of ride objects
*/
router.get("/", async (req, res) => {
  try {
    // Fetch all rides from database
    const rides = await Ride.find();
    res.status(200).json(rides);
  } catch (err) {
    console.error("❌ Error fetching rides:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* ===========================================================
   🧩 PATCH /api/rides/:rideId/book — Book a ride (Student)
   ===========================================================
   → Called by: BookRide screen on the student app
   → Purpose: Adds a student's name to the bookedStudents array
              and increments bookedSeats count
   → Expected body: { studentName }
   → Params: :rideId = MongoDB _id of the ride being booked
*/
router.patch("/:rideId/book", async (req, res) => {
  try {
    const { studentName } = req.body;  // student attempting to book
    const { rideId } = req.params;     // ride being booked

    // 1️⃣ Find the ride in database
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // 2️⃣ Check if the student already booked the same ride
    if (ride.bookedStudents.includes(studentName)) {
      return res.status(400).json({ message: "Already booked this ride." });
    }

    // 3️⃣ Check if seats are available
    if (ride.bookedSeats >= ride.totalSeats) {
      return res.status(400).json({ message: "No seats available" });
    }

    // 4️⃣ Add student to booked list and update seat count
    ride.bookedStudents.push(studentName);
    ride.bookedSeats = ride.bookedStudents.length;

    // 5️⃣ Save updated ride
    await ride.save();

    // 6️⃣ Respond with updated ride
    res.status(200).json({ message: "Ride booked successfully", ride });
  } catch (err) {
    console.error("❌ Error booking ride:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Export router so it can be imported in server.js/app.js
export default router;
