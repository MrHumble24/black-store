import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/entities/user/model/auth.store";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  TrendingUp,
  RotateCcw,
  Receipt,
  LogOut,
  Scan,
  Users,
  Truck,
  Tags,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "POS / Sell", icon: Scan, href: "/pos" },
  { label: "Products", icon: Package, href: "/products" },
  { label: "Inventory", icon: Warehouse, href: "/inventory" },
  { label: "Sales", icon: ShoppingCart, href: "/sales" },
  { label: "Purchases", icon: Truck, href: "/purchases" },
  { label: "Returns", icon: RotateCcw, href: "/returns" },
  { label: "Expenses", icon: Receipt, href: "/expenses" },
  { label: "Reports", icon: TrendingUp, href: "/reports" },
];

const settingsItems = [
  { label: "Users", icon: Users, href: "/settings/users" },
  { label: "Warehouses", icon: Warehouse, href: "/settings/warehouses" },
  { label: "Brands", icon: Tags, href: "/settings/brands" },
  { label: "Categories", icon: Layers, href: "/settings/categories" },
  { label: "Providers", icon: Truck, href: "/settings/providers" },
  { label: "System Backup", icon: ShieldCheck, href: "/settings/backup" },
];

interface SidebarContentProps {
  onItemClick?: () => void;
  isCollapsed?: boolean;
}

export function SidebarContent({
  onItemClick,
  isCollapsed,
}: SidebarContentProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-full flex-col bg-card overflow-hidden">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold">B</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-foreground truncate">
              Black Store
            </span>
          )}
        </div>
        {!isCollapsed && <ThemeToggle />}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-1 px-3">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href} onClick={onItemClick}>
              <Button
                variant={
                  location.pathname === item.href ? "secondary" : "ghost"
                }
                className={cn(
                  "w-full justify-start gap-3",
                  isCollapsed ? "px-2 justify-center" : "px-4",
                  location.pathname === item.href && "bg-secondary"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Button>
            </Link>
          ))}
        </div>

        <Separator className="my-4 bg-border mx-3" />

        <div className="space-y-1 px-3">
          {!isCollapsed && (
            <p className="px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Settings
            </p>
          )}
          {settingsItems.map((item) => (
            <Link key={item.href} to={item.href} onClick={onItemClick}>
              <Button
                variant={
                  location.pathname === item.href ? "secondary" : "ghost"
                }
                className={cn(
                  "w-full justify-start gap-3",
                  isCollapsed ? "px-2 justify-center" : "px-4",
                  location.pathname === item.href && "bg-secondary"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-border p-4 shrink-0 overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <span className="text-sm font-medium">
              {user?.name?.charAt(0) || "U"}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/20",
            isCollapsed && "px-2 justify-center"
          )}
          onClick={logout}
          title={isCollapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Sign out</span>}
        </Button>
      </div>
    </div>
  );
}

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden lg:flex h-screen flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent isCollapsed={isCollapsed} />
    </aside>
  );
}
