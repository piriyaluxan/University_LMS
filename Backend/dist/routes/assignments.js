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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const Assignment_1 = require("../models/Assignment");
const Submission_1 = require("../models/Submission");
const router = express_1.default.Router();
const uploadDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
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
const fileFilter = (_req, file, cb) => {
    if (allowed.includes(file.mimetype))
        return cb(null, true);
    cb(new Error("Unsupported file type"));
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
});
router.get("/enrolled", auth_1.protect, async (req, res) => {
    try {
        const { Enrollment } = await Promise.resolve().then(() => __importStar(require("../models/Enrollment")));
        const enrollments = await Enrollment.find({
            student: req.user._id,
            status: { $in: ["active", "completed"] },
        }).select("course");
        const enrolledCourseIds = enrollments.map((e) => e.course);
        const assignments = await Assignment_1.Assignment.find({
            course: { $in: enrolledCourseIds },
        })
            .populate("course", "title code")
            .populate("createdBy", "firstName lastName")
            .sort({ dueDate: 1 });
        res.json({ success: true, data: assignments });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/", auth_1.protect, async (req, res) => {
    try {
        const course = req.query.course;
        const query = {};
        if (course)
            query.course = course;
        const assignments = await Assignment_1.Assignment.find(query)
            .populate("createdBy", "firstName lastName email")
            .sort({ createdAt: -1 });
        res.json({ success: true, data: assignments });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post("/", auth_1.protect, (0, auth_1.authorize)("admin", "instructor"), upload.single("file"), async (req, res) => {
    try {
        const { title, description, courseId, dueDate } = req.body;
        if (!title || !courseId) {
            res.status(400).json({ success: false, error: "Missing fields" });
            return;
        }
        const assignment = await Assignment_1.Assignment.create({
            title,
            description,
            course: courseId,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            createdBy: req.user._id,
            attachmentUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
            attachmentName: req.file ? req.file.originalname : undefined,
        });
        res.status(201).json({ success: true, data: assignment });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, error: error.message || "Server error" });
    }
});
router.post("/:id/submissions", auth_1.protect, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: "No file uploaded" });
            return;
        }
        const assignmentId = req.params.id;
        const submission = await Submission_1.Submission.create({
            assignment: assignmentId,
            student: req.user._id,
            fileUrl: `/uploads/${req.file.filename}`,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
        });
        res.status(201).json({ success: true, data: submission });
    }
    catch (error) {
        if (error?.code === 11000) {
            res.status(400).json({ success: false, error: "Already submitted" });
            return;
        }
        res
            .status(500)
            .json({ success: false, error: error.message || "Server error" });
    }
});
router.get("/:id/submissions", auth_1.protect, (0, auth_1.authorize)("admin", "instructor"), async (req, res) => {
    try {
        const submissions = await Submission_1.Submission.find({ assignment: req.params.id })
            .populate("student", "firstName lastName email studentId")
            .sort({ submittedAt: -1 });
        res.json({ success: true, data: submissions });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});
router.get("/:assignmentId/submissions/:submissionId/download", auth_1.protect, async (req, res) => {
    try {
        const submission = await Submission_1.Submission.findById(req.params.submissionId).populate("student", "_id role");
        if (!submission) {
            res.status(404).json({ success: false, error: "Submission not found" });
            return;
        }
        const isOwner = submission.student &&
            submission.student._id.toString() === req.user._id.toString();
        const isPrivileged = ["admin", "instructor"].includes(req.user.role);
        if (!isOwner && !isPrivileged) {
            res.status(403).json({ success: false, error: "Not authorized" });
            return;
        }
        const filePath = path_1.default.join(uploadDir, submission.fileName);
        res.download(filePath, submission.originalName);
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});
router.get("/submissions", auth_1.protect, async (req, res) => {
    try {
        const submissions = await Submission_1.Submission.find({ student: req.user._id })
            .populate("assignment", "title course")
            .sort({ submittedAt: -1 });
        res.json({ success: true, data: submissions });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=assignments.js.map