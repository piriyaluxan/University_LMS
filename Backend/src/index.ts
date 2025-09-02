import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { User } from "./models/User";
import { Course } from "./models/Course";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import courseRoutes from "./routes/courses";
import enrollmentRoutes from "./routes/enrollments";
import materialRoutes from "./routes/materials";
import assignmentRoutes from "./routes/assignments";
import resultRoutes from "./routes/results";
import dashboardRoutes from "./routes/dashboard";
import registrationRoutes from "./routes/registrations";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), "config.env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Ensure default users exist
const ensureDefaultUsers = async () => {
  try {
    // Create/Update Admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@university.edu";
    const adminPassword = process.env.ADMIN_PASSWORD || "password123";

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        email: adminEmail,
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isActive: true,
        isEmailVerified: true,
      });
      console.log(`👑 Admin created: ${admin.email}`);
    } else {
      // Update password if it's different
      const isMatch = await admin.comparePassword(adminPassword);
      if (!isMatch) {
        admin.password = adminPassword;
        await admin.save();
        console.log(`🔑 Admin password updated: ${admin.email}`);
      }
    }

    // Create/Update Instructor
    const instructorEmail = "instructor@university.edu";
    const instructorPassword = "password123";

    let instructor = await User.findOne({ email: instructorEmail });
    if (!instructor) {
      instructor = await User.create({
        email: instructorEmail,
        password: instructorPassword,
        firstName: "Dr. Smith",
        lastName: "Instructor",
        role: "instructor",
        isActive: true,
        isEmailVerified: true,
      });
      console.log(`👨‍🏫 Instructor created: ${instructor.email}`);
    } else {
      // Update password if it's different
      const isMatch = await instructor.comparePassword(instructorPassword);
      if (!isMatch) {
        instructor.password = instructorPassword;
        await instructor.save();
        console.log(`🔑 Instructor password updated: ${instructor.email}`);
      }
    }

    // Create/Update Student
    const studentEmail = "student@university.edu";
    const studentPassword = "password123";

    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      student = await User.create({
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
    } else {
      // Update password if it's different
      const isMatch = await student.comparePassword(studentPassword);
      if (!isMatch) {
        student.password = studentPassword;
        await student.save();
        console.log(`🔑 Student password updated: ${student.email}`);
      }
    }

    return { admin, instructor, student };
  } catch (err) {
    console.error("Failed to ensure default users:", err);
    throw err;
  }
};

// Ensure sample courses exist
const ensureSampleCourses = async (instructor: any) => {
  try {
    const courseCount = await Course.countDocuments();
    if (courseCount > 0) return; // Courses already exist

    // Create sample courses
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

    await Course.insertMany(sampleCourses);
    console.log(`📚 Created ${sampleCourses.length} sample courses`);
  } catch (err) {
    console.error("Failed to create sample courses:", err);
  }
};

// Ensure sample results exist
const ensureSampleResults = async (
  admin: any,
  instructor: any,
  student: any
) => {
  try {
    const Result = require("./models/Result").default;
    const Course = require("./models/Course").Course;

    // Get the first course
    const course = await Course.findOne();
    if (!course) return;

    // Check if results already exist
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
      console.log(
        `📊 Sample result created for ${student.firstName} ${student.lastName}`
      );
    }
  } catch (err) {
    console.error("Failed to ensure sample results:", err);
  }
};

// Initialize default users and courses
const initializeSystem = async () => {
  try {
    const users = await ensureDefaultUsers();
    await ensureSampleCourses(users.instructor);
    await ensureSampleResults(users.admin, users.instructor, users.student);
    console.log("✅ System initialization completed");
  } catch (error) {
    console.error("❌ System initialization failed:", error);
  }
};

initializeSystem();

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = process.env.CORS_ORIGIN?.split(",") || [
        "http://localhost:3000",
        "http://localhost:5173",
      ];
      if (!origin) return callback(null, true);
      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("https://localhost")
      ) {
        return callback(null, true);
      }
      // Allow common private LAN ranges in development
      const isLan =
        /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(origin);
      if (process.env.NODE_ENV !== "production" && isLan) {
        return callback(null, true);
      }
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static serving for uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "EAD LMS API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/registrations", registrationRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

export default app;
