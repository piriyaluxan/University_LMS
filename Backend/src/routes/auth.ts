import express from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { User } from "../models/User";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// Generate JWT Token
const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || "fallback-secret-key";
  return jwt.sign({ id }, secret, {
    expiresIn: "7d",
  });
};

// @desc    Register user - REMOVED: Only admins can create student accounts
// @route   POST /api/auth/register
// @access  REMOVED

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    body("role")
      .isIn(["admin", "student", "instructor"])
      .withMessage("Invalid role"),
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

      const { email, password, role } = req.body;

      // Check if user exists and role matches
      const user = await User.findOne({ email, role }).select("+password");
      if (!user) {
        console.log(
          `Login failed: User not found with email ${email} and role ${role}`
        );
        res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
        return;
      }

      console.log(
        `User found: ${user.email}, role: ${
          user.role
        }, hasPassword: ${!!user.password}`
      );

      // For students and instructors, check if they have a password set
      if ((role === "student" || role === "instructor") && !user.password) {
        res.status(401).json({
          success: false,
          error: "Password not set",
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            studentId: user.studentId,
          },
        });
        return;
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      console.log(`Password check result: ${isMatch}`);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
        return;
      }

      // Generate token
      const token = generateToken(user._id.toString());

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// @desc    Set password for student (first time access)
// @route   POST /api/auth/set-password
// @access  Public
router.post(
  "/set-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
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

      const { email, newPassword } = req.body;

      // Find the user (student or instructor)
      const user = await User.findOne({ email, role: { $in: ["student", "instructor"] } });
      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      // Check if password is already set
      if (user.password) {
        res.status(400).json({
          success: false,
          error: "Password already set",
        });
        return;
      }

      // Update the password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password set successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user!._id);

    res.json({
      success: true,
      user: {
        id: user!._id,
        firstName: user!.firstName,
        lastName: user!.lastName,
        email: user!.email,
        role: user!.role,
        studentId: user!.studentId,
        profilePicture: user!.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Debug: List all users (for development only)
// @route   GET /api/auth/debug/users
// @access  Public (for development)
router.get("/debug/users", async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json({
      success: true,
      count: users.length,
      users: users.map((user) => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.password,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

export default router;
