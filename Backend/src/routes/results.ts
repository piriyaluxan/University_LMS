import express from "express";
import { protect, authorize } from "../middleware/auth";
import Result from "../models/Result";
import { body, validationResult } from "express-validator";

const router = express.Router();

// @desc    Get results
// @route   GET /api/results
// @access  Private (students see their own, admin sees all)
router.get("/", protect, async (req, res) => {
  try {
    const query: any = {};
    if (req.user!.role !== "admin") {
      query.student = req.user!._id;
    } else if (req.query.student) {
      query.student = req.query.student;
    }
    if (req.query.course) {
      query.course = req.query.course;
    }

    const results = await Result.find(query)
      .populate("student", "firstName lastName email studentId")
      .populate("course", "title code");

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// @desc    Create or update a student's result for a course
// @route   POST /api/results
// @access  Private/Admin
router.post(
  "/",
  protect,
  authorize("admin"),
  [
    body("student").isString().withMessage("student is required"),
    body("course").isString().withMessage("course is required"),
    body("caScore").optional().isFloat({ min: 0, max: 100 }),
    body("finalExamScore").optional().isFloat({ min: 0, max: 100 }),
    body("finalGrade").optional().isString(),
    body("finalPercentage").optional().isFloat({ min: 0, max: 100 }),
    body("status")
      .optional()
      .isIn(["passed", "failed", "pending", "incomplete"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
        return;
      }

      const {
        student,
        course,
        caScore,
        finalExamScore,
        finalGrade,
        finalPercentage,
        status,
      } = req.body;

      // Upsert by unique (student, course)
      const updated = await Result.findOneAndUpdate(
        { student, course },
        {
          $set: {
            caScore,
            finalExamScore,
            finalGrade,
            finalPercentage,
            status,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
        .populate("student", "firstName lastName email studentId")
        .populate("course", "title code");

      res.status(201).json({ success: true, data: updated });
    } catch (error) {
      console.error("Error creating/updating result:", error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// @desc    Delete a result
// @route   DELETE /api/results/:id
// @access  Private/Admin
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) {
      res.status(404).json({ success: false, error: "Result not found" });
      return;
    }
    await result.deleteOne();
    res.json({ success: true, message: "Result deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
