import express from "express";
import { protect, authorize } from "../middleware/auth";
import { User } from "../models/User";
import { Course } from "../models/Course";
import { Enrollment } from "../models/Enrollment";
import Result from "../models/Result";

const router = express.Router();

// @desc    Get materials and assignments count
// @route   GET /api/dashboard/counts
// @access  Private/Admin
router.get("/counts", protect, authorize("admin"), async (req, res) => {
  try {
    const { Material } = await import("../models/Material");
    const { Assignment } = await import("../models/Assignment");

    const [totalMaterials, totalAssignments] = await Promise.all([
      Material.countDocuments(),
      Assignment.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        totalMaterials,
        totalAssignments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
router.get("/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalEnrollments = await Enrollment.countDocuments();
    const completedCourses = await Enrollment.countDocuments({
      status: "completed",
    });

    res.json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        totalEnrollments,
        completedCourses,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get recent enrollments
// @route   GET /api/dashboard/recent-enrollments
// @access  Private/Admin
router.get(
  "/recent-enrollments",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const recentEnrollments = await Enrollment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("student", "firstName lastName email studentId")
        .populate("course", "title code");

      res.json({
        success: true,
        data: recentEnrollments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// @desc    Get course performance metrics
// @route   GET /api/dashboard/course-performance
// @access  Private/Admin
router.get(
  "/course-performance",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const coursePerformance = await Result.aggregate([
        {
          $lookup: {
            from: "courses",
            localField: "course",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        {
          $unwind: "$courseInfo",
        },
        {
          $group: {
            _id: "$course",
            courseTitle: { $first: "$courseInfo.title" },
            courseCode: { $first: "$courseInfo.code" },
            totalStudents: { $sum: 1 },
            averageScore: { $avg: "$finalPercentage" },
            passedCount: {
              $sum: { $cond: [{ $eq: ["$status", "passed"] }, 1, 0] },
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            courseTitle: 1,
            courseCode: 1,
            totalStudents: 1,
            averageScore: { $round: ["$averageScore", 2] },
            passedCount: 1,
            failedCount: 1,
            passRate: {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$passedCount", "$totalStudents"] },
                    100,
                  ],
                },
                2,
              ],
            },
          },
        },
        { $sort: { averageScore: -1 } },
      ]);

      res.json({
        success: true,
        data: coursePerformance,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// @desc    Get comprehensive dashboard metrics
// @route   GET /api/dashboard/metrics
// @access  Private/Admin
router.get("/metrics", protect, authorize("admin"), async (req, res) => {
  try {
    const [
      totalCourses,
      totalStudents,
      totalInstructors,
      totalEnrollments,
      totalResults,
      activeEnrollments,
      completedEnrollments,
      averageResultScore,
      topPerformingCourse,
      recentActivity,
    ] = await Promise.all([
      Course.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
      Enrollment.countDocuments(),
      Result.countDocuments(),
      Enrollment.countDocuments({ status: "active" }),
      Enrollment.countDocuments({ status: "completed" }),
      Result.aggregate([
        { $group: { _id: null, avgScore: { $avg: "$finalPercentage" } } },
      ]),
      Result.aggregate([
        {
          $lookup: {
            from: "courses",
            localField: "course",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        {
          $unwind: "$courseInfo",
        },
        {
          $group: {
            _id: "$course",
            courseTitle: { $first: "$courseInfo.title" },
            averageScore: { $avg: "$finalPercentage" },
          },
        },
        { $sort: { averageScore: -1 } },
        { $limit: 1 },
      ]),
      Enrollment.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("student", "firstName lastName")
        .populate("course", "title"),
    ]);

    const metrics = {
      overview: {
        totalCourses,
        totalStudents,
        totalInstructors,
        totalEnrollments,
        totalResults,
      },
      enrollments: {
        active: activeEnrollments,
        completed: completedEnrollments,
        completionRate:
          totalEnrollments > 0
            ? (completedEnrollments / totalEnrollments) * 100
            : 0,
      },
      performance: {
        averageScore: averageResultScore[0]?.avgScore || 0,
        topCourse: topPerformingCourse[0] || null,
      },
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity._id,
        studentName: `${activity.student.firstName} ${activity.student.lastName}`,
        courseName: activity.course.title,
        status: activity.status,
        date: activity.createdAt,
      })),
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

export default router;
