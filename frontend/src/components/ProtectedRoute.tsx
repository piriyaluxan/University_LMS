import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  studentId?: string;
}

const ProtectedRoute = ({
  children,
  allowedRoles = ["student"],
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Verify token and get user info
        const response = await apiFetch<{ user: User }>("/api/auth/me");

        if (response.user) {
          setUser(response.user);

          // Check if user role is allowed
          if (allowedRoles.includes(response.user.role)) {
            setIsAuthenticated(true);
          } else {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You don't have permission to access this page",
            });
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
