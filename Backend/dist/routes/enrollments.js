"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Enrollment_1 = require("../models/Enrollment");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const enrollments = await Enrollment_1.Enrollment.find()
            .populate("student", "firstName lastName email studentId")
            .populate("course", "title code instructor capacity enrolled");
        const mapped = enrollments.map((e) => ({
            ...e.toObject(),
            status: e.status === "active"
                ? "enrolled"
                : e.status === "suspended"
                    ? "dropped"
                    : e.status,
        }));
        res.json({ success: true, data: mapped });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/student/me", auth_1.protect, async (req, res) => {
    try {
        const enrollments = await Enrollment_1.Enrollment.find({
            student: req.user._id,
        }).populate("course", "title code description instructor duration");
        res.json({
            success: true,
            data: enrollments,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/student/:studentId", auth_1.protect, async (req, res) => {
    try {
        const enrollments = await Enrollment_1.Enrollment.find({
            student: req.params.studentId,
        }).populate("course", "title code description instructor duration");
        res.json({
            success: true,
            data: enrollments,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post("/", auth_1.protect, async (req, res) => {
    try {
        const { courseId, studentId: studentIdFromBody, status, } = req.body;
        const studentId = (req.user && req.user.role === "admin" && studentIdFromBody) ||
            req.user._id;
        const existingEnrollment = await Enrollment_1.Enrollment.findOne({
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
        const statusMap = {
            enrolled: "active",
            pending: "active",
            completed: "completed",
            dropped: "dropped",
        };
        const enrollment = await Enrollment_1.Enrollment.create({
            student: studentId,
            course: courseId,
            status: status ? statusMap[status] || "active" : undefined,
        });
        const populatedEnrollment = await Enrollment_1.Enrollment.findById(enrollment._id)
            .populate("course", "title code description instructor duration")
            .populate("student", "firstName lastName email");
        res.status(201).json({
            success: true,
            data: populatedEnrollment,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.patch("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            res.status(400).json({ success: false, error: "Status is required" });
            return;
        }
        const statusMap = {
            enrolled: "active",
            pending: "active",
            completed: "completed",
            dropped: "dropped",
        };
        const updated = await Enrollment_1.Enrollment.findByIdAndUpdate(req.params.id, { status: statusMap[status] || "active" }, { new: true, runValidators: true })
            .populate("student", "firstName lastName email studentId")
            .populate("course", "title code instructor capacity enrolled");
        if (!updated) {
            res.status(404).json({ success: false, error: "Enrollment not found" });
            return;
        }
        const mapped = {
            ...updated.toObject(),
            status: updated.status === "active"
                ? "enrolled"
                : updated.status === "suspended"
                    ? "dropped"
                    : updated.status,
        };
        res.json({ success: true, data: mapped });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=enrollments.js.map