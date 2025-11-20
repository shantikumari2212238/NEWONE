// server/routes/adminStudentRoutes.js
import express from "express";
import Student from "../models/Student.js"; // Import the Student Mongoose model

// Create a new Express router instance for admin-student actions
const router = express.Router();

/* ===========================================================
   🧩 GET /api/admin/students/pending — Fetch all pending students
   ===========================================================
   → Called by: Admin dashboard
   → Purpose: Allows the admin to view students who signed up but are not yet approved.
   → Logic:
       - Query Student collection for records with { status: "pending" }.
       - Sort them in descending order of creation (newest first).
       - Return array of pending students as JSON.
*/
router.get("/pending", async (req, res) => {
  try {
    // Find all pending students and sort by latest
    const students = await Student.find({ status: "pending" }).sort({ createdAt: -1 });
    
    // Send list of pending students to client (admin panel)
    res.json(students);
  } catch (err) {
    console.error("Error fetching pending students:", err);
    res.status(500).json({ message: "Server error while fetching students" });
  }
});

/* ===========================================================
   🧩 PUT /api/admin/students/approve/:id — Approve student account
   ===========================================================
   → Called by: Admin when approving a student signup
   → Purpose: Updates the student's status from "pending" to "approved"
   → Params: :id = MongoDB _id of the student
   → Returns: Updated student record + confirmation message
*/
router.put("/approve/:id", async (req, res) => {
  try {
    // 1️⃣ Find the student by ID
    const student = await Student.findById(req.params.id);

    // 2️⃣ If not found, return 404
    if (!student) return res.status(404).json({ message: "Student not found" });

    // 3️⃣ Update the student's status
    student.status = "approved";

    // 4️⃣ Save updated record in MongoDB
    await student.save();

    // 5️⃣ Respond with confirmation
    res.json({ message: "Student approved successfully", student });
  } catch (err) {
    console.error("Error approving student:", err);
    res.status(500).json({ message: "Server error while approving student" });
  }
});

/* ===========================================================
   🧩 PUT /api/admin/students/reject/:id — Reject student account
   ===========================================================
   → Called by: Admin when rejecting a student signup
   → Purpose: Updates the student's status to "rejected"
   → Params: :id = MongoDB _id of the student
   → Returns: Updated student record + message
*/
router.put("/reject/:id", async (req, res) => {
  try {
    // 1️⃣ Find the student by ID
    const student = await Student.findById(req.params.id);

    // 2️⃣ If no record found, return 404
    if (!student) return res.status(404).json({ message: "Student not found" });

    // 3️⃣ Update the status to "rejected"
    student.status = "rejected";

    // 4️⃣ Save changes to DB
    await student.save();

    // 5️⃣ Respond with success message and updated record
    res.json({ message: "Student rejected successfully", student });
  } catch (err) {
    console.error("Error rejecting student:", err);
    res.status(500).json({ message: "Server error while rejecting student" });
  }
});

// Export the router so it can be mounted in the main server file
export default router;
