import { Button } from "@/components/ui/button";

interface PortalSwitcherProps {
  variant?: "sidebar" | "header" | "compact";
  className?: string;
}

const PortalSwitcher = ({
  variant = "sidebar",
  className = "",
}: PortalSwitcherProps) => {
  // All portal switching functionalities have been removed
  // Component is kept empty to avoid breaking existing imports

  return (
    <div className={className}>
      {/* Portal switching functionality removed */}
    </div>
  );
};

export default PortalSwitcher;
