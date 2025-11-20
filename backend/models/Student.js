import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // University ID (always uppercase + unique)
    universityId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    universityName: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    idCardImage: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved"], default: "pending" },
  },
  { timestamps: true }
);

// Create unique index safely
studentSchema.index(
  { universityId: 1 },
  { unique: true, partialFilterExpression: { universityId: { $ne: null } } }
);

export default mongoose.model("Student", studentSchema);
