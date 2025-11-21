// backend/models/Driver.js
import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  username: { type: String, required: true, unique: true },
  nic: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photo: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved"], default: "pending" },
}, { timestamps: true });

export default mongoose.model("Driver", driverSchema);
