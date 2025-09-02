import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { protect, authorize } from "../middleware/auth";
import { Material } from "../models/Material";

const router = express.Router();

// Storage setup
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

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = [
    "video/mp4",
    "image/png",
    "image/jpeg",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Unsupported file type"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// @desc    Get materials for enrolled courses (student)
// @route   GET /api/materials/enrolled
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

    // Get materials for enrolled courses
    const materials = await Material.find({
      course: { $in: enrolledCourseIds },
    })
      .populate("course", "title code")
      .populate("uploadedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get all materials
// @route   GET /api/materials
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const course = req.query.course as string | undefined;
    const query: any = {};
    if (course) query.course = course;
    const materials = await Material.find(query)
      .populate("uploadedBy", "firstName lastName email")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Upload new material
// @route   POST /api/materials
// @access  Private (instructor/admin)
router.post(
  "/",
  protect,
  authorize("admin", "instructor"),
  upload.single("file"),
  async (req, res) => {
    try {
      const { title, description, courseId } = req.body as any;
      if (!req.file || !title || !courseId) {
        res.status(400).json({ success: false, error: "Missing fields" });
        return;
      }

      const extension = path.extname(req.file.originalname).toLowerCase();
      let fileType: any = "other";
      if ([".mp4"].includes(extension)) fileType = "video";
      else if ([".png", ".jpg", ".jpeg"].includes(extension))
        fileType = "image";
      else if (extension === ".pdf") fileType = "pdf";
      else if (extension === ".docx") fileType = "docx";

      const material = await Material.create({
        title,
        description,
        course: courseId,
        uploadedBy: req.user!._id,
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileType,
        size: req.file.size,
      });

      res.status(201).json({ success: true, data: material });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: error.message || "Server error" });
    }
  }
);

// @desc    Download material
// @route   GET /api/materials/:id/download
// @access  Private
router.get("/:id/download", protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      res.status(404).json({ success: false, error: "Material not found" });
      return;
    }
    const filePath = path.join(uploadDir, material.fileName);
    res.download(filePath, material.originalName);
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
