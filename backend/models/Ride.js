import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    routeFrom: { type: String, required: true },
    routeTo: { type: String, required: true },
    time: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    bookedSeats: { type: Number, default: 0 },
    bookedStudents: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Ride", rideSchema);
