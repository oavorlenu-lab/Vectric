import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetAdminMe } from "@workspace/api-client-react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: admin, isLoading, error } = useGetAdminMe({
    query: { retry: false } as any
  });

  useEffect(() => {
    if (!isLoading && (error || !admin)) {
      setLocation("/admin/login");
    }
  }, [isLoading, error, admin, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (error || !admin) {
    return null;
  }

  return <>{children}</>;
}
