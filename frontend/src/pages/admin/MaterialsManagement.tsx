import { useEffect, useRef, useState } from "react";
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
  FileText,
  Plus,
  Search,
  Eye,
  Trash2,
  Edit,
  Upload,
  Download,
  Book,
  Video,
  Image,
  File,
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { apiFetch, apiFetchForm } from "@/lib/api";

interface MaterialDto {
  _id: string;
  title: string;
  description?: string;
  course: { _id: string } | string;
  uploadedBy?: any;
  fileUrl: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileType: "video" | "image" | "pdf" | "docx" | "other";
  size: number;
  createdAt: string;
}

interface CourseItem {
  id: string;
  title: string;
  code: string;
}

const MaterialsManagement = () => {
  const [materials, setMaterials] = useState<MaterialDto[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialDto | null>(
    null
  );

  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "pdf" as MaterialDto["fileType"],
    courseId: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const c = await apiFetch<{ success: boolean; data: any[] }>(
          "/api/courses?limit=100"
        );
        const mapped = c.data.map((x) => ({
          id: x._id,
          title: x.title,
          code: x.code,
        }));
        setCourses(mapped);
        if (!newMaterial.courseId && mapped[0]) {
          setNewMaterial((prev) => ({ ...prev, courseId: mapped[0].id }));
        }
        const m = await apiFetch<{ success: boolean; data: MaterialDto[] }>(
          "/api/materials"
        );
        setMaterials(m.data);
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Failed to load",
          description: e.message,
        });
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const courseId =
      typeof material.course === "string"
        ? material.course
        : material.course._id;
    const matchesCourse =
      selectedCourse === "all" || courseId === selectedCourse;
    const matchesType =
      selectedType === "all" || material.fileType === selectedType;
    return matchesSearch && matchesCourse && matchesType;
  });

  const handleAddMaterial = async () => {
    if (
      !newMaterial.title ||
      !newMaterial.courseId ||
      !fileInputRef.current?.files?.[0]
    ) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields and select a file",
      });
      return;
    }

    try {
      const fd = new FormData();
      fd.append("title", newMaterial.title);
      if (newMaterial.description)
        fd.append("description", newMaterial.description);
      fd.append("courseId", newMaterial.courseId);
      fd.append("file", fileInputRef.current.files![0]);
      const res = await apiFetchForm<{ success: boolean; data: MaterialDto }>(
        "/api/materials",
        fd
      );
      setMaterials((prev) => [res.data, ...prev]);
      toast({
        title: "Material Added",
        description: "Course material has been successfully added",
        className: "bg-success text-success-foreground",
      });
      setNewMaterial({
        title: "",
        description: "",
        type: "pdf",
        courseId: courses[0]?.id || "",
      });
      setIsDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: e.message,
      });
    }
  };

  const getTypeIcon = (type: MaterialDto["fileType"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5 text-destructive" />;
      case "video":
        return <Video className="w-5 h-5 text-primary" />;
      case "image":
        return <Image className="w-5 h-5 text-success" />;
      case "docx":
        return <File className="w-5 h-5 text-secondary" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getTypeBadge = (type: MaterialDto["fileType"]) => {
    const variants = {
      pdf: "destructive",
      video: "default",
      image: "secondary",
      docx: "outline",
      other: "outline",
    } as const;
    return (
      <Badge variant={(variants as any)[type]} className="uppercase">
        {type}
      </Badge>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-surface">
      <AdminSidebar />

      <main className="flex-1  p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-sidebar">
                Course Materials
              </h1>
              <p className="text-muted-foreground">
                Manage course materials and resources
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-primary hover:bg-primary-dark gap-2"
                  onClick={() => {
                    setEditingMaterial(null);
                    setNewMaterial({
                      title: "",
                      description: "",
                      type: "pdf",
                      courseId: courses[0]?.id || "",
                    });
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Material
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingMaterial ? "Edit Material" : "Add Course Material"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newMaterial.title}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          title: e.target.value,
                        })
                      }
                      placeholder="Enter material title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newMaterial.description}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter material description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="course">Course</Label>
                      <Select
                        value={newMaterial.courseId}
                        onValueChange={(value) =>
                          setNewMaterial({ ...newMaterial, courseId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={newMaterial.type}
                        onValueChange={(value) =>
                          setNewMaterial({ ...newMaterial, type: value as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="docx">DOCX</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="file">File</Label>
                    <div className="flex gap-2">
                      <Input id="file" type="file" ref={fileInputRef} />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAddMaterial}
                      className="flex-1 bg-gradient-primary hover:bg-primary-dark"
                    >
                      {editingMaterial ? "Update Material" : "Add Material"}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search materials, courses, or files..."
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
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Materials Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <Card
                key={material._id}
                className="shadow-card hover:shadow-elevated transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(material.fileType)}
                      <div className="space-y-1">
                        <CardTitle className="text-lg text-sidebar leading-tight">
                          {material.title}
                        </CardTitle>
                        <p className="text-sm text-secondary font-medium">
                          {material.originalName}
                        </p>
                      </div>
                    </div>
                    {getTypeBadge(material.fileType)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {material.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File:</span>
                      <a
                        className="text-primary font-medium truncate max-w-[200px]"
                        href={material.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {material.originalName}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="text-sidebar">
                        {(material.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uploaded:</span>
                      <span className="text-sidebar">
                        {new Date(material.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <a
                        href={material.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={`/api/materials/${material._id}/download`}>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMaterial(material)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast({
                          title: "Not implemented",
                          description:
                            "Delete endpoint can be added if needed.",
                        })
                      }
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMaterials.length === 0 && (
            <div className="text-center py-12">
              <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-sidebar mb-2">
                No materials found
              </h3>
              <p className="text-muted-foreground mb-4">
                No course materials match your current filters
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCourse("all");
                  setSelectedType("all");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MaterialsManagement;
