"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/use-app-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useAppStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        if (pathname !== "/app/login" && pathname !== "/app/register") {
          router.replace("/login");
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, display_name")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUser({
          userId: session.user.id,
          role: profile.role as "teacher" | "student",
          displayName: profile.display_name,
        });
      }

      setLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== "/app/login" && pathname !== "/app/register") {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setUser, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm font-medium text-muted-foreground font-mono">OpenEdPuzzle...</span>
        </div>
      </div>
    );
  }

  const isAuthPage = pathname === "/app/login" || pathname === "/app/register";
  const isWatchPage = pathname.startsWith("/app/watch");

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground" dir="rtl">
      {/* Desktop Sidebar */}
      {!isAuthPage && !isWatchPage && (
        <div className="hidden md:block shrink-0">
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
          />
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {!isAuthPage && !isWatchPage && (
        <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {!isAuthPage && !isWatchPage && (
          <Navbar
            showMenuButton
            onMenuClick={() => setMobileNavOpen(true)}
          />
        )}

        {/* Content with Page Transitions */}
        <main className={`flex-1 overflow-y-auto ${isAuthPage || isWatchPage ? '' : 'p-4 md:p-6 pb-20 md:pb-6'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={isAuthPage || isWatchPage ? "h-full" : ""}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation */}
        {!isAuthPage && !isWatchPage && <MobileBottomNav />}
      </div>

      <Toaster richColors position="top-center" />
    </div>
  );
}
