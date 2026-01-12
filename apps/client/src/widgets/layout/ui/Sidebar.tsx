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
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";

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
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold">B</span>
        </div>
        <span className="font-semibold text-foreground">Black Store</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button
                variant={
                  location.pathname === item.href ? "secondary" : "ghost"
                }
                className={cn(
                  "w-full justify-start gap-3",
                  location.pathname === item.href && "bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        <Separator className="my-4 bg-border" />

        <div className="space-y-1">
          <p className="px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Settings
          </p>
          {settingsItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button
                variant={
                  location.pathname === item.href ? "secondary" : "ghost"
                }
                className={cn(
                  "w-full justify-start gap-3",
                  location.pathname === item.href && "bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/20"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
