import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const handleAdminPortal = () => {
    navigate("/admin/dashboard");
  };

  const handleStudentPortal = () => {
    navigate("/student");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-sidebar mb-4">
            University LMS
          </h1>
          <p className="text-xl text-muted-foreground">
            Learning Management System
          </p>
        </div>

        {/* Portal Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Admin Portal Card */}
          <Card
            className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer group"
            onClick={handleAdminPortal}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-2xl text-sidebar">
                Admin Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Manage courses, students, enrollments, materials, assignments,
                and results. Full administrative control over the learning
                management system.
              </p>
              <div className="flex items-center justify-center gap-2 text-secondary group-hover:text-secondary/80 transition-colors">
                <span className="font-medium">Access Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Student Portal Card */}
          <Card
            className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer group"
            onClick={handleStudentPortal}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl text-sidebar">
                Student Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Browse and enroll in courses, access learning materials, submit
                assignments, and view your academic progress and results.
              </p>
              <div className="flex items-center justify-center gap-2 text-primary group-hover:text-primary/80 transition-colors">
                <span className="font-medium">Access Student Portal</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Login Section */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Need to log in with your credentials?
          </p>
          <Button onClick={handleLogin} variant="outline" className="gap-2">
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sidebar mb-2">
              Course Management
            </h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive course creation, enrollment, and management
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-semibold text-sidebar mb-2">Student Portal</h3>
            <p className="text-sm text-muted-foreground">
              Interactive learning experience with materials and assignments
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <ArrowRight className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-semibold text-sidebar mb-2">
              Seamless Integration
            </h3>
            <p className="text-sm text-muted-foreground">
              Easy switching between admin and student interfaces
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
