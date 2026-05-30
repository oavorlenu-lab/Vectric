import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminGuard } from "../AdminGuard";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50/50">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
