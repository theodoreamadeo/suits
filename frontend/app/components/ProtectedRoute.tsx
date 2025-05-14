"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow landing page (/) for everyone
    if (pathname === "/") return;
    // Redirect if not logged in and not loading
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router, pathname]);

  // Show spinner while loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="mb-4 animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        <div className="text-2xl font-bold text-blue-800 tracking-tight">
          SUITS
        </div>
      </div>
    );
  }

  if (!user && pathname !== "/") {
    return null;
  }

  return <>{children}</>;
}
