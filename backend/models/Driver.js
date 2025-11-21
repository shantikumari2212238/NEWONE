// backend/models/Driver.js
import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
      min: 18,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    nic: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    photo: {
      type: String, // multer saved path (uploads/...)
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Define a single unique index to avoid duplicate-index warnings (Render/Mongo)
driverSchema.index({ username: 1 }, { unique: true });
driverSchema.index({ nic: 1 }, { unique: true });

export default mongoose.model("Driver", driverSchema);
