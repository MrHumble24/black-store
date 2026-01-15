import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar, SidebarContent } from "./Sidebar";
import { Toaster } from "@/shared/ui/sonner";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Menu } from "lucide-react";

export function DashboardLayout() {
  const [open, setOpen] = useState(false);

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
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 min-h-full">
          <Outlet />
        </div>
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
}
