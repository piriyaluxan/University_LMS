import express from "express";
import { Course } from "../models/Course";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const level = req.query.level as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const query: any = {};

    if (category) query.category = category;
    if (level) query.level = level;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const courses = await Course.find(query)
      .populate("instructor", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get available courses for student (excluding enrolled courses)
// @route   GET /api/courses/available
// @access  Private (student)
router.get("/available", protect, async (req, res) => {
  try {
    // Get student's enrollments
    const { Enrollment } = await import("../models/Enrollment");
    const enrollments = await Enrollment.find({
      student: req.user!._id,
      status: { $in: ["active", "completed"] },
    }).select("course");

    const enrolledCourseIds = enrollments.map((e) => e.course);

    // Get courses that the student is not enrolled in
    const courses = await Course.find({
      _id: { $nin: enrolledCourseIds },
    })
      .populate("instructor", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get courses by instructor
// @route   GET /api/courses/instructor
// @access  Private/Instructor
router.get(
  "/instructor",
  protect,
  authorize("instructor"),
  async (req, res) => {
    try {
      const courses = await Course.find({ instructor: req.user!._id })
        .populate("instructor", "firstName lastName email")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: courses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "instructor",
      "firstName lastName email"
    );

    if (!course) {
      res.status(404).json({
        success: false,
        error: "Course not found",
      });
      return;
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("instructor", "firstName lastName email");

    if (!course) {
      res.status(404).json({
        success: false,
        error: "Course not found",
      });
      return;
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      res.status(404).json({
        success: false,
        error: "Course not found",
      });
      return;
    }

    await course.deleteOne();

    res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

export default router;
