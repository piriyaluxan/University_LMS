import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardCheck,
  Search,
  Eye,
  Upload,
  Download,
  Calendar,
  Clock,
  FileText,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  User,
} from "lucide-react";
import { apiFetch, apiFetchForm } from "@/lib/api";

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  course: {
    _id: string;
    title: string;
    code: string;
  };
  dueDate?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

interface Submission {
  _id: string;
  assignment: string;
  student: string;
  fileUrl: string;
  fileName: string;
  originalName: string;
  submittedAt: string;
  status: "submitted" | "graded";
  grade?: number;
  feedback?: string;
}

const Assignments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(
    courseId || "all"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchEnrollments();
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchSubmissions();
  }, [selectedCourse, enrolledCourseIds.join(",")]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const endpoint =
        selectedCourse === "all"
          ? "/api/assignments/enrolled"
          : `/api/assignments?course=${selectedCourse}`;
      const response = await apiFetch(endpoint);
      let items = response.data || [];
      if (selectedCourse === "all" && (!items || items.length === 0)) {
        // Fallback: show all assignments if none for enrolled courses
        const allRes = await apiFetch("/api/assignments");
        items = allRes.data || [];
      }
      setAssignments(items);
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

  const fetchEnrollments = async () => {
    try {
      const res = await apiFetch("/api/enrollments/student/me");
      const ids = (res.data || []).map((e: any) => e.course?._id).filter(Boolean);
      setEnrolledCourseIds(ids);
    } catch (_err) {
      setEnrolledCourseIds([]);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await apiFetch("/api/assignments/submissions");
      setSubmissions(response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch submissions:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !selectedAssignment) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      await apiFetchForm(
        `/api/assignments/${selectedAssignment._id}/submissions`,
        formData
      );

      toast({
        title: "Submission Successful",
        description: "Your assignment has been submitted successfully",
        className: "bg-success text-success-foreground",
      });

      setIsUploadDialogOpen(false);
      setUploadFile(null);
      setSelectedAssignment(null);
      fetchSubmissions(); // Refresh submissions
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload assignment",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = submissions.find((s) => s.assignment === assignmentId);
    return submission;
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

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.description &&
        assignment.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    const matchesCourse =
      selectedCourse === "all" || assignment.course._id === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const getStatusBadge = (assignment: Assignment) => {
    if (!assignment.dueDate) return null;

    if (isOverdue(assignment.dueDate)) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    if (isDueSoon(assignment.dueDate)) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Due Soon
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-surface p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-sidebar">Assignments</h1>
              <p className="text-muted-foreground">
                {selectedCourse === "all"
                  ? "View all your course assignments"
                  : `Assignments for ${
                      courses.find((c) => c._id === selectedCourse)?.title ||
                      "Selected Course"
                    }`}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
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

        {/* Assignments List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assignments...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAssignments.map((assignment) => {
              const submission = getSubmissionStatus(assignment._id);

              const isEnrolled = enrolledCourseIds.includes(assignment.course._id);
              return (
                <Card
                  key={assignment._id}
                  className="shadow-card hover:shadow-elevated transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {assignment.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {assignment.course.title} ({assignment.course.code})
                        </p>
                      </div>
                      {getStatusBadge(assignment)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground">
                        {assignment.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Due:{" "}
                          {assignment.dueDate
                            ? new Date(assignment.dueDate).toLocaleDateString()
                            : "No due date"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {assignment.createdBy.firstName}{" "}
                          {assignment.createdBy.lastName}
                        </span>
                      </div>
                    </div>

                    {assignment.attachmentUrl && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {assignment.attachmentName}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(assignment.attachmentUrl, "_blank")
                          }
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {submission ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">
                            Submitted on{" "}
                            {new Date(
                              submission.submittedAt
                            ).toLocaleDateString()}
                          </span>
                          {submission.grade && (
                            <Badge variant="secondary">
                              Grade: {submission.grade}%
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Dialog
                          open={isUploadDialogOpen}
                          onOpenChange={setIsUploadDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!isEnrolled}
                              onClick={() => setSelectedAssignment(assignment)}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Submit Assignment
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Submit Assignment: {assignment.title}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="file">Select File</Label>
                                <Input
                                  id="file"
                                  type="file"
                                  onChange={(e) =>
                                    setUploadFile(e.target.files?.[0] || null)
                                  }
                                  accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsUploadDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleFileUpload}
                                  disabled={!uploadFile || isUploading}
                                >
                                  {isUploading ? "Uploading..." : "Submit"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {!isEnrolled && (
                        <span className="text-xs text-muted-foreground self-center">
                          Enroll in this course to submit
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && filteredAssignments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-sidebar mb-2">
                No assignments found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No assignments match your search criteria."
                  : "There are no assignments available for the selected course."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Assignments;
