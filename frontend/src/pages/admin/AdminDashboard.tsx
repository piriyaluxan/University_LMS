import { useEffect, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Users,
  UserCheck,
  Award,
  FileText,
  ClipboardList,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  completedCourses: number;
}

interface RecentEnrollment {
  _id: string;
  student?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    studentId?: string;
  } | null;
  course?: {
    _id: string;
    title?: string;
    code?: string;
  } | null;
  status: string;
  createdAt: string;
}

interface CoursePerformance {
  _id: string;
  courseTitle: string;
  courseCode: string;
  totalStudents: number;
  averageScore: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
}

interface DashboardMetrics {
  overview: {
    totalCourses: number;
    totalStudents: number;
    totalInstructors: number;
    totalEnrollments: number;
    totalResults: number;
  };
  enrollments: {
    active: number;
    completed: number;
    completionRate: number;
  };
  performance: {
    averageScore: number;
    topCourse: any;
  };
  recentActivity: Array<{
    id: string;
    studentName: string;
    courseName: string;
    status: string;
    date: string;
  }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<
    RecentEnrollment[]
  >([]);
  const [coursePerformance, setCoursePerformance] = useState<
    CoursePerformance[]
  >([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [counts, setCounts] = useState<{
    totalMaterials: number;
    totalAssignments: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all dashboard data in parallel
      const [statsRes, enrollmentsRes, performanceRes, metricsRes, countsRes] =
        await Promise.all([
          apiFetch<{ success: boolean; data: DashboardStats }>(
            "/api/dashboard/stats"
          ),
          apiFetch<{ success: boolean; data: RecentEnrollment[] }>(
            "/api/dashboard/recent-enrollments"
          ),
          apiFetch<{ success: boolean; data: CoursePerformance[] }>(
            "/api/dashboard/course-performance"
          ),
          apiFetch<{ success: boolean; data: DashboardMetrics }>(
            "/api/dashboard/metrics"
          ),
          apiFetch<{
            success: boolean;
            data: { totalMaterials: number; totalAssignments: number };
          }>("/api/dashboard/counts"),
        ]);

      setStats(statsRes.data);
      setRecentEnrollments(enrollmentsRes.data);
      setCoursePerformance(performanceRes.data);
      setMetrics(metricsRes.data);
      setCounts(countsRes.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load dashboard data",
        description: error.message || "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-success";
      case "completed":
        return "text-primary";
      case "pending":
        return "text-warning";
      default:
        return "text-muted-foreground";
    }
  };

  const dashboardStats = [
    {
      title: "Total Courses",
      value: stats?.totalCourses?.toString() || "0",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Students",
      value: stats?.totalStudents?.toString() || "0",
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Enrollments",
      value: stats?.totalEnrollments?.toString() || "0",
      icon: UserCheck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Completed Courses",
      value: stats?.completedCourses?.toString() || "0",
      icon: Award,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const additionalStats = [
    {
      title: "Total Materials",
      value: counts?.totalMaterials?.toString() || "0",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Assignments",
      value: counts?.totalAssignments?.toString() || "0",
      icon: ClipboardList,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Pass Rate",
      value: `${Math.round(metrics?.performance?.averageScore || 0)}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Completion Rate",
      value: `${Math.round(metrics?.enrollments?.completionRate || 0)}%`,
      icon: Award,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-surface">
        <AdminSidebar />
        <main className="flex-1 md:ml-0">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-0">
        {/* Header */}
        <header className="bg-card border-b border-border p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="ml-12 md:ml-0">
              <h1 className="text-2xl font-bold text-sidebar">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back! Here's an overview of your university.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card
                  key={index}
                  className="shadow-card hover:shadow-elevated transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-sidebar mt-2">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                      >
                        <IconComponent className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {additionalStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card
                  key={index}
                  className="shadow-card hover:shadow-elevated transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-sidebar mt-2">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                      >
                        <IconComponent className={`w-5 h-5 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sidebar">
                  Recent Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentEnrollments.length > 0 ? (
                    recentEnrollments.map((enrollment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-surface rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sidebar">
                            {`${enrollment.student?.firstName || "Unknown"} ${
                              enrollment.student?.lastName || "User"
                            }`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {`${
                              enrollment.course?.title || "Unknown Course"
                            } (${enrollment.course?.code || "N/A"})`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs ${getStatusColor(
                              enrollment.status
                            )} capitalize`}
                          >
                            {enrollment.status || "unknown"}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(enrollment.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        No recent enrollments
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sidebar">
                  Course Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coursePerformance.length > 0 ? (
                    coursePerformance.map((course, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sidebar">
                            {course.courseTitle} ({course.courseCode})
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {course.passRate}% pass rate
                          </span>
                        </div>
                        <div className="w-full bg-surface rounded-full h-2">
                          <div
                            className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.passRate}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{course.passedCount} passed</span>
                          <span>{course.totalStudents} total</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        No course performance data
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sidebar">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors text-left">
                  <BookOpen className="w-6 h-6 text-primary mb-2" />
                  <p className="font-medium text-sidebar">Add Course</p>
                  <p className="text-sm text-muted-foreground">
                    Create new course
                  </p>
                </button>
                <button className="p-4 bg-secondary/10 rounded-lg hover:bg-secondary/20 transition-colors text-left">
                  <Users className="w-6 h-6 text-secondary mb-2" />
                  <p className="font-medium text-sidebar">Manage Students</p>
                  <p className="text-sm text-muted-foreground">
                    View all students
                  </p>
                </button>
                <button className="p-4 bg-success/10 rounded-lg hover:bg-success/20 transition-colors text-left">
                  <UserCheck className="w-6 h-6 text-success mb-2" />
                  <p className="font-medium text-sidebar">Enrollments</p>
                  <p className="text-sm text-muted-foreground">
                    Manage enrollments
                  </p>
                </button>
                <button className="p-4 bg-warning/10 rounded-lg hover:bg-warning/20 transition-colors text-left">
                  <Award className="w-6 h-6 text-warning mb-2" />
                  <p className="font-medium text-sidebar">Results</p>
                  <p className="text-sm text-muted-foreground">View results</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
