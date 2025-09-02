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
const Course_1 = require("../models/Course");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const level = req.query.level;
        const status = req.query.status;
        const search = req.query.search;
        const query = {};
        if (category)
            query.category = category;
        if (level)
            query.level = level;
        if (status)
            query.status = status;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        const skip = (page - 1) * limit;
        const courses = await Course_1.Course.find(query)
            .populate("instructor", "firstName lastName email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Course_1.Course.countDocuments(query);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/available", auth_1.protect, async (req, res) => {
    try {
        const { Enrollment } = await Promise.resolve().then(() => __importStar(require("../models/Enrollment")));
        const enrollments = await Enrollment.find({
            student: req.user._id,
            status: { $in: ["active", "completed"] },
        }).select("course");
        const enrolledCourseIds = enrollments.map((e) => e.course);
        const courses = await Course_1.Course.find({
            _id: { $nin: enrolledCourseIds },
        })
            .populate("instructor", "firstName lastName email")
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: courses,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/instructor", auth_1.protect, (0, auth_1.authorize)("instructor"), async (req, res) => {
    try {
        const courses = await Course_1.Course.find({ instructor: req.user._id })
            .populate("instructor", "firstName lastName email")
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: courses,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const course = await Course_1.Course.findById(req.params.id).populate("instructor", "firstName lastName email");
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post("/", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const course = await Course_1.Course.create(req.body);
        res.status(201).json({
            success: true,
            data: course,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.put("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const course = await Course_1.Course.findByIdAndUpdate(req.params.id, req.body, {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.delete("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const course = await Course_1.Course.findById(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
exports.default = router;
//# sourceMappingURL=courses.js.map