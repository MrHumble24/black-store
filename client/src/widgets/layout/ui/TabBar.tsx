import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, Home, ListX } from "lucide-react";
import { useTabsStore } from "../model/tabs.store";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export function TabBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { tabs, addTab, removeTab, clearTabs } = useTabsStore();

  // One-time trim after persist rehydrate (older sessions could have >5 tabs)
  useEffect(() => {
    const t = useTabsStore.getState().tabs;
    if (t.length > 5) {
      useTabsStore.setState({ tabs: t.slice(-5) });
    }
  }, []);

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

  const handleCloseAll = () => {
    clearTabs();
    navigate("/");
  };

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center h-9 bg-card/50 backdrop-blur-sm border-b border-border shrink-0">
      <div className="flex items-center px-1.5 border-r border-border/50 shrink-0">
        <Link to="/">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Home"
          >
            <Home className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="relative flex-1 flex items-center min-w-0 h-full px-1">
        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar h-full max-w-full">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={cn(
                  "group relative flex items-center gap-1 pl-2 pr-1 h-7 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-w-0 max-w-36 shrink border border-transparent",
                  isActive
                    ? "bg-background text-foreground shadow-sm border-border/50"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                <span className="truncate">{tab.label}</span>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleClose(e, tab.id, tab.path)}
                    className={cn(
                      "p-0.5 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100 shrink-0",
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

      {tabs.length > 1 && (
        <div className="shrink-0 flex items-center border-l border-border/50 px-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title={t("common.close_all_tabs")}
            onClick={handleCloseAll}
          >
            <ListX className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
