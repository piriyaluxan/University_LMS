import express from "express";
import { User } from "../models/User";
import { protect, authorize } from "../middleware/auth";
import { Course } from "../models/Course";

const router = express.Router();

// @desc    Get all students
// @route   GET /api/users/students
// @access  Private/Instructor
router.get("/students", protect, authorize("instructor"), async (req, res) => {
  try {
    const students = await User.find({ role: "student", isActive: true })
      .select("-password")
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const search = req.query.search as string;

    const query: any = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
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

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    // Prevent updating password via this route
    const { password, ...updatable } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updatable, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Activate/Deactivate user
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
router.patch("/:id/status", protect, authorize("admin"), async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: Boolean(isActive) },
      { new: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Assign courses to an instructor (replace assignment set)
// @route   PATCH /api/users/:id/instructor-courses
// @access  Private/Admin
router.patch(
  "/:id/instructor-courses",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const instructorId = req.params.id;
      const { courseIds } = req.body as { courseIds: string[] };

      const instructor = await User.findById(instructorId);
      if (!instructor || instructor.role !== "instructor") {
        res
          .status(404)
          .json({ success: false, error: "Instructor not found" });
        return;
      }

      const courses = await Course.find({ _id: { $in: courseIds || [] } });
      if ((courseIds || []).length !== courses.length) {
        res
          .status(400)
          .json({ success: false, error: "One or more courses invalid" });
        return;
      }

      // Unassign any courses currently linked to this instructor that are not requested
      await Course.updateMany(
        { instructor: instructorId, _id: { $nin: courseIds || [] } },
        { $set: { instructor: instructorId } }
      );

      // Assign requested courses to instructor
      await Course.updateMany(
        { _id: { $in: courseIds || [] } },
        { $set: { instructor: instructorId } }
      );

      const updated = await Course.find({ instructor: instructorId }).select(
        "title code instructor"
      );

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

export default router;
