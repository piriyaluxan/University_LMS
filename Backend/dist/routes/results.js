"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Result_1 = __importDefault(require("../models/Result"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
router.get("/", auth_1.protect, async (req, res) => {
    try {
        const query = {};
        if (req.user.role !== "admin") {
            query.student = req.user._id;
        }
        else if (req.query.student) {
            query.student = req.query.student;
        }
        if (req.query.course) {
            query.course = req.query.course;
        }
        const results = await Result_1.default.find(query)
            .populate("student", "firstName lastName email studentId")
            .populate("course", "title code");
        res.json({ success: true, data: results });
    }
    catch (error) {
        console.error("Error fetching results:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});
router.post("/", auth_1.protect, (0, auth_1.authorize)("admin"), [
    (0, express_validator_1.body)("student").isString().withMessage("student is required"),
    (0, express_validator_1.body)("course").isString().withMessage("course is required"),
    (0, express_validator_1.body)("caScore").optional().isFloat({ min: 0, max: 100 }),
    (0, express_validator_1.body)("finalExamScore").optional().isFloat({ min: 0, max: 100 }),
    (0, express_validator_1.body)("finalGrade").optional().isString(),
    (0, express_validator_1.body)("finalPercentage").optional().isFloat({ min: 0, max: 100 }),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(["passed", "failed", "pending", "incomplete"]),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: errors.array(),
            });
            return;
        }
        const { student, course, caScore, finalExamScore, finalGrade, finalPercentage, status, } = req.body;
        const updated = await Result_1.default.findOneAndUpdate({ student, course }, {
            $set: {
                caScore,
                finalExamScore,
                finalGrade,
                finalPercentage,
                status,
            },
        }, { new: true, upsert: true, setDefaultsOnInsert: true })
            .populate("student", "firstName lastName email studentId")
            .populate("course", "title code");
        res.status(201).json({ success: true, data: updated });
    }
    catch (error) {
        console.error("Error creating/updating result:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});
router.delete("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const result = await Result_1.default.findById(req.params.id);
        if (!result) {
            res.status(404).json({ success: false, error: "Result not found" });
            return;
        }
        await result.deleteOne();
        res.json({ success: true, message: "Result deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=results.js.map