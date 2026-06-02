import { ReactNode, useState } from "react";
import { Helmet } from "react-helmet-async";
import { AdminSidebar } from "./AdminSidebar";
import { AdminGuard } from "../AdminGuard";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminGuard>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="flex min-h-screen bg-gray-50/50">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 lg:static lg:z-auto
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <AdminSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <div className="lg:hidden sticky top-0 z-30 bg-white border-b px-4 h-14 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-serif font-bold text-lg">Vectric Admin</span>
          </div>

          <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
