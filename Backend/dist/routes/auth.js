"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || "fallback-secret-key";
    return jsonwebtoken_1.default.sign({ id }, secret, {
        expiresIn: "7d",
    });
};
router.post("/login", [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
    (0, express_validator_1.body)("role")
        .isIn(["admin", "student", "instructor"])
        .withMessage("Invalid role"),
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
        const { email, password, role } = req.body;
        const user = await User_1.User.findOne({ email, role }).select("+password");
        if (!user) {
            console.log(`Login failed: User not found with email ${email} and role ${role}`);
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }
        console.log(`User found: ${user.email}, role: ${user.role}, hasPassword: ${!!user.password}`);
        if (role === "student" && !user.password) {
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
        const isMatch = await user.comparePassword(password);
        console.log(`Password check result: ${isMatch}`);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.post("/set-password", [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("newPassword")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
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
        const { email, newPassword } = req.body;
        const user = await User_1.User.findOne({ email, role: "student" });
        if (!user) {
            res.status(404).json({
                success: false,
                error: "Student not found",
            });
            return;
        }
        if (user.password) {
            res.status(400).json({
                success: false,
                error: "Password already set",
            });
            return;
        }
        user.password = newPassword;
        await user.save();
        res.json({
            success: true,
            message: "Password set successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/me", auth_1.protect, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user._id);
        res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                profilePicture: user.profilePicture,
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
router.get("/debug/users", async (req, res) => {
    try {
        const users = await User_1.User.find({}).select("-password");
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map