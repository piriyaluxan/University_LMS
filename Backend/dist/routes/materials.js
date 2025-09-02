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
const Material_1 = require("../models/Material");
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
const fileFilter = (_req, file, cb) => {
    const allowed = [
        "video/mp4",
        "image/png",
        "image/jpeg",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
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
        const materials = await Material_1.Material.find({
            course: { $in: enrolledCourseIds },
        })
            .populate("course", "title code")
            .populate("uploadedBy", "firstName lastName")
            .sort({ createdAt: -1 });
        res.json({ success: true, data: materials });
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
        const materials = await Material_1.Material.find(query)
            .populate("uploadedBy", "firstName lastName email")
            .sort({ createdAt: -1 });
        res.json({ success: true, data: materials });
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
        const { title, description, courseId } = req.body;
        if (!req.file || !title || !courseId) {
            res.status(400).json({ success: false, error: "Missing fields" });
            return;
        }
        const extension = path_1.default.extname(req.file.originalname).toLowerCase();
        let fileType = "other";
        if ([".mp4"].includes(extension))
            fileType = "video";
        else if ([".png", ".jpg", ".jpeg"].includes(extension))
            fileType = "image";
        else if (extension === ".pdf")
            fileType = "pdf";
        else if (extension === ".docx")
            fileType = "docx";
        const material = await Material_1.Material.create({
            title,
            description,
            course: courseId,
            uploadedBy: req.user._id,
            fileUrl: `/uploads/${req.file.filename}`,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileType,
            size: req.file.size,
        });
        res.status(201).json({ success: true, data: material });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, error: error.message || "Server error" });
    }
});
router.get("/:id/download", auth_1.protect, async (req, res) => {
    try {
        const material = await Material_1.Material.findById(req.params.id);
        if (!material) {
            res.status(404).json({ success: false, error: "Material not found" });
            return;
        }
        const filePath = path_1.default.join(uploadDir, material.fileName);
        res.download(filePath, material.originalName);
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=materials.js.map