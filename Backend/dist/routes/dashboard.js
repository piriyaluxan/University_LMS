"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const Course_1 = require("../models/Course");
const Enrollment_1 = require("../models/Enrollment");
const Result_1 = __importDefault(require("../models/Result"));
const router = express_1.default.Router();
router.get("/counts", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const { Material } = await Promise.resolve().then(() => __importStar(require("../models/Material")));
        const { Assignment } = await Promise.resolve().then(() => __importStar(require("../models/Assignment")));
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/stats", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const totalCourses = await Course_1.Course.countDocuments();
        const totalStudents = await User_1.User.countDocuments({ role: "student" });
        const totalEnrollments = await Enrollment_1.Enrollment.countDocuments();
        const completedCourses = await Enrollment_1.Enrollment.countDocuments({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/recent-enrollments", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const recentEnrollments = await Enrollment_1.Enrollment.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("student", "firstName lastName email studentId")
            .populate("course", "title code");
        res.json({
            success: true,
            data: recentEnrollments,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/course-performance", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const coursePerformance = await Result_1.default.aggregate([
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/metrics", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const [totalCourses, totalStudents, totalInstructors, totalEnrollments, totalResults, activeEnrollments, completedEnrollments, averageResultScore, topPerformingCourse, recentActivity,] = await Promise.all([
            Course_1.Course.countDocuments(),
            User_1.User.countDocuments({ role: "student" }),
            User_1.User.countDocuments({ role: "instructor" }),
            Enrollment_1.Enrollment.countDocuments(),
            Result_1.default.countDocuments(),
            Enrollment_1.Enrollment.countDocuments({ status: "active" }),
            Enrollment_1.Enrollment.countDocuments({ status: "completed" }),
            Result_1.default.aggregate([
                { $group: { _id: null, avgScore: { $avg: "$finalPercentage" } } },
            ]),
            Result_1.default.aggregate([
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
            Enrollment_1.Enrollment.find()
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
                completionRate: totalEnrollments > 0
                    ? (completedEnrollments / totalEnrollments) * 100
                    : 0,
            },
            performance: {
                averageScore: averageResultScore[0]?.avgScore || 0,
                topCourse: topPerformingCourse[0] || null,
            },
            recentActivity: recentActivity.map((activity) => ({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map