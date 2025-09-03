import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { protect, authorize } from "../middleware/auth";
import { Assignment } from "../models/Assignment";
import { Submission } from "../models/Submission";

const router = express.Router();

// Storage setup shared with materials (use same uploads dir)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
    cb(null, `${timestamp}_${sanitized}`);
  },
});

const allowed = [
  "video/mp4",
  "image/png",
  "image/jpeg",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Unsupported file type"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// @desc    Get assignments for enrolled courses (student)
// @route   GET /api/assignments/enrolled
// @access  Private (student)
router.get("/enrolled", protect, async (req, res) => {
  try {
    // Get student's enrollments
    const { Enrollment } = await import("../models/Enrollment");
    const enrollments = await Enrollment.find({
      student: req.user!._id,
      status: { $in: ["active", "completed"] },
    }).select("course");

    const enrolledCourseIds = enrollments.map((e) => e.course);

    // Get assignments for enrolled courses
    const assignments = await Assignment.find({
      course: { $in: enrolledCourseIds },
    })
      .populate("course", "title code")
      .populate("createdBy", "firstName lastName")
      .sort({ dueDate: 1 });

    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get all assignments
// @route   GET /api/assignments
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const course = req.query.course as string | undefined;
    const query: any = {};
    if (course) query.course = course;
    const assignments = await Assignment.find(query)
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Create assignment (optional attachment)
// @route   POST /api/assignments
// @access  Private (instructor/admin)
router.post(
  "/",
  protect,
  authorize("admin", "instructor"),
  upload.single("file"),
  async (req, res) => {
    try {
      const { title, description, courseId, dueDate } = req.body as any;
      if (!title || !courseId) {
        res.status(400).json({ success: false, error: "Missing fields" });
        return;
      }
      const assignment = await Assignment.create({
        title,
        description,
        course: courseId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdBy: req.user!._id,
        attachmentUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        attachmentName: req.file ? req.file.originalname : undefined,
      });
      res.status(201).json({ success: true, data: assignment });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: error.message || "Server error" });
    }
  }
);

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private (instructor/admin)
router.put(
  "/:id",
  protect,
  authorize("admin", "instructor"),
  upload.single("file"),
  async (req, res) => {
    try {
      const { title, description, courseId, dueDate } = req.body as any;
      const assignmentId = req.params.id;

      if (!title || !courseId) {
        res
          .status(400)
          .json({ success: false, error: "Missing required fields" });
        return;
      }

      const updateData: any = {
        title,
        description,
        course: courseId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      };

      // Only update file if a new one is uploaded
      if (req.file) {
        updateData.attachmentUrl = `/uploads/${req.file.filename}`;
        updateData.attachmentName = req.file.originalname;
      }

      const assignment = await Assignment.findByIdAndUpdate(
        assignmentId,
        updateData,
        { new: true }
      ).populate("createdBy", "firstName lastName");

      if (!assignment) {
        res.status(404).json({ success: false, error: "Assignment not found" });
        return;
      }

      res.json({ success: true, data: assignment });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: error.message || "Server error" });
    }
  }
);

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (instructor/admin)
router.delete(
  "/:id",
  protect,
  authorize("admin", "instructor"),
  async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const assignment = await Assignment.findByIdAndDelete(assignmentId);

      if (!assignment) {
        res.status(404).json({ success: false, error: "Assignment not found" });
        return;
      }

      res.json({ success: true, message: "Assignment deleted successfully" });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: error.message || "Server error" });
    }
  }
);

// @desc    Submit assignment (student)
// @route   POST /api/assignments/:id/submissions
// @access  Private
router.post(
  "/:id/submissions",
  protect,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "No file uploaded" });
        return;
      }
      const assignmentId = req.params.id;
      const submission = await Submission.create({
        assignment: assignmentId,
        student: req.user!._id,
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
      res.status(201).json({ success: true, data: submission });
    } catch (error: any) {
      if (error?.code === 11000) {
        res.status(400).json({ success: false, error: "Already submitted" });
        return;
      }
      res
        .status(500)
        .json({ success: false, error: error.message || "Server error" });
    }
  }
);

// @desc    List submissions for an assignment (instructor/admin)
// @route   GET /api/assignments/:id/submissions
// @access  Private (instructor/admin)
router.get(
  "/:id/submissions",
  protect,
  authorize("admin", "instructor"),
  async (req, res) => {
    try {
      const submissions = await Submission.find({ assignment: req.params.id })
        .populate("student", "firstName lastName email studentId")
        .sort({ submittedAt: -1 });
      res.json({ success: true, data: submissions });
    } catch (error) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// @desc    Download a submission
// @route   GET /api/assignments/:assignmentId/submissions/:submissionId/download
// @access  Private (instructor/admin or owner)
router.get(
  "/:assignmentId/submissions/:submissionId/download",
  protect,
  async (req, res) => {
    try {
      const submission = await Submission.findById(
        req.params.submissionId
      ).populate("student", "_id role");
      if (!submission) {
        res.status(404).json({ success: false, error: "Submission not found" });
        return;
      }
      // Allow admin/instructor or the owner student
      const isOwner =
        submission.student &&
        (submission.student as any)._id.toString() === req.user!._id.toString();
      const isPrivileged = ["admin", "instructor"].includes(req.user!.role);
      if (!isOwner && !isPrivileged) {
        res.status(403).json({ success: false, error: "Not authorized" });
        return;
      }
      const filePath = path.join(uploadDir, submission.fileName);
      res.download(filePath, submission.originalName);
    } catch (error) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// @desc    Grade/Review a submission
// @route   PATCH /api/assignments/:assignmentId/submissions/:submissionId
// @access  Private (admin/instructor)
router.patch(
  "/:assignmentId/submissions/:submissionId",
  protect,
  authorize("admin", "instructor"),
  async (req, res) => {
    try {
      const { grade, remarks } = req.body as { grade?: string; remarks?: string };
      const submission = await Submission.findByIdAndUpdate(
        req.params.submissionId,
        { grade, remarks },
        { new: true }
      ).populate("student", "firstName lastName email studentId");
      if (!submission) {
        res.status(404).json({ success: false, error: "Submission not found" });
        return;
      }
      res.json({ success: true, data: submission });
    } catch (error) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// @desc    Delete a submission (admin)
// @route   DELETE /api/assignments/:assignmentId/submissions/:submissionId
// @access  Private (admin)
router.delete(
  "/:assignmentId/submissions/:submissionId",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const submission = await Submission.findByIdAndDelete(
        req.params.submissionId
      );
      if (!submission) {
        res.status(404).json({ success: false, error: "Submission not found" });
        return;
      }
      res.json({ success: true, message: "Submission deleted" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// @desc    Get all submissions for current user (student)
// @route   GET /api/assignments/submissions
// @access  Private
router.get("/submissions", protect, async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user!._id })
      .populate("assignment", "title course")
      .sort({ submittedAt: -1 });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
