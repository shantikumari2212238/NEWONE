// backend/models/Ride.js
import mongoose from "mongoose";

const StopSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lng: Number,
  order: Number
}, { _id: false });

const rideSchema = new mongoose.Schema(
  {
    // owner
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },

    // readable route labels
    routeFrom: { type: String, required: true },
    routeFromLoc: { 
      lat: { type: Number }, 
      lng: { type: Number } 
    },

    routeTo: { type: String, required: true },
    routeToLoc: { 
      lat: { type: Number }, 
      lng: { type: Number } 
    },

    // optional intermediate stops
    stops: { type: [StopSchema], default: [] },

    // scheduling / capacity
    time: { type: String, required: true },           // human-friendly time e.g. "08:30 AM"
    totalSeats: { type: Number, required: true, min: 1 },
    seatsAvailable: { type: Number, required: true, min: 0 },

    // bookings (currently stored as strings - you can change to ObjectId later)
    bookedStudents: { type: [String], default: [] },

    // active toggle
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ensure seatsAvailable defaults to totalSeats on creation
rideSchema.pre("save", function (next) {
  if (this.isNew && (this.seatsAvailable === undefined || this.seatsAvailable === null)) {
    this.seatsAvailable = this.totalSeats;
  }
  next();
});

export default mongoose.model("Ride", rideSchema);
