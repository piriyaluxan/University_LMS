import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserPlus,
  GraduationCap,
  LogOut,
  Menu,
  X,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Courses",
      href: "/admin/courses",
      icon: BookOpen,
    },
    {
      title: "Students",
      href: "/admin/students",
      icon: Users,
    },
    {
      title: "Registrations",
      href: "/admin/registrations",
      icon: UserPlus,
    },
    {
      title: "Materials",
      href: "/admin/materials",
      icon: FileText,
    },
    {
      title: "Assignments",
      href: "/admin/assignments",
      icon: ClipboardCheck,
    },
    {
      title: "Results",
      href: "/admin/results",
      icon: GraduationCap,
    },
  ];

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
      className: "bg-success text-success-foreground",
    });
    navigate("/login");
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 bg-card shadow-card"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="w-4 h-4" />
        ) : (
          <Menu className="w-4 h-4" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-sidebar/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground w-64 z-40
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:z-0
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-lg">University LMS</h2>
                <p className="text-sm text-sidebar-foreground/70">
                  Admin Panel
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        hover:bg-sidebar-accent
                        ${
                          isActive(item.href)
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                            : "text-sidebar-foreground"
                        }
                      `}
                    >
                      <IconComponent className="w-5 h-5" />
                      {item.title}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
