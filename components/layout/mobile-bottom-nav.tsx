"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/use-app-store";
import {
  BookOpen,
  Video,
  BarChart3,
  GraduationCap,
  TrendingUp,
  LayoutDashboard,
  PlusCircle,
  Film,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const role = useAppStore((state) => state.role);

  const teacherTabs = [
    { href: "/app/teacher/dashboard", icon: LayoutDashboard, label: "الرئيسية" },
    { href: "/app/teacher/classes", icon: BookOpen, label: "الصفوف" },
    { href: "/app/teacher/lessons", icon: Video, label: "الدروس" },
    { href: "/app/teacher/videos", icon: Film, label: "الفيديوهات" },
    { href: "/app/teacher/analytics", icon: BarChart3, label: "النتائج" },
  ];

  const studentTabs = [
    { href: "/app/student/dashboard", icon: LayoutDashboard, label: "الرئيسية" },
    { href: "/app/student/classes", icon: GraduationCap, label: "صفوفي" },
    { href: "/app/student/join", icon: PlusCircle, label: "انضمام" },
    { href: "/app/student/progress", icon: TrendingUp, label: "التقدم" },
  ];

  const tabs = role === "teacher" ? teacherTabs : studentTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 select-none" dir="rtl">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== "/app/teacher/dashboard" && tab.href !== "/app/student/dashboard" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[56px]",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="mobile-active-tab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ duration: 0.2 }}
                />
              )}

              {/* Icon */}
              <Icon className={cn("h-5 w-5 relative z-10", isActive && "text-primary")} />

              {/* Label */}
              <span className={cn(
                "text-[10px] relative z-10 whitespace-nowrap",
                isActive && "text-primary font-bold"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
