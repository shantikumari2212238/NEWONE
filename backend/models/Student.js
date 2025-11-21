// backend/models/Student.js
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    universityId: {
      type: String,
      required: true,
      unique: true,   // unique ID per student
      uppercase: true,
      trim: true,
    },

    universityName: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    idCardImage: {
      type: String,  // saved multer path, e.g. "uploads/12345-id.jpg"
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/*  
 Prevent duplicate index warnings:
 Render was complaining because you previously had both:
  - { unique: true }
  - schema.index()

 We ONLY keep the schema-level one.
*/
studentSchema.index({ universityId: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema);
