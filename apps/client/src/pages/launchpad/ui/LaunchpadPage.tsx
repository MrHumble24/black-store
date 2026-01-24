import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Scan,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  RotateCcw,
  Receipt,
  TrendingUp,
  Users,
  Tags,
  Layers,
  Search,
  LayoutDashboard,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { Card, CardContent } from "@/shared/ui/card";

export default function LaunchpadPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const modules = [
    {
      title: t("common.pos"),
      icon: Scan,
      href: "/pos",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      desc: "Process customer transactions",
    },
    {
      title: t("common.dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-blue-600",
      bg: "bg-blue-600/10",
      desc: "Business health overview",
    },
    {
      title: t("common.products"),
      icon: Package,
      href: "/products",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      desc: "Manage catalog & variants",
    },
    {
      title: t("common.inventory"),
      icon: Warehouse,
      href: "/inventory",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      desc: "Stock levels & warehouses",
    },
    {
      title: t("common.sales"),
      icon: ShoppingCart,
      href: "/sales",
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      desc: "Order history & invoices",
    },
    {
      title: t("common.purchases"),
      icon: Truck,
      href: "/purchases",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      desc: "Supplier orders & tracking",
    },
    {
      title: t("common.returns"),
      icon: RotateCcw,
      href: "/returns",
      color: "text-red-500",
      bg: "bg-red-500/10",
      desc: "Customer & supplier returns",
    },
    {
      title: t("common.expenses"),
      icon: Receipt,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      href: "/expenses",
      desc: "Track business spending",
    },
    {
      title: t("common.reports"),
      icon: TrendingUp,
      href: "/reports",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      desc: "Financial analytics & KPIs",
    },
    {
      title: t("common.users"),
      icon: Users,
      href: "/settings/users",
      color: "text-slate-500",
      bg: "bg-slate-500/10",
      desc: "Staff accounts & roles",
    },
    {
      title: t("common.providers"),
      icon: Truck,
      href: "/settings/providers",
      color: "text-emerald-600",
      bg: "bg-emerald-600/10",
      desc: "Manage suppliers",
    },
    {
      title: t("common.brands"),
      icon: Tags,
      href: "/settings/brands",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      desc: "Product manufacturers",
    },
    {
      title: t("common.categories"),
      icon: Layers,
      href: "/settings/categories",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      desc: "Classification hierarchy",
    },
    {
      title: t("common.warehouses"),
      icon: Warehouse,
      href: "/settings/warehouses",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      desc: "Multi-location storage",
    },
  ];

  const filteredModules = modules.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.desc.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black italic tracking-tighter uppercase text-foreground">
          {t("launchpad.title")} <span className="text-primary">OS</span>
        </h1>
        <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">
          {t("launchpad.subtitle")}
        </p>
      </div>

      <div className="relative max-w-xl mx-auto group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder={t("launchpad.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-14 bg-card border-border rounded-2xl text-lg font-bold shadow-2xl focus:ring-primary/20 placeholder:text-muted-foreground/40"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredModules.map((m) => (
          <Link key={m.href} to={m.href} className="group">
            <Card
              className={cn(
                "h-full border-border hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden",
                "bg-card/40 hover:bg-card hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-2",
              )}
            >
              <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                <div
                  className={cn(
                    "p-5 rounded-3xl transition-transform group-hover:rotate-6 group-hover:scale-110",
                    m.bg,
                  )}
                >
                  <m.icon className={cn("h-10 w-10", m.color)} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors uppercase italic">
                    {m.title}
                  </h3>
                  <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-tight leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
