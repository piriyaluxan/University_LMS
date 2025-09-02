import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  FileText,
  BarChart3,
  Plus,
  Calendar,
  Clock,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface Course {
  _id: string;
  title: string;
  code: string;
  description: string;
  enrolled: number;
  capacity: number;
  status: string;
  startDate?: string;
  endDate?: string;
  credits: number;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
}

const InstructorDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstructorData();
  }, []);

  const fetchInstructorData = async () => {
    try {
      setIsLoading(true);
      const [coursesData, studentsData] = await Promise.all([
        apiFetch("/api/courses/instructor"),
        apiFetch("/api/users/students"),
      ]);

      setCourses(coursesData.data || []);
      setStudents(studentsData.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch data",
      });
    } finally {
      setIsLoading(false);
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

  const getEnrollmentPercentage = (enrolled: number, capacity: number) => {
    return capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading instructor dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-sidebar mb-2">
              Instructor Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your courses and monitor student progress
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="bg-gradient-primary hover:bg-primary-dark text-primary-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Courses
                  </p>
                  <p className="text-2xl font-bold text-sidebar">
                    {courses.length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-sidebar">
                    {students.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Courses
                  </p>
                  <p className="text-2xl font-bold text-sidebar">
                    {courses.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Enrollments
                  </p>
                  <p className="text-2xl font-bold text-sidebar">
                    {courses.reduce((sum, c) => sum + c.enrolled, 0)}
                  </p>
                </div>
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="students">My Students</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-sidebar">
                My Courses
              </h2>
              <Button className="bg-gradient-primary hover:bg-primary-dark">
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card
                  key={course._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-sidebar">
                          {course.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground font-mono">
                          {course.code}
                        </p>
                      </div>
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Enrollment
                        </span>
                        <span className="font-medium">
                          {course.enrolled}/{course.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${getEnrollmentPercentage(
                              course.enrolled,
                              course.capacity
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.credits} credits</span>
                      </div>
                      {course.startDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(course.startDate).getFullYear()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="w-4 h-4 mr-2" />
                        Materials
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Users className="w-4 h-4 mr-2" />
                        Students
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {courses.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-sidebar mb-2">
                    No courses yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start by creating your first course to begin teaching
                  </p>
                  <Button className="bg-gradient-primary hover:bg-primary-dark">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Course
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-sidebar">
                My Students
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <Card
                  key={student._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold text-lg">
                          {student.firstName.charAt(0)}
                          {student.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sidebar">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {student.email}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {student.studentId}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="w-4 h-4 mr-2" />
                        Progress
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Users className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {students.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-sidebar mb-2">
                    No students enrolled yet
                  </h3>
                  <p className="text-muted-foreground">
                    Students will appear here once they enroll in your courses
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InstructorDashboard;
