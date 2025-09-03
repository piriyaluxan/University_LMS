import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

const SetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState<string>(emailParam);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !newPassword || !confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all fields" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match" });
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const message = (data && (data.error || data.message)) || res.statusText || "Failed to set password";
        throw new Error(message);
      }
      toast({ title: "Password set", description: "Your password has been set. Please sign in." });
      navigate("/login");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error?.message || "Failed to set password" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-sidebar">Set Your Password</CardTitle>
          <p className="text-muted-foreground mt-2">For first-time student login</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sidebar font-medium">Student Email</Label>
              <Input id="email" type="email" placeholder="student@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sidebar font-medium">New Password</Label>
              <Input id="newPassword" type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sidebar font-medium">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary hover:bg-primary-dark" disabled={isLoading}>
              {isLoading ? "Setting Password..." : "Set Password"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/login")}>Back to Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetPassword;


