import { cn } from "@/shared/lib/utils";
import { SidebarContent } from "./SidebarContent";

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden lg:flex h-screen flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <SidebarContent isCollapsed={isCollapsed} />
    </aside>
  );
}

export { SidebarContent };
