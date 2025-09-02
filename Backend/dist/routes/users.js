"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/students", auth_1.protect, (0, auth_1.authorize)("instructor"), async (req, res) => {
    try {
        const students = await User_1.User.find({ role: "student", isActive: true })
            .select("-password")
            .sort({ firstName: 1, lastName: 1 });
        res.json({
            success: true,
            data: students,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.get("/", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const role = req.query.role;
        const search = req.query.search;
        const query = {};
        if (role) {
            query.role = role;
        }
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { studentId: { $regex: search, $options: "i" } },
            ];
        }
        const skip = (page - 1) * limit;
        const users = await User_1.User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await User_1.User.countDocuments(query);
        res.json({
            success: true,
            data: users,
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
router.get("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const user = await User_1.User.findById(req.params.id).select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        res.json({
            success: true,
            data: user,
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
        const user = await User_1.User.create(req.body);
        res.status(201).json({
            success: true,
            data: {
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
router.put("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const { password, ...updatable } = req.body;
        const user = await User_1.User.findByIdAndUpdate(req.params.id, updatable, {
            new: true,
            runValidators: true,
        }).select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        res.json({
            success: true,
            data: user,
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
        const user = await User_1.User.findById(req.params.id);
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        await user.deleteOne();
        res.json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
router.patch("/:id/status", auth_1.protect, (0, auth_1.authorize)("admin"), async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User_1.User.findByIdAndUpdate(req.params.id, { isActive: Boolean(isActive) }, { new: true }).select("-password");
        if (!user) {
            res.status(404).json({ success: false, error: "User not found" });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map