"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const User_1 = require("./models/User");
const Course_1 = require("./models/Course");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const courses_1 = __importDefault(require("./routes/courses"));
const enrollments_1 = __importDefault(require("./routes/enrollments"));
const materials_1 = __importDefault(require("./routes/materials"));
const assignments_1 = __importDefault(require("./routes/assignments"));
const results_1 = __importDefault(require("./routes/results"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const registrations_1 = __importDefault(require("./routes/registrations"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), "config.env") });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
(0, database_1.connectDB)();
const ensureDefaultUsers = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@university.edu";
        const adminPassword = process.env.ADMIN_PASSWORD || "password123";
        let admin = await User_1.User.findOne({ email: adminEmail });
        if (!admin) {
            admin = await User_1.User.create({
                email: adminEmail,
                password: adminPassword,
                firstName: "Admin",
                lastName: "User",
                role: "admin",
                isActive: true,
                isEmailVerified: true,
            });
            console.log(`👑 Admin created: ${admin.email}`);
        }
        else {
            const isMatch = await admin.comparePassword(adminPassword);
            if (!isMatch) {
                admin.password = adminPassword;
                await admin.save();
                console.log(`🔑 Admin password updated: ${admin.email}`);
            }
        }
        const instructorEmail = "instructor@university.edu";
        const instructorPassword = "password123";
        let instructor = await User_1.User.findOne({ email: instructorEmail });
        if (!instructor) {
            instructor = await User_1.User.create({
                email: instructorEmail,
                password: instructorPassword,
                firstName: "Dr. Smith",
                lastName: "Instructor",
                role: "instructor",
                isActive: true,
                isEmailVerified: true,
            });
            console.log(`👨‍🏫 Instructor created: ${instructor.email}`);
        }
        else {
            const isMatch = await instructor.comparePassword(instructorPassword);
            if (!isMatch) {
                instructor.password = instructorPassword;
                await instructor.save();
                console.log(`🔑 Instructor password updated: ${instructor.email}`);
            }
        }
        const studentEmail = "student@university.edu";
        const studentPassword = "password123";
        let student = await User_1.User.findOne({ email: studentEmail });
        if (!student) {
            student = await User_1.User.create({
                email: studentEmail,
                password: studentPassword,
                firstName: "John",
                lastName: "Student",
                role: "student",
                studentId: "STU001",
                isActive: true,
                isEmailVerified: true,
            });
            console.log(`👨‍🎓 Student created: ${student.email}`);
        }
        else {
            const isMatch = await student.comparePassword(studentPassword);
            if (!isMatch) {
                student.password = studentPassword;
                await student.save();
                console.log(`🔑 Student password updated: ${student.email}`);
            }
        }
        return { admin, instructor, student };
    }
    catch (err) {
        console.error("Failed to ensure default users:", err);
        throw err;
    }
};
const ensureSampleCourses = async (instructor) => {
    try {
        const courseCount = await Course_1.Course.countDocuments();
        if (courseCount > 0)
            return;
        const sampleCourses = [
            {
                title: "Introduction to Computer Science",
                code: "CS101",
                description: "Fundamental concepts of programming and computer science",
                instructor: instructor._id,
                capacity: 50,
                enrolled: 0,
                duration: "16 weeks",
                credits: 3,
                level: "beginner",
                category: "Computer Science",
                tags: ["programming", "basics"],
                status: "active",
            },
            {
                title: "Advanced Mathematics",
                code: "MATH201",
                description: "Advanced mathematical concepts and problem solving",
                instructor: instructor._id,
                capacity: 30,
                enrolled: 0,
                duration: "14 weeks",
                credits: 4,
                level: "intermediate",
                category: "Mathematics",
                tags: ["calculus", "algebra"],
                status: "active",
            },
            {
                title: "Web Development Fundamentals",
                code: "WEB101",
                description: "Learn HTML, CSS, and JavaScript for web development",
                instructor: instructor._id,
                capacity: 40,
                enrolled: 0,
                duration: "12 weeks",
                credits: 3,
                level: "beginner",
                category: "Computer Science",
                tags: ["web", "frontend"],
                status: "active",
            },
        ];
        await Course_1.Course.insertMany(sampleCourses);
        console.log(`📚 Created ${sampleCourses.length} sample courses`);
    }
    catch (err) {
        console.error("Failed to create sample courses:", err);
    }
};
const ensureSampleResults = async (admin, instructor, student) => {
    try {
        const Result = require("./models/Result").default;
        const Course = require("./models/Course").Course;
        const course = await Course.findOne();
        if (!course)
            return;
        const existingResult = await Result.findOne({
            student: student._id,
            course: course._id,
        });
        if (!existingResult) {
            await Result.create({
                student: student._id,
                course: course._id,
                caScore: 75,
                finalExamScore: 80,
                finalGrade: "B+",
                finalPercentage: 78,
                status: "passed",
            });
            console.log(`📊 Sample result created for ${student.firstName} ${student.lastName}`);
        }
    }
    catch (err) {
        console.error("Failed to ensure sample results:", err);
    }
};
const initializeSystem = async () => {
    try {
        const users = await ensureDefaultUsers();
        await ensureSampleCourses(users.instructor);
        await ensureSampleResults(users.admin, users.instructor, users.student);
        console.log("✅ System initialization completed");
    }
    catch (error) {
        console.error("❌ System initialization failed:", error);
    }
};
initializeSystem();
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowed = process.env.CORS_ORIGIN?.split(",") || [
            "http://localhost:3000",
            "http://localhost:5173",
        ];
        if (!origin)
            return callback(null, true);
        if (origin.startsWith("http://localhost") ||
            origin.startsWith("https://localhost")) {
            return callback(null, true);
        }
        const isLan = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(origin);
        if (process.env.NODE_ENV !== "production" && isLan) {
            return callback(null, true);
        }
        if (allowed.includes(origin))
            return callback(null, true);
        return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "EAD LMS API is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/courses", courses_1.default);
app.use("/api/enrollments", enrollments_1.default);
app.use("/api/materials", materials_1.default);
app.use("/api/assignments", assignments_1.default);
app.use("/api/results", results_1.default);
app.use("/api/dashboard", dashboard_1.default);
app.use("/api/registrations", registrations_1.default);
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
});
process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    process.exit(0);
});
process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map