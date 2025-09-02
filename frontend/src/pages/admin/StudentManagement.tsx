import { useEffect, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Mail,
  Phone,
  Calendar,
  Users,
} from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  studentId?: string;
}
interface UsersResponse {
  success: boolean;
  data: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    isActive: boolean;
    studentId?: string;
    role: string;
  }>;
  pagination?: any;
}
import { apiFetch } from "@/lib/api";

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    studentId: "",
  });

  const fetchStudents = async () => {
    const res = await apiFetch<UsersResponse>(
      `/api/users?role=student&limit=50`
    );
    setStudents(
      res.data.map((u) => ({
        id: (u as any)._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        studentId: u.studentId,
      }))
    );
  };

  useEffect(() => {
    fetchStudents().catch(() => {
      toast({ variant: "destructive", title: "Failed to load students" });
    });
  }, []);

  const filteredStudents = students.filter(
    (student) =>
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      if (editingStudent) {
        await apiFetch(`/api/users/${editingStudent.id}`, {
          method: "PUT",
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            studentId: formData.studentId,
          }),
        });
        toast({
          title: "Student Updated",
          description: `${formData.firstName} ${formData.lastName} updated`,
          className: "bg-success text-success-foreground",
        });
      } else {
        await apiFetch(`/api/users`, {
          method: "POST",
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            role: "student",
            // Don't set password - student will set it when first accessing portal
            studentId: formData.studentId || undefined,
          }),
        });
        toast({
          title: "Student Added",
          description: `${formData.firstName} ${formData.lastName} registered`,
          className: "bg-success text-success-foreground",
        });
      }
      await fetchStudents();
      resetForm();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: e.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      enrollmentDate: "",
    });
    setEditingStudent(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone || "",
      studentId: student.studentId || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (studentId: string) => {
    try {
      await apiFetch(`/api/users/${studentId}`, { method: "DELETE" });
      await fetchStudents();
      toast({
        title: "Student Removed",
        description: "Student has been removed",
        className: "bg-success text-success-foreground",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: e.message,
      });
    }
  };

  const toggleActive = async (student: Student) => {
    try {
      await apiFetch(`/api/users/${student.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !student.isActive }),
      });
      await fetchStudents();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: e.message,
      });
    }
  };

  const getStatusBadge = (status: Student["status"]) => {
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
      case "graduated":
        return (
          <Badge variant="outline" className="border-primary text-primary">
            Graduated
          </Badge>
        );
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
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
                Student Management
              </h1>
              <p className="text-muted-foreground">
                Manage student registrations and information
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:bg-primary-dark">
                  <Plus className="w-4 h-4 mr-2" />
                  Register Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingStudent ? "Edit Student" : "Register New Student"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        placeholder="John"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        placeholder="Smith"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="john.smith@university.edu"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        value={formData.studentId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            studentId: e.target.value,
                          })
                        }
                        placeholder="S12345"
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
                      {editingStudent ? "Update Student" : "Register Student"}
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
                placeholder="Search students..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Students Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card
                key={student.id}
                className="shadow-card hover:shadow-elevated transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-sidebar">
                        {student.firstName} {student.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {student.studentId ? `SID: ${student.studentId}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant={student.isActive ? "default" : "secondary"}
                      className={
                        student.isActive
                          ? "bg-success text-success-foreground"
                          : undefined
                      }
                    >
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">
                        {student.email}
                      </span>
                    </div>

                    {student.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {student.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(student)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(student)}
                      className="flex-1"
                    >
                      {student.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(student.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-sidebar mb-2">
                No students found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by registering your first student"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-primary hover:bg-primary-dark"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Register Student
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentManagement;
