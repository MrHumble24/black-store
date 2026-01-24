import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/entities/user/model/auth.store";
import {
  Home,
  Activity,
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
import { LanguageSwitcher } from "@/features/language-switcher/ui/LanguageSwitcher";

export function SidebarContent({
  onItemClick,
  isCollapsed,
}: {
  onItemClick?: () => void;
  isCollapsed?: boolean;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { label: t("common.home"), icon: Home, href: "/" },
    { label: t("common.dashboard"), icon: Activity, href: "/dashboard" },
    { label: t("common.pos"), icon: Scan, href: "/pos" },
    { label: t("common.products"), icon: Package, href: "/products" },
    { label: t("common.inventory"), icon: Warehouse, href: "/inventory" },
    { label: t("common.sales"), icon: ShoppingCart, href: "/sales" },
    { label: t("common.purchases"), icon: Truck, href: "/purchases" },
    { label: t("common.returns"), icon: RotateCcw, href: "/returns" },
    { label: t("common.expenses"), icon: Receipt, href: "/expenses" },
    { label: t("common.reports"), icon: TrendingUp, href: "/reports" },
  ];

  const settingsItems = [
    { label: t("common.users"), icon: Users, href: "/settings/users" },
    {
      label: t("common.warehouses"),
      icon: Warehouse,
      href: "/settings/warehouses",
    },
    { label: t("common.brands"), icon: Tags, href: "/settings/brands" },
    {
      label: t("common.categories"),
      icon: Layers,
      href: "/settings/categories",
    },
    { label: t("common.providers"), icon: Truck, href: "/settings/providers" },
    { label: t("common.backup"), icon: ShieldCheck, href: "/settings/backup" },
  ];

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
        {!isCollapsed && (
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        )}
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
                  location.pathname === item.href && "bg-secondary",
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
              {t("common.settings")}
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
                  location.pathname === item.href && "bg-secondary",
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
            isCollapsed && "px-2 justify-center",
          )}
          onClick={logout}
          title={isCollapsed ? t("common.logout") : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <span className="truncate">{t("common.logout")}</span>
          )}
        </Button>
      </div>
    </div>
  );
}
