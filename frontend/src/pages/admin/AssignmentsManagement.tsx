import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ClipboardCheck,
  Plus,
  Search,
  Eye,
  Trash2,
  Edit,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Upload,
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { apiFetch, apiFetchForm } from "@/lib/api";

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  course: string;
  courseTitle?: string;
  dueDate?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  updatedAt: string;
  submissionCount?: number;
}

interface Course {
  _id: string;
  title: string;
  code: string;
}

const AssignmentsManagement = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] =
    useState<Assignment | null>(null);

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    courseId: "",
    dueDate: "",
    file: null as File | null,
  });

  // Fetch assignments and courses on component mount
  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch("/api/assignments");
      setAssignments(response.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch assignments",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openSubmissions = async (assignment: Assignment) => {
    try {
      setSelectedAssignmentForSubmissions(assignment);
      const res = await apiFetch(`/api/assignments/${assignment._id}/submissions`);
      setSubmissions(res.data || []);
      setIsSubmissionsOpen(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to load submissions" });
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    if (!selectedAssignmentForSubmissions) return;
    try {
      await apiFetch(`/api/assignments/${selectedAssignmentForSubmissions._id}/submissions/${submissionId}`, { method: "DELETE" });
      setSubmissions((prev) => prev.filter((s) => s._id !== submissionId));
      toast({ title: "Deleted", description: "Submission deleted", className: "bg-success text-success-foreground" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete submission" });
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await apiFetch("/api/courses");
      setCourses(response.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch courses",
      });
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.description &&
        assignment.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    const matchesCourse =
      selectedCourse === "all" || assignment.course === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const handleAddAssignment = async () => {
    if (!newAssignment.title || !newAssignment.courseId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", newAssignment.title);
      formData.append("description", newAssignment.description || "");
      formData.append("courseId", newAssignment.courseId);
      if (newAssignment.dueDate) {
        formData.append("dueDate", newAssignment.dueDate);
      }
      if (newAssignment.file) {
        formData.append("file", newAssignment.file);
      }

      if (editingAssignment) {
        // Update existing assignment
        await apiFetch(`/api/assignments/${editingAssignment._id}`, {
          method: "PUT",
          body: formData,
        });
        toast({
          title: "Assignment Updated",
          description: "Assignment has been successfully updated",
          className: "bg-success text-success-foreground",
        });
      } else {
        // Create new assignment
        await apiFetchForm("/api/assignments", formData);
        toast({
          title: "Assignment Created",
          description: "Assignment has been successfully created",
          className: "bg-success text-success-foreground",
        });
      }

      // Refresh assignments
      fetchAssignments();

      setNewAssignment({
        title: "",
        description: "",
        courseId: "",
        dueDate: "",
        file: null,
      });
      setEditingAssignment(null);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save assignment",
      });
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setNewAssignment({
      title: assignment.title,
      description: assignment.description || "",
      courseId: assignment.course,
      dueDate: assignment.dueDate || "",
      file: null,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await apiFetch(`/api/assignments/${id}`, { method: "DELETE" });
      setAssignments(assignments.filter((a) => a._id !== id));
      toast({
        title: "Assignment Deleted",
        description: "Assignment has been successfully deleted",
        className: "bg-success text-success-foreground",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete assignment",
      });
    }
  };

  const getStatusBadge = () => {
    return (
      <Badge variant="default" className="bg-success text-success-foreground">
        Active
      </Badge>
    );
  };

  const getStatusIcon = () => {
    return <CheckCircle className="w-5 h-5 text-success" />;
  };

  const gradeSubmission = async (
    submissionId: string,
    payload: { grade?: string; remarks?: string }
  ) => {
    if (!selectedAssignmentForSubmissions) return;
    try {
      const res = await apiFetch(
        `/api/assignments/${selectedAssignmentForSubmissions._id}/submissions/${submissionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      setSubmissions((prev) => prev.map((s) => (s._id === submissionId ? res.data : s)));
      toast({ title: "Saved", description: "Submission updated", className: "bg-success text-success-foreground" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update submission" });
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

  return (
    <div className="flex min-h-screen bg-gradient-surface">
      <AdminSidebar />

      <main className="flex-1  p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-sidebar">Assignments</h1>
              <p className="text-muted-foreground">
                Manage course assignments and submissions
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-primary hover:bg-primary-dark gap-2"
                  onClick={() => {
                    setEditingAssignment(null);
                    setNewAssignment({
                      title: "",
                      description: "",
                      courseId: "",
                      dueDate: "",
                      file: null,
                    });
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Create Assignment
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAssignment
                      ? "Edit Assignment"
                      : "Create Assignment"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newAssignment.title}
                        onChange={(e) =>
                          setNewAssignment({
                            ...newAssignment,
                            title: e.target.value,
                          })
                        }
                        placeholder="Enter assignment title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="course">Course</Label>
                      <Select
                        value={newAssignment.courseId}
                        onValueChange={(value) =>
                          setNewAssignment({
                            ...newAssignment,
                            courseId: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAssignment.description}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter assignment description"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newAssignment.dueDate}
                        onChange={(e) =>
                          setNewAssignment({
                            ...newAssignment,
                            dueDate: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="file">Attachment (Optional)</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={(e) =>
                          setNewAssignment({
                            ...newAssignment,
                            file: e.target.files?.[0] || null,
                          })
                        }
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAddAssignment}
                      className="flex-1 bg-gradient-primary hover:bg-primary-dark"
                    >
                      {editingAssignment
                        ? "Update Assignment"
                        : "Create Assignment"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search assignments or courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading assignments...</p>
            </div>
          )}

          {/* Assignments Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAssignments.map((assignment) => (
                <Card
                  key={assignment._id}
                  className={`shadow-card hover:shadow-elevated transition-shadow ${
                    isOverdue(assignment.dueDate || "")
                      ? "border-l-4 border-l-destructive"
                      : isDueSoon(assignment.dueDate || "")
                      ? "border-l-4 border-l-warning"
                      : ""
                  }`}
                >
                  <CardHeader className="pb-4 cursor-pointer" onClick={() => openSubmissions(assignment)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon()}
                        <div className="space-y-1">
                          <CardTitle className="text-lg text-sidebar leading-tight">
                            {assignment.title}
                          </CardTitle>
                          <p className="text-sm text-secondary font-medium">
                            {courses.find((c) => c._id === assignment.course)
                              ?.title || "Unknown Course"}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge()}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {assignment.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Due:</span>
                        </div>
                        <p
                          className={`font-medium ${
                            isOverdue(assignment.dueDate || "")
                              ? "text-destructive"
                              : isDueSoon(assignment.dueDate || "")
                              ? "text-warning"
                              : "text-sidebar"
                          }`}
                        >
                          {assignment.dueDate
                            ? new Date(assignment.dueDate).toLocaleDateString()
                            : "No due date"}
                          {isOverdue(assignment.dueDate || "") && (
                            <span className="ml-2 text-xs">(Overdue)</span>
                          )}
                          {isDueSoon(assignment.dueDate || "") && (
                            <span className="ml-2 text-xs">(Due Soon)</span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Created:
                          </span>
                        </div>
                        <p className="font-medium text-sidebar">
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openSubmissions(assignment)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Submissions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAssignment(assignment)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12">
              <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-sidebar mb-2">
                No assignments found
              </h3>
              <p className="text-muted-foreground mb-4">
                No assignments match your current filters
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCourse("all");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>
      {/* Submissions Drawer */}
      <Sheet open={isSubmissionsOpen} onOpenChange={setIsSubmissionsOpen}>
        <SheetContent side="right" className="w-full sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>
              {selectedAssignmentForSubmissions
                ? `Submissions • ${selectedAssignmentForSubmissions.title}`
                : "Submissions"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {submissions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No submissions yet.</div>
            ) : (
              submissions.map((s) => (
                <div key={s._id} className="p-3 border rounded-md bg-white flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-sidebar truncate">
                      {s.student?.firstName} {s.student?.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{s.student?.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(s.submittedAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-secondary truncate">{s.originalName}</div>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Grade"
                        value={s.grade || ""}
                        onChange={(e) =>
                          setSubmissions((prev) =>
                            prev.map((x) => (x._id === s._id ? { ...x, grade: e.target.value } : x))
                          )
                        }
                        className="h-8 w-24"
                      />
                      <Input
                        placeholder="Remarks"
                        value={s.remarks || ""}
                        onChange={(e) =>
                          setSubmissions((prev) =>
                            prev.map((x) => (x._id === s._id ? { ...x, remarks: e.target.value } : x))
                          )
                        }
                        className="h-8"
                      />
                      <Button size="sm" onClick={() => gradeSubmission(s._id, { grade: s.grade, remarks: s.remarks })}>
                        Save
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!selectedAssignmentForSubmissions) return;
                        const url = `${window.location.origin}/api/assignments/${selectedAssignmentForSubmissions._id}/submissions/${s._id}/download`;
                        window.open(url, "_blank");
                      }}
                    >
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => deleteSubmission(s._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AssignmentsManagement;
// Submissions Drawer UI
// Placed at end of component render before export
// Note: Keep minimal to avoid layout shifts

