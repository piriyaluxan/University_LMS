import express from "express";
import { Enrollment } from "../models/Enrollment";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private/Admin
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate("student", "firstName lastName email studentId")
      .populate("course", "title code instructor capacity enrolled");

    // Map backend status to frontend registration wording
    const mapped = enrollments.map((e: any) => ({
      ...e.toObject(),
      status:
        e.status === "active"
          ? "enrolled"
          : e.status === "suspended"
          ? "dropped"
          : e.status,
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get enrollments by student (own enrollments only)
// @route   GET /api/enrollments/student/me
// @access  Private (student)
router.get("/student/me", protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user!._id,
    }).populate("course", "title code description instructor duration");

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get enrollments by student
// @route   GET /api/enrollments/student/:studentId
// @access  Private
router.get("/student/:studentId", protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.params.studentId,
    }).populate("course", "title code description instructor duration");

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Enroll in course
// @route   POST /api/enrollments
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const {
      courseId,
      studentId: studentIdFromBody,
      status,
    } = req.body as {
      courseId: string;
      studentId?: string;
      status?: "pending" | "enrolled" | "completed" | "dropped";
    };

    // Allow admin to specify studentId; otherwise use current user
    const studentId =
      (req.user && req.user.role === "admin" && studentIdFromBody) ||
      (req.user!._id as any);

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment) {
      res.status(400).json({
        success: false,
        error: "Already enrolled in this course",
      });
      return;
    }

    // Map frontend status -> backend enum
    const statusMap: Record<string, string> = {
      enrolled: "active",
      pending: "active",
      completed: "completed",
      dropped: "dropped",
    };

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      status: status ? statusMap[status] || "active" : undefined,
    });

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate("course", "title code description instructor duration")
      .populate("student", "firstName lastName email");

    res.status(201).json({
      success: true,
      data: populatedEnrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Update enrollment status
// @route   PATCH /api/enrollments/:id
// @access  Private/Admin
router.patch("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.body as {
      status: "pending" | "enrolled" | "completed" | "dropped";
    };

    if (!status) {
      res.status(400).json({ success: false, error: "Status is required" });
      return;
    }

    const statusMap: Record<string, string> = {
      enrolled: "active",
      pending: "active",
      completed: "completed",
      dropped: "dropped",
    };

    const updated = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status: statusMap[status] || "active" },
      { new: true, runValidators: true }
    )
      .populate("student", "firstName lastName email studentId")
      .populate("course", "title code instructor capacity enrolled");

    if (!updated) {
      res.status(404).json({ success: false, error: "Enrollment not found" });
      return;
    }

    // Map back to frontend wording
    const mapped = {
      ...updated.toObject(),
      status:
        updated.status === "active"
          ? "enrolled"
          : updated.status === "suspended"
          ? "dropped"
          : updated.status,
    } as any;

    res.json({ success: true, data: mapped });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
