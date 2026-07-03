import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar, SidebarContent } from "./Sidebar";
import { TabBar } from "./TabBar";
import { Toaster } from "@/shared/ui/sonner";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/shared/ui/sheet";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useLayoutStore } from "@/shared/model/layout.store";

export function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { isSidebarCollapsed, toggleSidebar } = useLayoutStore();

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile Header */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 lg:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">B</span>
          </div>
          <span className="font-bold text-foreground">Black Store</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-none w-72 bg-card">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent onItemClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <div className="relative hidden lg:block h-screen shrink-0 overflow-y-auto no-scrollbar">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <Button
          variant="secondary"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border shadow-md z-50 hover:bg-primary hover:text-primary-foreground transition-all"
          onClick={toggleSidebar}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TabBar />
        <main className="flex-1 overflow-auto relative bg-muted/20">
          <div className=" mx-auto p-4 md:p-6 lg:p-8 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
