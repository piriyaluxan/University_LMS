import { useEffect, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Award,
  Save,
  BookOpen,
  User,
  TrendingUp,
  Plus,
  Calculator,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

interface StudentResult {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  caScore?: number; // Continuous Assessment score
  finalExamScore?: number; // Final examination score
  finalGrade?: string; // Calculated final grade
  finalPercentage: number; // Calculated final percentage
  status: "passed" | "failed" | "pending" | "incomplete";
  lastUpdated: string;
}

interface AddResultForm {
  studentId: string;
  courseId: string;
  caScore: string;
  finalExamScore: string;
}

const ResultsManagement = () => {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [editingResults, setEditingResults] = useState<{
    [key: string]: { caScore: string; finalExamScore: string };
  }>({});

  const [isAddResultDialogOpen, setIsAddResultDialogOpen] = useState(false);
  const [addResultForm, setAddResultForm] = useState<AddResultForm>({
    studentId: "",
    courseId: "",
    caScore: "",
    finalExamScore: "",
  });

  const [students, setStudents] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [courses, setCourses] = useState<
    { id: string; title: string; code: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadResults = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch<any>(`/api/results`);
      if (res.success && res.data) {
        setResults(
          res.data.map((r: any) => {
            const student = r.student || null;
            const course = r.course || null;
            return {
              id: r._id,
              studentId: student?._id || "",
              studentName: `${student?.firstName || "Unknown"} ${
                student?.lastName || "User"
              }`.trim(),
              courseId: course?._id || "",
              courseName: course?.title || "Unknown Course",
              courseCode: course?.code || "N/A",
              caScore: r.caScore,
              finalExamScore: r.finalExamScore,
              finalGrade: r.finalGrade,
              finalPercentage: r.finalPercentage || 0,
              status: r.status || "pending",
              lastUpdated: r.updatedAt,
            } as StudentResult;
          })
        );
      } else {
        console.error("Failed to load results:", res);
        toast({
          variant: "destructive",
          title: "Failed to load results",
          description: res.error || "Unknown error occurred",
        });
      }
    } catch (error: any) {
      console.error("Error loading results:", error);
      toast({
        variant: "destructive",
        title: "Failed to load results",
        description: error.message || "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentsAndCourses = async () => {
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        apiFetch<{ success: boolean; data: any[] }>(
          "/api/users?role=student&limit=100"
        ),
        apiFetch<{ success: boolean; data: any[] }>("/api/courses?limit=100"),
      ]);

      if (studentsRes.success && studentsRes.data) {
        setStudents(
          studentsRes.data.map((s: any) => ({
            id: s._id,
            name: `${s.firstName} ${s.lastName}`,
            email: s.email,
          }))
        );
      } else {
        console.error("Failed to load students:", studentsRes);
      }

      if (coursesRes.success && coursesRes.data) {
        setCourses(
          coursesRes.data.map((c: any) => ({
            id: c._id,
            title: c.title,
            code: c.code,
          }))
        );
      } else {
        console.error("Failed to load courses:", coursesRes);
      }
    } catch (e: any) {
      console.error("Error loading students and courses:", e);
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: e.message || "Unknown error occurred",
      });
    }
  };

  useEffect(() => {
    loadStudentsAndCourses();
    loadResults().catch(() =>
      toast({ variant: "destructive", title: "Failed to load results" })
    );
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredResults = results.filter(
    (result) =>
      result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGradeChange = (
    resultId: string,
    field: "caScore" | "finalExamScore",
    value: string
  ) => {
    setEditingResults((prev) => ({
      ...prev,
      [resultId]: {
        ...prev[resultId],
        [field]: value,
      },
    }));
  };

  const calculateFinalGrade = (
    caScore: number,
    finalExamScore: number
  ): { percentage: number; grade: string } => {
    const caWeighted = caScore * 0.4; // CA contributes 40%
    const finalWeighted = finalExamScore * 0.6; // Final exam contributes 60%
    const finalPercentage = Math.round(caWeighted + finalWeighted);

    let grade = "F";
    if (finalPercentage >= 90) grade = "A+";
    else if (finalPercentage >= 85) grade = "A";
    else if (finalPercentage >= 80) grade = "A-";
    else if (finalPercentage >= 75) grade = "B+";
    else if (finalPercentage >= 70) grade = "B";
    else if (finalPercentage >= 65) grade = "B-";
    else if (finalPercentage >= 60) grade = "C+";
    else if (finalPercentage >= 55) grade = "C";
    else if (finalPercentage >= 50) grade = "C-";
    else if (finalPercentage >= 45) grade = "D+";
    else if (finalPercentage >= 40) grade = "D";
    else grade = "F";

    return { percentage: finalPercentage, grade };
  };

  const handleSaveResult = async (resultId: string) => {
    const editingResult = editingResults[resultId];
    if (!editingResult) return;

    const caScore = parseFloat(editingResult.caScore);
    const finalExamScore = parseFloat(editingResult.finalExamScore);

    if (isNaN(caScore) || caScore < 0 || caScore > 100) {
      toast({
        variant: "destructive",
        title: "Invalid Percentage",
        description: "CA score must be a number between 0 and 100",
      });
      return;
    }

    if (isNaN(finalExamScore) || finalExamScore < 0 || finalExamScore > 100) {
      toast({
        variant: "destructive",
        title: "Invalid Percentage",
        description: "Final exam score must be a number between 0 and 100",
      });
      return;
    }

    const { percentage, grade } = calculateFinalGrade(caScore, finalExamScore);

    // Determine status based on final percentage
    let status: StudentResult["status"] =
      percentage >= 60 ? "passed" : "failed";

    try {
      const toUpdate = results.find((r) => r.id === resultId);
      if (!toUpdate || !toUpdate.studentId || !toUpdate.courseId) {
        toast({
          variant: "destructive",
          title: "Cannot save",
          description: "Missing student or course on this result.",
        });
        return;
      }
      await apiFetch(`/api/results`, {
        method: "POST",
        body: JSON.stringify({
          student: toUpdate.studentId,
          course: toUpdate.courseId,
          caScore,
          finalExamScore,
          finalGrade: grade,
          finalPercentage: percentage,
          status,
        }),
      });
      await loadResults();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: e.message,
      });
      return;
    }

    // Clear editing state
    const newEditingResults = { ...editingResults };
    delete newEditingResults[resultId];
    setEditingResults(newEditingResults);

    toast({
      title: "Result Saved",
      description: "Student result has been updated successfully",
      className: "bg-success text-success-foreground",
    });
  };

  const handleAddResult = async () => {
    if (
      !addResultForm.studentId ||
      !addResultForm.courseId ||
      !addResultForm.caScore ||
      !addResultForm.finalExamScore
    ) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields",
      });
      return;
    }

    const caScore = parseFloat(addResultForm.caScore);
    const finalExamScore = parseFloat(addResultForm.finalExamScore);

    if (
      isNaN(caScore) ||
      caScore < 0 ||
      caScore > 100 ||
      isNaN(finalExamScore) ||
      finalExamScore < 0 ||
      finalExamScore > 100
    ) {
      toast({
        variant: "destructive",
        title: "Invalid Scores",
        description: "Scores must be numbers between 0 and 100",
      });
      return;
    }

    const { percentage, grade } = calculateFinalGrade(caScore, finalExamScore);
    const status: StudentResult["status"] =
      percentage >= 60 ? "passed" : "failed";

    try {
      await apiFetch(`/api/results`, {
        method: "POST",
        body: JSON.stringify({
          student: addResultForm.studentId,
          course: addResultForm.courseId,
          caScore,
          finalExamScore,
          finalGrade: grade,
          finalPercentage: percentage,
          status,
        }),
      });

      await loadResults();
      setAddResultForm({
        studentId: "",
        courseId: "",
        caScore: "",
        finalExamScore: "",
      });
      setIsAddResultDialogOpen(false);

      toast({
        title: "Result Added",
        description: "Student result has been added successfully",
        className: "bg-success text-success-foreground",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Add failed",
        description: e.message,
      });
    }
  };

  const startEditing = (result: StudentResult) => {
    setEditingResults((prev) => ({
      ...prev,
      [result.id]: {
        caScore: result.caScore?.toString() || "",
        finalExamScore: result.finalExamScore?.toString() || "",
      },
    }));
  };

  const getStatusBadge = (status: StudentResult["status"]) => {
    switch (status) {
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
      case "incomplete":
        return <Badge variant="outline">Incomplete</Badge>;
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

  // Statistics
  const totalResults = results.length;
  const passedCount = results.filter((r) => r.status === "passed").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const pendingCount = results.filter((r) => r.status === "pending").length;
  const averagePercentage =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.finalPercentage, 0) / results.length
      : 0;

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />

      <main className="flex-1">
        {/* Header */}
        <header className="bg-card border-b border-border p-4 md:p-6">
          <div className="ml-12 md:ml-0 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-sidebar">
                Results Management
              </h1>
              <p className="text-muted-foreground">
                Manage student grades and academic results
              </p>
            </div>
            <Button
              onClick={() => setIsAddResultDialogOpen(true)}
              className="bg-gradient-primary hover:bg-primary-dark gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Result
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Results
                    </p>
                    <p className="text-2xl font-bold text-sidebar">
                      {totalResults}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Passed
                    </p>
                    <p className="text-2xl font-bold text-sidebar">
                      {passedCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Failed
                    </p>
                    <p className="text-2xl font-bold text-sidebar">
                      {failedCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Average
                    </p>
                    <p className="text-2xl font-bold text-sidebar">
                      {averagePercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search results..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sidebar">Student Results</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading results...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredResults.map((result) => {
                    const isEditing = editingResults[result.id];

                    return (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-foreground" />
                          </div>

                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sidebar">
                                {result.studentName}
                              </span>
                              {getStatusBadge(result.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                <span>
                                  {result.courseName} ({result.courseCode})
                                </span>
                              </div>
                              <span>
                                Updated:{" "}
                                {new Date(
                                  result.lastUpdated
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={isEditing.caScore}
                                onChange={(e) =>
                                  handleGradeChange(
                                    result.id,
                                    "caScore",
                                    e.target.value
                                  )
                                }
                                placeholder="CA Score"
                                type="number"
                                min="0"
                                max="100"
                                className="w-20"
                              />
                              <Input
                                value={isEditing.finalExamScore}
                                onChange={(e) =>
                                  handleGradeChange(
                                    result.id,
                                    "finalExamScore",
                                    e.target.value
                                  )
                                }
                                placeholder="Final"
                                type="number"
                                min="0"
                                max="100"
                                className="w-20"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveResult(result.id)}
                                className="bg-gradient-primary hover:bg-primary-dark"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                {result.caScore && result.finalExamScore ? (
                                  <>
                                    <div className="font-bold text-lg text-sidebar">
                                      {result.finalGrade}
                                    </div>
                                    <div
                                      className={`text-sm font-medium ${getGradeColor(
                                        result.finalPercentage
                                      )}`}
                                    >
                                      {result.finalPercentage}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      CA: {result.caScore}% | Final:{" "}
                                      {result.finalExamScore}%
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-muted-foreground">
                                    No scores
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(result)}
                              >
                                Edit
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isLoading && filteredResults.length === 0 && (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-sidebar mb-2">
                    No results found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "Student results will appear here once grades are entered"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Result Dialog */}
          <Dialog
            open={isAddResultDialogOpen}
            onOpenChange={setIsAddResultDialogOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Student Result</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="student">Student</Label>
                  <Select
                    value={addResultForm.studentId}
                    onValueChange={(value) =>
                      setAddResultForm({ ...addResultForm, studentId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {student.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="course">Course</Label>
                  <Select
                    value={addResultForm.courseId}
                    onValueChange={(value) =>
                      setAddResultForm({ ...addResultForm, courseId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{course.title}</span>
                            <span className="text-sm text-muted-foreground">
                              {course.code}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="caScore">CA Score (%)</Label>
                    <Input
                      id="caScore"
                      type="number"
                      min="0"
                      max="100"
                      value={addResultForm.caScore}
                      onChange={(e) =>
                        setAddResultForm({
                          ...addResultForm,
                          caScore: e.target.value,
                        })
                      }
                      placeholder="0-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="finalExamScore">Final Exam (%)</Label>
                    <Input
                      id="finalExamScore"
                      type="number"
                      min="0"
                      max="100"
                      value={addResultForm.finalExamScore}
                      onChange={(e) =>
                        setAddResultForm({
                          ...addResultForm,
                          finalExamScore: e.target.value,
                        })
                      }
                      placeholder="0-100"
                    />
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calculator className="w-4 h-4" />
                    Grade Calculation
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    CA (40%) + Final Exam (60%) = Final Grade
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleAddResult}
                    className="flex-1 bg-gradient-primary hover:bg-primary-dark"
                  >
                    Add Result
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddResultDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default ResultsManagement;
