"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/use-app-store";
import {
  BookOpen,
  Video,
  BarChart3,
  GraduationCap,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  PlusCircle,
  Film,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logout } from "@/lib/actions/auth";
import { toast } from "sonner";
import { getInitials } from "@/lib/avatar-utils";
import { getStableColor } from "@/lib/design-utils";

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { role, displayName, userId } = useAppStore();
  const clearUser = useAppStore((state) => state.clearUser);

  const handleLogout = async () => {
    try {
      clearUser();
      await logout();
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      toast.error("فشل تسجيل الخروج");
      console.error("Logout error:", error);
    }
  };

  const teacherLinks = [
    { href: "/app/teacher/dashboard", icon: LayoutDashboard, label: "لوحة التحكم" },
    { href: "/app/teacher/classes", icon: BookOpen, label: "الصفوف الدراسية" },
    { href: "/app/teacher/lessons", icon: Video, label: "الدروس التفاعلية" },
    { href: "/app/teacher/videos", icon: Film, label: "مكتبة الفيديوهات" },
    { href: "/app/teacher/analytics", icon: BarChart3, label: "النتائج والتحليلات" },
  ];

  const studentLinks = [
    { href: "/app/student/dashboard", icon: LayoutDashboard, label: "لوحة الطالب" },
    { href: "/app/student/classes", icon: GraduationCap, label: "صفوفي" },
    { href: "/app/student/join", icon: PlusCircle, label: "الانضمام لصف" },
    { href: "/app/student/progress", icon: TrendingUp, label: "سجل التقدم" },
  ];

  const links = role === "teacher" ? teacherLinks : studentLinks;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col border-r bg-card select-none"
    >
      {/* Logo + Collapse Toggle */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/app" className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shrink-0 shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-black text-lg whitespace-nowrap overflow-hidden tracking-tight"
              >
                <span className="text-primary">Open</span>
                <span className="text-foreground">EdPuzzle</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Collapse Button */}
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapse(!collapsed)}
            className="shrink-0 h-8 w-8 rounded-lg"
          >
            {collapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/app/teacher/dashboard" && link.href !== "/app/student/dashboard" && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all group",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-sidebar-indicator"
                  className="absolute right-0 top-1 bottom-1 w-1 bg-accent rounded-l"
                  transition={{ duration: 0.2 }}
                />
              )}

              {/* Icon */}
              <Icon className="h-4 w-4 shrink-0" />

              {/* Label */}
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap overflow-hidden truncate"
                  >
                    {link.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute right-full mr-2 px-2.5 py-1 bg-popover text-popover-foreground text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
                  {link.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t p-3 space-y-1">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-muted/50",
            collapsed && "justify-center p-1"
          )}
        >
          <Avatar
            className="h-9 w-9 shrink-0 border border-border/50"
            style={{ backgroundColor: getStableColor(userId || "default") }}
          >
            <AvatarFallback className="text-white font-semibold text-xs">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <div className="text-sm font-semibold truncate text-foreground">
                  {displayName || "المستخدم"}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  {role === "teacher" ? "معلم" : role === "student" ? "طالب" : "جاري التحميل..."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-9",
            collapsed && "justify-center px-0"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden text-xs font-semibold"
              >
                تسجيل الخروج
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </motion.aside>
  );
}
