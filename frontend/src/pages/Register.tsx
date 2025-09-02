import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { GraduationCap, User, Lock, Mail } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    studentId: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: "student",
          studentId: formData.studentId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Registration failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast({
        title: "Account created",
        description: "Welcome to the LMS",
        className: "bg-success text-success-foreground",
      });
      navigate("/student");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-sidebar">
            Create Student Account
          </CardTitle>
          <p className="text-muted-foreground mt-2">Join the University LMS</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sidebar font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sidebar font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sidebar font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sidebar font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-sidebar font-medium">
                Student ID (optional)
              </Label>
              <Input
                id="studentId"
                placeholder="S12345"
                value={formData.studentId}
                onChange={(e) =>
                  setFormData({ ...formData, studentId: e.target.value })
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:bg-primary-dark"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>

            <div className="text-center text-sm mt-2">
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => navigate("/login")}
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
