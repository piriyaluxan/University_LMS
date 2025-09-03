import { useState, useEffect } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Search, Calendar, BookOpen, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

interface Registration {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  registrationDate: string;
  status: "enrolled" | "completed" | "dropped" | "pending";
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  code: string;
  capacity: number;
  enrolled: number;
}

interface EnrollmentsResponse {
  success: boolean;
  data: Array<{
    _id: string;
    student: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    course: {
      _id: string;
      title: string;
      code: string;
      capacity: number;
      enrolled: number;
    };
    createdAt: string;
    status: "enrolled" | "completed" | "dropped" | "pending";
  }>;
}

interface UsersResponse {
  success: boolean;
  data: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

interface CoursesResponse {
  success: boolean;
  data: Array<{
    _id: string;
    title: string;
    code: string;
    capacity: number;
    enrolled: number;
  }>;
}

const RegistrationManagement = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<
    Array<{ id: string; firstName: string; lastName: string; email: string; isActive?: boolean }>
  >([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [isInstructorMode, setIsInstructorMode] = useState(false);
  const [instructorData, setInstructorData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    department: "",
  });
  const [selectedInstructorCourses, setSelectedInstructorCourses] = useState<string[]>([]);
  const [isCreatingInstructor, setIsCreatingInstructor] = useState(false);

  // Load students, courses, and current registrations
  const loadData = async () => {
    setIsPageLoading(true);
    try {
      // Load students
      const users = await apiFetch<UsersResponse>(
        `/api/users?role=student&limit=100`
      );
      setStudents(
        users.data.map((u) => ({
          id: u._id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
        }))
      );

      // Load courses
      const coursesRes = await apiFetch<CoursesResponse>(
        `/api/courses?limit=100`
      );
      setCourses(
        coursesRes.data.map((c) => ({
          id: c._id,
          title: c.title,
          code: c.code,
          capacity: c.capacity,
          enrolled: c.enrolled,
        }))
      );

      // Load instructors
      const instructorsRes = await apiFetch<UsersResponse>(
        `/api/users?role=instructor&limit=200`
      );
      setInstructors(
        instructorsRes.data.map((u) => ({
          id: u._id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
        }))
      );

      // Load current registrations
      const enrollmentsRes = await apiFetch<EnrollmentsResponse>(
        `/api/enrollments`
      );
      setRegistrations(
        enrollmentsRes.data.map((e) => {
          const s = (e as any).student || null;
          const c = (e as any).course || null;
          return {
            id: e._id,
            studentId: s?._id || "",
            studentName: `${s?.firstName || "Unknown"} ${
              s?.lastName || "User"
            }`.trim(),
            courseId: c?._id || "",
            courseName: c?.title || "Unknown Course",
            courseCode: c?.code || "N/A",
            registrationDate: e.createdAt,
            status: (e as any).status || "enrolled",
          } as Registration;
        })
      );
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: error.message || "An error occurred while fetching data",
      });
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRegistrations = registrations.filter(
    (reg) =>
      reg.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegisterStudent = async () => {
    if (!selectedStudent || !selectedCourse) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select both a student and a course",
      });
      return;
    }

    const student = students.find((s) => s.id === selectedStudent);
    const course = courses.find((c) => c.id === selectedCourse);

    if (!student || !course) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid student or course selection",
      });
      return;
    }

    // Check if already registered
    const existingRegistration = registrations.find(
      (reg) => reg.studentId === student.id && reg.courseId === course.id
    );
    if (existingRegistration) {
      toast({
        variant: "destructive",
        title: "Already Registered",
        description: `${student.name} is already registered for ${course.title}`,
      });
      return;
    }

    // Check course capacity
    const availableSpots = getAvailableSpots(course.id);
    if (availableSpots <= 0) {
      toast({
        variant: "destructive",
        title: "Course Full",
        description: `${course.title} has no available spots`,
      });
      return;
    }

    setIsRegistering(true);
    try {
      // Create enrollment via API
      await apiFetch<EnrollmentsResponse["data"][0]>(`/api/enrollments`, {
        method: "POST",
        body: JSON.stringify({
          studentId: student.id,
          courseId: course.id,
          status: "enrolled",
        }),
      });

      setSelectedStudent("");
      setSelectedCourse("");
      await loadData(); // Reload all data after registration

      toast({
        title: "Registration Successful",
        description: `${student.name} has been registered for ${course.title}`,
        className: "bg-success text-success-foreground",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCreateInstructor = async () => {
    if (
      !instructorData.firstName ||
      !instructorData.lastName ||
      !instructorData.email ||
      !instructorData.password
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsCreatingInstructor(true);
    try {
      const created: any = await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({
          ...instructorData,
          role: "instructor",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Assign selected courses to instructor if any selected
      if (selectedInstructorCourses.length > 0 && created?.data?.id) {
        await apiFetch(`/api/users/${created.data.id}/instructor-courses`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseIds: selectedInstructorCourses }),
        });
      }

      toast({
        title: "Instructor Created",
        description: `${instructorData.firstName} ${instructorData.lastName} has been successfully registered as an instructor`,
        className: "bg-success text-success-foreground",
      });

      // Reset form
      setInstructorData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        department: "",
      });
      setSelectedInstructorCourses([]);
      setIsInstructorMode(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create instructor",
      });
    } finally {
      setIsCreatingInstructor(false);
    }
  };

  const handleStatusChange = async (
    registrationId: string,
    newStatus: Registration["status"]
  ) => {
    // Check if the registration exists in the local state
    const registration = registrations.find((reg) => reg.id === registrationId);
    if (!registration) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "The registration could not be found.",
      });
      return;
    }

    setStatusLoadingId(registrationId);
    try {
      await apiFetch(`/api/enrollments/${registrationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Update local state immediately for better UX
      setRegistrations((prevRegistrations) =>
        prevRegistrations.map((reg) =>
          reg.id === registrationId ? { ...reg, status: newStatus } : reg
        )
      );

      toast({
        title: "Status Updated",
        description: `${registration.studentName}'s status for ${registration.courseName} updated to ${newStatus}`,
        className: "bg-success text-success-foreground",
      });

      // Reload data to ensure consistency
      await loadData();
    } catch (error: any) {
      console.error("Status update failed:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "An error occurred while updating status",
      });
      // Reload data to revert any local changes
      await loadData();
    } finally {
      setStatusLoadingId(null);
    }
  };

  const getStatusBadge = (status: Registration["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            ⏳ Pending
          </Badge>
        );
      case "enrolled":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 border-green-300"
          >
            ✅ Enrolled
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="default"
            className="bg-blue-100 text-blue-800 border-blue-300"
          >
            🎓 Completed
          </Badge>
        );
      case "dropped":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 border-red-300"
          >
            ❌ Dropped
          </Badge>
        );
      default:
        return <Badge variant="secondary">❓ Unknown</Badge>;
    }
  };

  const getAvailableSpots = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return 0;

    const currentEnrollments = registrations.filter(
      (reg) => reg.courseId === courseId && reg.status !== "dropped"
    ).length;

    return course.capacity - currentEnrollments;
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <main className="flex-1">
        {/* Header */}
        <header className="bg-card border-b border-border p-4 md:p-6">
          <div className="ml-12 md:ml-0">
            <h1 className="text-2xl font-bold text-sidebar">
              Registration Management
            </h1>
            <p className="text-muted-foreground">
              Manage student course enrollments and registrations
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Registration Form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sidebar">
                <UserPlus className="w-5 h-5" />
                New Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Button
                  variant={!isInstructorMode ? "default" : "outline"}
                  onClick={() => setIsInstructorMode(false)}
                  className="bg-gradient-primary hover:bg-primary-dark"
                >
                  Student Registration
                </Button>
                <Button
                  variant={isInstructorMode ? "default" : "outline"}
                  onClick={() => setIsInstructorMode(true)}
                  className="bg-gradient-primary hover:bg-primary-dark"
                >
                  Instructor Registration
                </Button>
              </div>

              {!isInstructorMode ? (
                // Student Registration Form
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Select Student</Label>
                    <Select
                      value={selectedStudent}
                      onValueChange={setSelectedStudent}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose student..." />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {student.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {student.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Course</Label>
                    <Select
                      value={selectedCourse}
                      onValueChange={setSelectedCourse}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {course.title}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {course.code} - {getAvailableSpots(course.id)}{" "}
                                spots available
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleRegisterStudent}
                    className="bg-gradient-primary hover:bg-primary-dark"
                    disabled={
                      !selectedStudent || !selectedCourse || isRegistering
                    }
                  >
                    {isRegistering ? (
                      "Registering..."
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                // Instructor Registration Form
                <div className="space-y-6">
                  {/* Instructors List */}
                  <div>
                    <Label className="mb-2 block">Registered Instructors</Label>
                    <div className="border rounded-md bg-white overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                        {instructors.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">No instructors found.</div>
                        ) : (
                          instructors.map((inst) => (
                            <div key={inst.id} className="p-4">
                              <div className="font-medium text-sidebar">
                                {inst.firstName} {inst.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">{inst.email}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Create Instructor Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input
                      placeholder="Enter first name"
                      value={instructorData.firstName}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          firstName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input
                      placeholder="Enter last name"
                      value={instructorData.lastName}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          lastName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={instructorData.email}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={instructorData.password}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      placeholder="Enter department"
                      value={instructorData.department}
                      onChange={(e) =>
                        setInstructorData({
                          ...instructorData,
                          department: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Assign Courses (optional)</Label>
                    <div className="border rounded-md p-2 max-h-56 overflow-auto bg-white">
                      {courses.map((course) => {
                        const checked = selectedInstructorCourses.includes(course.id);
                        return (
                          <label key={course.id} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setSelectedInstructorCourses((prev) =>
                                  e.target.checked
                                    ? [...prev, course.id]
                                    : prev.filter((id) => id !== course.id)
                                );
                              }}
                            />
                            <span className="text-sm">
                              {course.title} <span className="text-muted-foreground">({course.code})</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">You can also assign or change courses later.</p>
                  </div>

                  <div className="space-y-2 flex items-end">
                    <Button
                      onClick={handleCreateInstructor}
                      className="bg-gradient-primary hover:bg-primary-dark w-full"
                      disabled={isCreatingInstructor}
                    >
                      {isCreatingInstructor ? (
                        "Creating..."
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create Instructor
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search registrations..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registrations List */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-sidebar">
                  Current Registrations
                </CardTitle>
                {/* Admin User label showing selected student */}
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-sidebar">Admin User:</span>{" "}
                  {(() => {
                    const student = students.find(
                      (s) => s.id === selectedStudent
                    );
                    return student ? (
                      <span>
                        {student.name} ({student.email})
                      </span>
                    ) : (
                      <span>None selected</span>
                    );
                  })()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isPageLoading ? (
                <div className="text-center py-12">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {filteredRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between p-5 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {registration.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold text-sidebar text-lg">
                              {registration.studentName}
                            </span>
                            {getStatusBadge(registration.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              <span className="font-medium">
                                {registration.courseName}
                              </span>
                              <span className="text-primary font-mono">
                                ({registration.courseCode})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Registered:{" "}
                                {new Date(
                                  registration.registrationDate
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          Status:
                        </div>
                        <Select
                          value={registration.status}
                          onValueChange={(value: Registration["status"]) =>
                            handleStatusChange(registration.id, value)
                          }
                          disabled={statusLoadingId === registration.id}
                        >
                          <SelectTrigger className="w-36">
                            {statusLoadingId === registration.id ? (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border border-gray-300 border-t-primary rounded-full animate-spin"></div>
                                <span>Updating...</span>
                              </div>
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                Pending
                              </div>
                            </SelectItem>
                            <SelectItem value="enrolled">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Enrolled
                              </div>
                            </SelectItem>
                            <SelectItem value="completed">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Completed
                              </div>
                            </SelectItem>
                            <SelectItem value="dropped">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Dropped
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {filteredRegistrations.length === 0 && !isPageLoading && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No registrations found
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchTerm
                      ? `No registrations match "${searchTerm}". Try adjusting your search terms.`
                      : "Start by registering students for courses using the form above."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Capacity Overview */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sidebar">
                Course Capacity Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => {
                  const currentEnrollments = registrations.filter(
                    (reg) =>
                      reg.courseId === course.id && reg.status !== "dropped"
                  ).length;
                  const capacityPercentage =
                    (currentEnrollments / course.capacity) * 100;

                  return (
                    <div key={course.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sidebar">
                            {course.title}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({course.code})
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {currentEnrollments}/{course.capacity} (
                          {Math.round(capacityPercentage)}%)
                        </span>
                      </div>
                      <div className="w-full bg-surface rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            capacityPercentage >= 90
                              ? "bg-destructive"
                              : capacityPercentage >= 75
                              ? "bg-warning"
                              : "bg-gradient-primary"
                          }`}
                          style={{
                            width: `${Math.min(capacityPercentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RegistrationManagement;
