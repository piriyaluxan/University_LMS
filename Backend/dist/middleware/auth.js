"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOwnership = exports.optionalAuth = exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        res.status(401).json({
            success: false,
            error: "Not authorized to access this route",
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "fallback-secret");
        const user = await User_1.User.findById(decoded.id).select("+password");
        if (!user) {
            res.status(401).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        if (!user.isActive) {
            res.status(401).json({
                success: false,
                error: "User account is deactivated",
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: "Not authorized to access this route",
        });
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "Not authorized to access this route",
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: `User role '${req.user.role}' is not authorized to access this route`,
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "fallback-secret");
            const user = await User_1.User.findById(decoded.id);
            if (user && user.isActive) {
                req.user = user;
            }
        }
        catch (error) {
            console.log("Invalid token in optional auth:", error);
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
const checkOwnership = (resourceUserIdField = "user") => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "Not authorized to access this route",
            });
            return;
        }
        if (req.user.role === "admin") {
            return next();
        }
        const resourceUserId = req.params[resourceUserIdField] ||
            req.body[resourceUserIdField];
        if (resourceUserId &&
            resourceUserId.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                error: "Not authorized to access this resource",
            });
            return;
        }
        next();
    };
};
exports.checkOwnership = checkOwnership;
//# sourceMappingURL=auth.js.map