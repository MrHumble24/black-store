import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/shared/ui/sonner";

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-auto border-l border-border">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
