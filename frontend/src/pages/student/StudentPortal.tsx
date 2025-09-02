import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import {
  BookOpen,
  Users,
  Calendar,
  Award,
  LogOut,
  GraduationCap,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ClipboardCheck,
  Download,
  Eye,
  Upload,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface Course {
  _id: string;
  title: string;
  code: string;
  description: string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  capacity: number;
  enrolled: number;
  duration: string;
  status: "active" | "inactive" | "archived";
}

interface EnrolledCourse {
  _id: string;
  course: {
    _id: string;
    title: string;
    code: string;
    description: string;
    instructor: string;
    duration: string;
  };
  status: "active" | "completed" | "dropped" | "suspended";
  progress: number;
  enrollmentDate: string;
  grade?: string;
  score?: number;
}

interface Result {
  _id: string;
  course: {
    _id: string;
    title: string;
    code: string;
  };
  finalGrade?: string;
  finalPercentage?: number;
  status: "passed" | "failed" | "pending" | "incomplete";
  caScore?: number;
  finalExamScore?: number;
}

interface Material {
  _id: string;
  title: string;
  description: string;
  fileType: "pdf" | "video" | "image" | "document" | "docx" | "other";
  course: {
    _id: string;
    title: string;
    code: string;
  };
  fileName: string;
  originalName: string;
  size: number;
  createdAt: string;
  uploadedBy: {
    firstName: string;
    lastName: string;
  };
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: {
    _id: string;
    title: string;
    code: string;
  };
  dueDate: string;
  maxPoints: number;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  studentId?: string;
}

const StudentPortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("enrolled");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const initializePortal = async () => {
      try {
        setIsLoading(true);

        // Get user info
        const userResponse = await apiFetch<{ user: User }>("/api/auth/me");
        setUser(userResponse.user);

        // Fetch all data in parallel
        const [
          enrollmentsRes,
          coursesRes,
          resultsRes,
          materialsRes,
          assignmentsRes,
        ] = await Promise.all([
          apiFetch<{ data: EnrolledCourse[] }>("/api/enrollments/student/me"),
          apiFetch<{ data: Course[] }>("/api/courses/available"),
          apiFetch<{ data: Result[] }>("/api/results"),
          apiFetch<{ data: Material[] }>("/api/materials/enrolled"),
          apiFetch<{ data: Assignment[] }>("/api/assignments/enrolled"),
        ]);

        setEnrolledCourses(enrollmentsRes.data);
        setAvailableCourses(coursesRes.data);
        setResults(resultsRes.data);
        setMaterials(materialsRes.data);
        setAssignments(assignmentsRes.data);
      } catch (error) {
        console.error("Failed to load portal data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load portal data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializePortal();
  }, []);

  const handleEnroll = async (courseId: string) => {
    try {
      const course = availableCourses.find((c) => c._id === courseId);
      if (!course) return;

      if (course.enrolled >= course.capacity) {
        toast({
          variant: "destructive",
          title: "Course Full",
          description: "This course has reached maximum capacity",
        });
        return;
      }

      // Check if already enrolled
      const alreadyEnrolled = enrolledCourses.find(
        (ec) => ec.course._id === courseId
      );
      if (alreadyEnrolled) {
        toast({
          variant: "destructive",
          title: "Already Enrolled",
          description: "You are already enrolled in this course",
        });
        return;
      }

      // Enroll in course
      await apiFetch("/api/enrollments", {
        method: "POST",
        body: JSON.stringify({
          courseId,
          status: "enrolled",
        }),
      });

      // Refresh enrollments
      const enrollmentsRes = await apiFetch<{ data: EnrolledCourse[] }>(
        "/api/enrollments/student/me"
      );
      setEnrolledCourses(enrollmentsRes.data);

      toast({
        title: "Enrollment Successful",
        description: `You have been enrolled in ${course.title}`,
        className: "bg-success text-success-foreground",
      });

      setActiveTab("enrolled");
    } catch (error) {
      console.error("Enrollment failed:", error);
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: "Failed to enroll in course. Please try again.",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
      className: "bg-success text-success-foreground",
    });
    navigate("/login");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="default"
            className="bg-success text-success-foreground"
          >
            Available
          </Badge>
        );
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "archived":
        return <Badge variant="secondary">Archived</Badge>;
      case "full":
        return <Badge variant="destructive">Full</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      case "enrolled":
        return (
          <Badge
            variant="default"
            className="bg-primary text-primary-foreground"
          >
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="default"
            className="bg-success text-success-foreground"
          >
            Completed
          </Badge>
        );
      case "passed":
        return (
          <Badge
            variant="default"
            className="bg-success text-success-foreground"
          >
            Passed
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-warning text-warning-foreground"
          >
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-success";
    if (percentage >= 80) return "text-primary";
    if (percentage >= 70) return "text-secondary";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const getTypeIcon = (type: Material["fileType"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5 text-destructive" />;
      case "video":
        return <Eye className="w-5 h-5 text-primary" />;
      case "image":
        return <Eye className="w-5 h-5 text-success" />;
      case "document":
      case "docx":
        return <FileText className="w-5 h-5 text-secondary" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 3600 * 24)
    );
    return diffDays <= 3 && diffDays >= 0;
  };

  const isOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter((assignment) => {
      const assignmentDate = new Date(assignment.dueDate);
      return assignmentDate.toDateString() === date.toDateString();
    });
  };

  const getCourseAssignments = (courseId: string) => {
    return assignments.filter(
      (assignment) => assignment.course._id === courseId
    );
  };

  const getCourseMaterials = (courseId: string) => {
    return materials.filter((material) => material.course._id === courseId);
  };

  const toggleCourseExpansion = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const changeMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading student portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar">
                  Student Portal
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-sidebar">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.studentId}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="enrolled" className="gap-2">
              <Users className="w-4 h-4" />
              My Courses
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Available Courses
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <Award className="w-4 h-4" />
              My Results
            </TabsTrigger>
          </TabsList>

          {/* My Courses Tab */}
          <TabsContent value="enrolled" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-sidebar mb-2">
                My Courses
              </h2>
              <p className="text-muted-foreground mb-6">
                Track your course progress and access materials
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {enrolledCourses.map((enrollment) => {
                const courseAssignments = getCourseAssignments(
                  enrollment.course._id
                );
                const courseMaterials = getCourseMaterials(
                  enrollment.course._id
                );
                const isExpanded = expandedCourses.has(enrollment.course._id);

                return (
                  <Card
                    key={enrollment._id}
                    className="shadow-card hover:shadow-elevated transition-shadow"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl text-sidebar">
                            {enrollment.course.title}
                          </CardTitle>
                          <p className="text-sm font-medium text-primary">
                            {enrollment.course.code}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(enrollment.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleCourseExpansion(enrollment.course._id)
                            }
                            className="p-1"
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sidebar font-medium">
                          {enrollment.course.instructor}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Enrolled:{" "}
                          {new Date(
                            enrollment.enrollmentDate
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="font-bold text-sidebar text-lg">
                            {enrollment.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-surface rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${
                              enrollment.progress === 100
                                ? "bg-success"
                                : "bg-gradient-primary"
                            }`}
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                      </div>

                      {enrollment.grade && (
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sidebar font-medium">
                            Grade: {enrollment.grade}
                            {enrollment.score && ` (${enrollment.score}%)`}
                          </span>
                        </div>
                      )}

                      {/* Course Summary Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center p-3 bg-surface rounded-lg">
                          <div className="text-lg font-bold text-sidebar">
                            {courseAssignments.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Assignments
                          </div>
                        </div>
                        <div className="text-center p-3 bg-surface rounded-lg">
                          <div className="text-lg font-bold text-sidebar">
                            {courseMaterials.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Materials
                          </div>
                        </div>
                      </div>

                      {/* Expandable Content */}
                      {isExpanded && (
                        <div className="space-y-4 pt-4 border-t border-border">
                          {/* Assignments Section */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sidebar flex items-center gap-2">
                              <ClipboardCheck className="w-4 h-4" />
                              Assignments ({courseAssignments.length})
                            </h4>
                            {courseAssignments.length > 0 ? (
                              <div className="space-y-2">
                                {courseAssignments
                                  .slice(0, 3)
                                  .map((assignment) => (
                                    <div
                                      key={assignment._id}
                                      className="p-3 bg-surface rounded-lg border border-border/50"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <h5 className="font-medium text-sidebar text-sm">
                                            {assignment.title}
                                          </h5>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Due:{" "}
                                            {new Date(
                                              assignment.dueDate
                                            ).toLocaleDateString()}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {isDueSoon(assignment.dueDate) && (
                                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                                          )}
                                          {isOverdue(assignment.dueDate) && (
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                {courseAssignments.length > 3 && (
                                  <div className="text-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        navigate(
                                          `/student/assignments?courseId=${enrollment.course._id}`
                                        )
                                      }
                                    >
                                      View All Assignments
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No assignments available for this course.
                              </p>
                            )}
                          </div>

                          {/* Materials Section */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sidebar flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Course Materials ({courseMaterials.length})
                            </h4>
                            {courseMaterials.length > 0 ? (
                              <div className="space-y-2">
                                {courseMaterials.slice(0, 3).map((material) => (
                                  <div
                                    key={material._id}
                                    className="p-3 bg-surface rounded-lg border border-border/50"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <h5 className="font-medium text-sidebar text-sm">
                                          {material.title}
                                        </h5>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {material.fileType.toUpperCase()} •{" "}
                                          {material.originalName}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          window.open(
                                            `/uploads/${material.fileName}`,
                                            "_blank"
                                          )
                                        }
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                {courseMaterials.length > 3 && (
                                  <div className="text-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        navigate(
                                          `/student/course-materials?courseId=${enrollment.course._id}`
                                        )
                                      }
                                    >
                                      View All Materials
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No materials available for this course.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() =>
                            toggleCourseExpansion(enrollment.course._id)
                          }
                        >
                          {isExpanded ? "Hide Details" : "View Details"}
                        </Button>
                        <Button
                          className="flex-1 bg-gradient-primary hover:bg-primary-dark"
                          onClick={() =>
                            navigate(
                              `/student/assignments?courseId=${enrollment.course._id}`
                            )
                          }
                        >
                          View Assignments
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {enrolledCourses.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-sidebar mb-2">
                  No courses enrolled
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start your learning journey by enrolling in available courses
                </p>
                <Button
                  onClick={() => setActiveTab("available")}
                  className="bg-gradient-primary hover:bg-primary-dark"
                >
                  Browse Courses
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Available Courses Tab */}
          <TabsContent value="available" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-sidebar mb-2">
                Available Courses
              </h2>
              <p className="text-muted-foreground mb-6">
                Browse and enroll in courses offered this semester
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {availableCourses.map((course) => (
                <Card
                  key={course._id}
                  className="shadow-card hover:shadow-elevated transition-shadow"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg text-sidebar">
                          {course.title}
                        </CardTitle>
                        <p className="text-sm font-medium text-secondary">
                          {course.code}
                        </p>
                      </div>
                      {getStatusBadge(course.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sidebar font-medium">
                          {course.instructor.firstName}{" "}
                          {course.instructor.lastName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {course.duration}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Enrolled: {course.enrolled}/{course.capacity}
                        </span>
                        <span className="text-muted-foreground">
                          {Math.round(
                            (course.enrolled / course.capacity) * 100
                          )}
                          % full
                        </span>
                      </div>

                      <div className="w-full bg-surface rounded-full h-2">
                        <div
                          className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              (course.enrolled / course.capacity) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => handleEnroll(course._id)}
                      disabled={
                        course.enrolled >= course.capacity ||
                        course.status !== "active"
                      }
                      className="w-full bg-gradient-primary hover:bg-primary-dark disabled:opacity-50"
                    >
                      {course.enrolled >= course.capacity
                        ? "Course Full"
                        : "Enroll Now"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {availableCourses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-sidebar mb-2">
                  No available courses
                </h3>
                <p className="text-muted-foreground">
                  All courses are either full or you're already enrolled
                </p>
              </div>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-sidebar mb-2">
                Assignment Calendar
              </h2>
              <p className="text-muted-foreground mb-6">
                View upcoming assignment deadlines and manage your schedule
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Monthly Calendar */}
              <div className="xl:col-span-3">
                <Card className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg text-sidebar">
                      {currentMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changeMonth("prev")}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changeMonth("next")}
                      >
                        Next
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div
                            key={day}
                            className="p-2 text-center text-sm font-medium text-muted-foreground"
                          >
                            {day}
                          </div>
                        )
                      )}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {getCalendarDays().map((date, i) => {
                        const isCurrentMonth = date !== null;
                        const isToday =
                          date &&
                          date.toDateString() === new Date().toDateString();
                        const assignmentsOnDate = date
                          ? getAssignmentsForDate(date)
                          : [];

                        return (
                          <div
                            key={i}
                            className={`relative min-h-16 p-1 border border-border/50 ${
                              isCurrentMonth
                                ? isToday
                                  ? "bg-primary text-primary-foreground font-bold"
                                  : "bg-card hover:bg-surface cursor-pointer"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isCurrentMonth && date && (
                              <>
                                <div className="text-sm">{date.getDate()}</div>
                                {assignmentsOnDate.length > 0 && (
                                  <div className="absolute bottom-1 left-1 right-1">
                                    {assignmentsOnDate
                                      .slice(0, 2)
                                      .map((assignment) => {
                                        const overdue = isOverdue(
                                          assignment.dueDate
                                        );
                                        return (
                                          <div
                                            key={assignment._id}
                                            className={`text-xs p-1 rounded mb-1 truncate ${
                                              overdue
                                                ? "bg-destructive text-destructive-foreground"
                                                : "bg-primary text-primary-foreground"
                                            }`}
                                            title={`${assignment.course.code}: ${assignment.title}`}
                                          >
                                            {assignment.course.code}:{" "}
                                            {assignment.title.substring(0, 8)}
                                            {assignment.title.length > 8
                                              ? "..."
                                              : ""}
                                          </div>
                                        );
                                      })}
                                    {assignmentsOnDate.length > 2 && (
                                      <div className="text-xs text-muted-foreground">
                                        +{assignmentsOnDate.length - 2} more
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 mt-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded"></div>
                        <span className="text-muted-foreground">
                          Assignment Due
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-destructive rounded"></div>
                        <span className="text-muted-foreground">Overdue</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg text-sidebar">
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total Assignments
                        </span>
                        <span className="font-medium text-sidebar">
                          {assignments.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Due This Week
                        </span>
                        <span className="font-medium text-primary">
                          {
                            assignments.filter((a) => {
                              const due = new Date(a.dueDate);
                              const now = new Date();
                              const oneWeekFromNow = new Date(
                                now.getTime() + 7 * 24 * 60 * 60 * 1000
                              );
                              return due >= now && due <= oneWeekFromNow;
                            }).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Overdue
                        </span>
                        <span className="font-medium text-destructive">
                          {
                            assignments.filter((a) => isOverdue(a.dueDate))
                              .length
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg text-sidebar">
                      This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {assignments
                        .filter((assignment) => {
                          const assignmentDate = new Date(assignment.dueDate);
                          const today = new Date();
                          const oneWeekFromNow = new Date(
                            today.getTime() + 7 * 24 * 60 * 60 * 1000
                          );
                          return (
                            assignmentDate >= today &&
                            assignmentDate <= oneWeekFromNow
                          );
                        })
                        .sort(
                          (a, b) =>
                            new Date(a.dueDate).getTime() -
                            new Date(b.dueDate).getTime()
                        )
                        .map((assignment) => (
                          <div
                            key={assignment._id}
                            className="flex items-center justify-between text-sm p-2 rounded bg-surface"
                          >
                            <div className="flex flex-col">
                              <span className="text-sidebar font-medium truncate">
                                {assignment.title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {assignment.course.code}
                              </span>
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {new Date(assignment.dueDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        ))}

                      {assignments.filter((assignment) => {
                        const assignmentDate = new Date(assignment.dueDate);
                        const today = new Date();
                        const oneWeekFromNow = new Date(
                          today.getTime() + 7 * 24 * 60 * 60 * 1000
                        );
                        return (
                          assignmentDate >= today &&
                          assignmentDate <= oneWeekFromNow
                        );
                      }).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No assignments due this week
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-sidebar mb-2">
                My Results
              </h2>
              <p className="text-muted-foreground mb-6">
                View your academic performance and grades
              </p>
            </div>

            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result._id} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                          {result.status === "passed" ? (
                            <CheckCircle className="w-6 h-6 text-primary-foreground" />
                          ) : result.status === "failed" ? (
                            <AlertCircle className="w-6 h-6 text-primary-foreground" />
                          ) : (
                            <Clock className="w-6 h-6 text-primary-foreground" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-sidebar">
                              {result.course.title}
                            </h3>
                            {getStatusBadge(result.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{result.course.code}</span>
                            {result.caScore && (
                              <span>CA: {result.caScore}%</span>
                            )}
                            {result.finalExamScore && (
                              <span>Final: {result.finalExamScore}%</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {result.finalGrade ? (
                          <>
                            <div className="text-3xl font-bold text-sidebar mb-1">
                              {result.finalGrade}
                            </div>
                            {result.finalPercentage && (
                              <div
                                className={`text-lg font-semibold ${getGradeColor(
                                  result.finalPercentage
                                )}`}
                              >
                                {result.finalPercentage}%
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-lg text-muted-foreground">
                            Pending
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {results.length === 0 && (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-sidebar mb-2">
                  No results available
                </h3>
                <p className="text-muted-foreground">
                  Your course results will appear here once grades are published
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentPortal;
