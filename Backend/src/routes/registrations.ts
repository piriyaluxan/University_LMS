import express from "express";
import { Registration } from "../models/Registration";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// @desc    Get all registrations (with pagination and search)
// @route   GET /api/registrations
// @access  Private/Admin
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "20");
    const status = req.query.status as string | undefined;
    const search = (req.query.search as string | undefined)?.trim();

    const query: any = {};
    if (status) query.status = status;

    // Search by student name/email or course title/code via populated fields
    const registrationsQuery = Registration.find(query)
      .populate("student", "firstName lastName email studentId")
      .populate("course", "title code capacity enrolled");

    // Basic pagination
    const skip = (page - 1) * limit;

    // Execute base query to filter by populated values when search provided
    let registrations = await registrationsQuery
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (search) {
      const lower = search.toLowerCase();
      registrations = registrations.filter((r: any) => {
        const studentName = `${r.student?.firstName || ""} ${
          r.student?.lastName || ""
        }`.toLowerCase();
        const studentEmail = (r.student?.email || "").toLowerCase();
        const courseTitle = (r.course?.title || "").toLowerCase();
        const courseCode = (r.course?.code || "").toLowerCase();
        return (
          studentName.includes(lower) ||
          studentEmail.includes(lower) ||
          courseTitle.includes(lower) ||
          courseCode.includes(lower)
        );
      });
    }

    const total = await Registration.countDocuments(query);

    res.json({
      success: true,
      data: registrations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Create a registration
// @route   POST /api/registrations
// @access  Private/Admin
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { studentId, courseId, status } = req.body as {
      studentId: string;
      courseId: string;
      status?: "pending" | "enrolled" | "completed" | "dropped";
    };

    if (!studentId || !courseId) {
      res.status(400).json({ success: false, error: "Missing fields" });
      return;
    }

    const registration = await Registration.create({
      student: studentId,
      course: courseId,
      status: status || "enrolled",
    });

    const populated = await Registration.findById(registration._id)
      .populate("student", "firstName lastName email studentId")
      .populate("course", "title code capacity enrolled");

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    if (error?.code === 11000) {
      res
        .status(400)
        .json({ success: false, error: "Student already registered" });
      return;
    }
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Update registration status
// @route   PATCH /api/registrations/:id
// @access  Private/Admin
router.patch("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.body as {
      status: "pending" | "enrolled" | "completed" | "dropped";
    };

    const updated = await Registration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("student", "firstName lastName email studentId")
      .populate("course", "title code capacity enrolled");

    if (!updated) {
      res.status(404).json({ success: false, error: "Registration not found" });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Delete a registration
// @route   DELETE /api/registrations/:id
// @access  Private/Admin
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const existing = await Registration.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: "Registration not found" });
      return;
    }
    await existing.deleteOne();
    res.json({ success: true, message: "Registration deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;

