import { useState, useEffect } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Calendar,
  BookOpen,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  instructor: {
    firstName: string;
    lastName: string;
    email: string;
  };
  capacity: number;
  enrolled: number;
  duration: string;
  status: "active" | "inactive" | "archived";
}

interface CoursesResponse {
  success: boolean;
  data: Array<{
    _id: string;
    title: string;
    code: string;
    description: string;
    instructor: {
      firstName: string;
      lastName: string;
      email: string;
    };
    capacity: number;
    enrolled: number;
    duration: string;
    status: string;
  }>;
  pagination?: any;
}

const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    description: "",
    instructor: "",
    capacity: "",
    duration: "",
    credits: "",
    level: "beginner",
    category: "",
  });

  const fetchCourses = async () => {
    try {
      const res = await apiFetch<CoursesResponse>(`/api/courses?limit=50`);
      setCourses(
        res.data.map((c) => ({
          id: c._id,
          title: c.title,
          code: c.code,
          description: c.description,
          instructor: c.instructor,
          capacity: c.capacity,
          enrolled: c.enrolled,
          duration: c.duration,
          status: c.status as "active" | "inactive" | "archived",
        }))
      );
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to load courses" });
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${course.instructor.firstName} ${course.instructor.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.code || !formData.instructor) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      if (editingCourse) {
        // Update existing course
        await apiFetch(`/api/courses/${editingCourse.id}`, {
          method: "PUT",
          body: JSON.stringify({
            title: formData.title,
            code: formData.code,
            description: formData.description,
            capacity: parseInt(formData.capacity) || 50,
            duration: formData.duration,
            credits: parseInt(formData.credits) || 3,
            level: formData.level,
            category: formData.category,
          }),
        });

        toast({
          title: "Course Updated",
          description: `${formData.title} has been updated successfully`,
          className: "bg-success text-success-foreground",
        });
      } else {
        // Add new course - need to find instructor by email
        const instructorEmail = formData.instructor;
        const usersRes = await apiFetch<any>(
          `/api/users?role=instructor&search=${instructorEmail}`
        );
        const instructor = usersRes.data.find(
          (u: any) => u.email === instructorEmail
        );

        if (!instructor) {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "Instructor not found. Please use a valid instructor email.",
          });
          return;
        }

        await apiFetch(`/api/courses`, {
          method: "POST",
          body: JSON.stringify({
            title: formData.title,
            code: formData.code,
            description: formData.description,
            instructor: instructor._id,
            capacity: parseInt(formData.capacity) || 50,
            duration: formData.duration,
            credits: parseInt(formData.credits) || 3,
            level: formData.level,
            category: formData.category,
            status: "active",
          }),
        });

        toast({
          title: "Course Added",
          description: `${formData.title} has been added successfully`,
          className: "bg-success text-success-foreground",
        });
      }

      await fetchCourses();
      resetForm();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      code: "",
      description: "",
      instructor: "",
      capacity: "",
      duration: "",
      credits: "",
      level: "beginner",
      category: "",
    });
    setEditingCourse(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      code: course.code,
      description: course.description,
      instructor: course.instructor.email,
      capacity: course.capacity.toString(),
      duration: course.duration,
      credits: "3",
      level: "beginner",
      category: "Computer Science",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    try {
      await apiFetch(`/api/courses/${courseId}`, { method: "DELETE" });
      await fetchCourses();
      toast({
        title: "Course Deleted",
        description: "Course has been removed successfully",
        className: "bg-success text-success-foreground",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: Course["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="default"
            className="bg-success text-success-foreground"
          >
            Active
          </Badge>
        );
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />

      <main className="flex-1">
        {/* Header */}
        <header className="bg-card border-b border-border p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="ml-12 md:ml-0">
              <h1 className="text-2xl font-bold text-sidebar">
                Course Management
              </h1>
              <p className="text-muted-foreground">
                Manage university courses and curriculum
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:bg-primary-dark">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCourse ? "Edit Course" : "Add New Course"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Course Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="e.g., Advanced Mathematics"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">Course Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value })
                        }
                        placeholder="e.g., MATH301"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Course description..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instructor">Instructor Email *</Label>
                      <Input
                        id="instructor"
                        type="email"
                        value={formData.instructor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            instructor: e.target.value,
                          })
                        }
                        placeholder="instructor@university.edu"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, capacity: e.target.value })
                        }
                        placeholder="50"
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({ ...formData, duration: e.target.value })
                        }
                        placeholder="16 weeks"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="credits">Credits</Label>
                      <Input
                        id="credits"
                        type="number"
                        value={formData.credits}
                        onChange={(e) =>
                          setFormData({ ...formData, credits: e.target.value })
                        }
                        placeholder="3"
                        min="1"
                        max="30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level">Level</Label>
                      <select
                        id="level"
                        value={formData.level}
                        onChange={(e) =>
                          setFormData({ ...formData, level: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        placeholder="Computer Science"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-primary hover:bg-primary-dark"
                    >
                      {editingCourse ? "Update Course" : "Add Course"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search courses..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
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
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sidebar font-medium">
                        {course.instructor.firstName}{" "}
                        {course.instructor.lastName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {course.duration}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Enrolled: {course.enrolled}/{course.capacity}
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round((course.enrolled / course.capacity) * 100)}%
                        full
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

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(course)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(course.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-sidebar mb-2">
                No courses found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by adding your first course"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-primary hover:bg-primary-dark"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CourseManagement;
