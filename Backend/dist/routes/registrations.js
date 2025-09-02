"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Registration_1 = require("../models/Registration");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1");
        const limit = parseInt(req.query.limit || "20");
        const status = req.query.status;
        const search = req.query.search?.trim();
        const query = {};
        if (status)
            query.status = status;
        const registrationsQuery = Registration_1.Registration.find(query)
            .populate("student", "firstName lastName email studentId")
            .populate("course", "title code capacity enrolled");
        const skip = (page - 1) * limit;
        let registrations = await registrationsQuery
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        if (search) {
            const lower = search.toLowerCase();
            registrations = registrations.filter((r) => {
                const studentName = `${r.student?.firstName || ""} ${r.student?.lastName || ""}`.toLowerCase();
                const studentEmail = (r.student?.email || "").toLowerCase();
                const courseTitle = (r.course?.title || "").toLowerCase();
                const courseCode = (r.course?.code || "").toLowerCase();
                return (studentName.includes(lower) ||
                    studentEmail.includes(lower) ||
                    courseTitle.includes(lower) ||
                    courseCode.includes(lower));
            });
        }
        const total = await Registration_1.Registration.countDocuments(query);
        res.json({
            success: true,
            data: registrations,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});
router.post("/", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const { studentId, courseId, status } = req.body;
        if (!studentId || !courseId) {
            res.status(400).json({ success: false, error: "Missing fields" });
            return;
        }
        const registration = await Registration_1.Registration.create({
            student: studentId,
            course: courseId,
            status: status || "enrolled",
        });
        const populated = await Registration_1.Registration.findById(registration._id)
            .populate("student", "firstName lastName email studentId")
            .populate("course", "title code capacity enrolled");
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        if (error?.code === 11000) {
            res
                .status(400)
                .json({ success: false, error: "Student already registered" });
            return;
        }
        res.status(500).json({ success: false, error: "Server error" });
    }
});
router.patch("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Registration_1.Registration.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })
            .populate("student", "firstName lastName email studentId")
            .populate("course", "title code capacity enrolled");
        if (!updated) {
            res.status(404).json({ success: false, error: "Registration not found" });
            return;
        }
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});
router.delete("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const existing = await Registration_1.Registration.findById(req.params.id);
        if (!existing) {
            res.status(404).json({ success: false, error: "Registration not found" });
            return;
        }
        await existing.deleteOne();
        res.json({ success: true, message: "Registration deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=registrations.js.map