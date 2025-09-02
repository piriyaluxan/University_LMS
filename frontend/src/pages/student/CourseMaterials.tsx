import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Search,
  FileText,
  Eye,
  Download,
  Filter,
  GraduationCap,
  LogOut,
  ClipboardCheck,
  Upload
} from "lucide-react";

interface Material {
  id: number;
  title: string;
  description: string;
  type: "pdf" | "video" | "image" | "document";
  courseId: number;
  courseTitle: string;
  fileName: string;
  uploadDate: string;
  size: string;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  courseId: number;
  courseTitle: string;
  dueDate: string;
  maxPoints: number;
  status: "active" | "submitted" | "graded" | "overdue";
  submissionDate?: string;
  grade?: number;
  feedback?: string;
}

interface EnrolledCourse {
  id: number;
  title: string;
  code: string;
  instructor: string;
  progress: number;
  status: "active" | "completed" | "paused";
  enrollmentDate: string;
}

const CourseMaterials = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = parseInt(searchParams.get('courseId') || '1');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeSection, setActiveSection] = useState<"materials" | "assignments">("materials");

  // Mock student data
  const studentInfo = {
    name: "John Student",
    email: "john.student@university.edu",
    id: "ST2024001"
  };

  // Mock enrolled courses
  const enrolledCourses: EnrolledCourse[] = [
    {
      id: 1,
      title: "Advanced Mathematics",
      code: "MATH301",
      instructor: "Dr. Sarah Johnson",
      progress: 75,
      status: "active",
      enrollmentDate: "2024-01-15"
    },
    {
      id: 2,
      title: "Computer Science 101",
      code: "CS101",
      instructor: "Prof. Michael Chen",
      progress: 100,
      status: "completed",
      enrollmentDate: "2024-01-10"
    }
  ];

  // Mock materials data
  const materials: Material[] = [
    {
      id: 1,
      title: "Introduction to Calculus",
      description: "Basic concepts and overview of differential calculus",
      type: "pdf",
      courseId: 1,
      courseTitle: "Advanced Mathematics",
      fileName: "calculus_intro.pdf",
      uploadDate: "2024-01-15",
      size: "2.3 MB"
    },
    {
      id: 2,
      title: "Calculus Video Tutorial",
      description: "Complete guide to calculus fundamentals with practical examples",
      type: "video",
      courseId: 1,
      courseTitle: "Advanced Mathematics",
      fileName: "calculus_tutorial.mp4",
      uploadDate: "2024-01-18",
      size: "125 MB"
    },
    {
      id: 3,
      title: "Math Formula Sheet",
      description: "Essential formulas for advanced mathematics course",
      type: "pdf",
      courseId: 1,
      courseTitle: "Advanced Mathematics",
      fileName: "math_formulas.pdf",
      uploadDate: "2024-01-20",
      size: "1.2 MB"
    },
    {
      id: 4,
      title: "Programming Basics",
      description: "Introduction to programming concepts",
      type: "document",
      courseId: 2,
      courseTitle: "Computer Science 101",
      fileName: "programming_basics.docx",
      uploadDate: "2024-01-12",
      size: "890 KB"
    }
  ];

  // Mock assignments data
  const assignments: Assignment[] = [
    {
      id: 1,
      title: "Calculus Problem Set 1",
      description: "Solve differential equations and integration problems",
      courseId: 1,
      courseTitle: "Advanced Mathematics",
      dueDate: "2024-02-20",
      maxPoints: 100,
      status: "active",
    },
    {
      id: 2,
      title: "Programming Assignment: Algorithms",
      description: "Implement sorting algorithms in Python",
      courseId: 2,
      courseTitle: "Computer Science 101",
      dueDate: "2024-01-25",
      maxPoints: 150,
      status: "submitted",
      submissionDate: "2024-01-24",
      grade: 142,
      feedback: "Excellent implementation with optimized code structure."
    }
  ];

  const currentCourse = enrolledCourses.find(c => c.id === courseId);
  const courseMaterials = materials.filter(m => m.courseId === courseId);
  const courseAssignments = assignments.filter(a => a.courseId === courseId);

  const getTypeIcon = (type: Material["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5 text-destructive" />;
      case "video":
        return <Eye className="w-5 h-5 text-primary" />;
      case "image":
        return <Eye className="w-5 h-5 text-success" />;
      case "document":
        return <FileText className="w-5 h-5 text-secondary" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getAssignmentStatusBadge = (assignment: Assignment) => {
    const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status !== "submitted" && assignment.status !== "graded";
    
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    switch (assignment.status) {
      case "active":
        return <Badge variant="default" className="bg-primary text-primary-foreground">Active</Badge>;
      case "submitted":
        return <Badge variant="default" className="bg-secondary text-secondary-foreground">Submitted</Badge>;
      case "graded":
        return <Badge variant="default" className="bg-success text-success-foreground">Graded</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const filteredMaterials = courseMaterials
    .filter(material => 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(material => 
      filterType === "all" || material.type === filterType
    );

  const filteredAssignments = courseAssignments
    .filter(assignment => 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleLogout = () => {
    navigate("/login");
  };

  if (!currentCourse) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-4">Course not found</h2>
            <Button onClick={() => navigate("/student")}>
              Return to Student Portal
            </Button>
          </CardContent>
        </Card>
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/student")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Portal
              </Button>
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center ml-4">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar">{currentCourse.title}</h1>
                <p className="text-sm text-muted-foreground">{currentCourse.code} • {currentCourse.instructor}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-sidebar">{studentInfo.name}</p>
                <p className="text-xs text-muted-foreground">{studentInfo.id}</p>
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
        {/* Course Info */}
        <div className="mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-sidebar">{currentCourse.title}</h2>
                  <p className="text-muted-foreground">
                    Instructor: {currentCourse.instructor} • Enrolled: {new Date(currentCourse.enrollmentDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Progress</div>
                  <div className="text-2xl font-bold text-sidebar">{currentCourse.progress}%</div>
                  <div className="w-24 bg-surface rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentCourse.progress === 100 ? 'bg-success' : 'bg-gradient-primary'
                      }`}
                      style={{ width: `${currentCourse.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant={activeSection === "materials" ? "default" : "outline"}
            onClick={() => setActiveSection("materials")}
            className={activeSection === "materials" ? "bg-primary text-primary-foreground" : ""}
          >
            <FileText className="w-4 h-4 mr-2" />
            Materials ({courseMaterials.length})
          </Button>
          <Button
            variant={activeSection === "assignments" ? "default" : "outline"}
            onClick={() => setActiveSection("assignments")}
            className={activeSection === "assignments" ? "bg-primary text-primary-foreground" : ""}
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Assignments ({courseAssignments.length})
          </Button>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-card mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={`Search ${activeSection}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {activeSection === "materials" && (
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Materials Section */}
        {activeSection === "materials" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(material.type)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg text-sidebar truncate">{material.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{material.fileName}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{material.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Size: {material.size}</span>
                    <span>Added: {new Date(material.uploadDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-gradient-primary hover:bg-primary-dark">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredMaterials.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-sidebar mb-2">No materials found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : "No materials available for this course yet"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Section */}
        {activeSection === "assignments" && (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status !== "submitted" && assignment.status !== "graded";
              const isDueSoon = Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) <= 3;
              
              return (
                <Card key={assignment.id} className={`shadow-card ${
                  isOverdue ? 'border-l-4 border-l-destructive' :
                  isDueSoon && assignment.status === 'active' ? 'border-l-4 border-l-warning' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <ClipboardCheck className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-sidebar">{assignment.title}</h3>
                          {getAssignmentStatusBadge(assignment)}
                        </div>
                        <p className="text-muted-foreground mb-4">{assignment.description}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Due Date: </span>
                            <span className={`font-medium ${
                              isOverdue ? 'text-destructive' : 
                              isDueSoon && assignment.status === 'active' ? 'text-warning' : 'text-sidebar'
                            }`}>
                              {new Date(assignment.dueDate).toLocaleDateString()}
                              {isOverdue && <span className="ml-1">(Overdue)</span>}
                              {isDueSoon && assignment.status === 'active' && <span className="ml-1">(Due Soon)</span>}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Points: </span>
                            <span className="font-medium text-sidebar">
                              {assignment.grade ? `${assignment.grade}/${assignment.maxPoints}` : assignment.maxPoints}
                            </span>
                          </div>
                          {assignment.submissionDate && (
                            <div>
                              <span className="text-muted-foreground">Submitted: </span>
                              <span className="font-medium text-sidebar">
                                {new Date(assignment.submissionDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        {assignment.feedback && (
                          <div className="mt-4 p-3 bg-success/10 rounded-lg">
                            <p className="text-sm font-medium text-sidebar mb-1">Feedback:</p>
                            <p className="text-sm text-muted-foreground">{assignment.feedback}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {assignment.status === "active" && !isOverdue && (
                          <Button className="bg-gradient-primary hover:bg-primary-dark">
                            <Upload className="w-4 h-4 mr-2" />
                            Submit
                          </Button>
                        )}
                        <Button variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredAssignments.length === 0 && (
              <div className="text-center py-12">
                <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-sidebar mb-2">No assignments found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : "No assignments available for this course yet"}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseMaterials;