import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useTabsStore } from "../model/tabs.store";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tabs, addTab, removeTab } = useTabsStore();

  // Map paths to friendly labels
  const getTabLabel = (path: string) => {
    if (path === "/") return "Home";
    const segment = path.split("/").filter(Boolean).pop();
    if (!segment) return "Page";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  useEffect(() => {
    const currentPath = location.pathname;
    const label = getTabLabel(currentPath);

    // Auto-add new tab when navigating
    addTab({
      id: Math.random().toString(36).substring(7),
      label,
      path: currentPath,
    });
  }, [location.pathname, addTab]);

  const handleClose = (e: React.MouseEvent, id: string, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeTab(id);

    // Fallback if we closed the only tab
    if (tabs.length <= 1) {
      navigate("/");
    } else if (location.pathname === path) {
      // Find another path to navigate to
      const remaining = tabs.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        navigate(remaining[remaining.length - 1].path);
      }
    }
  };

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center h-12 bg-card/40 backdrop-blur-md border-b border-border transition-all animate-in fade-in slide-in-from-top-1 shrink-0 relative group/tabbar">
      {/* Navigation Controls (Browser-like) */}
      <div className="flex items-center gap-0.5 px-3 border-r border-border/50">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full"
          onClick={() => navigate(-1)}
          title="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full"
          onClick={() => navigate(1)}
          title="Forward"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Link to="/">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full ml-1"
            title="Home / Launchpad"
          >
            <Home className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Tabs Container */}
      <div className="relative flex-1 flex items-center overflow-hidden h-full px-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar h-full w-full">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={cn(
                    "group relative flex items-center gap-2 px-4 h-9 rounded-xl text-[11px] font-black transition-all whitespace-nowrap min-w-[140px] max-w-[200px] border border-transparent uppercase tracking-tight",
                    isActive
                      ? "bg-background text-primary shadow-sm border-border/40"
                      : "text-muted-foreground/60 hover:bg-muted/40",
                  )}
                >
                  <span className="truncate flex-1 tracking-widest">
                    {tab.label}
                  </span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => handleClose(e, tab.id, tab.path)}
                      className={cn(
                        "p-0.5 rounded-md hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100",
                        isActive && "opacity-100",
                      )}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
