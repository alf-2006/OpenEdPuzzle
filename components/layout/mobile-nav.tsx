"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/use-app-store";
import {
  BookOpen,
  Video,
  BarChart3,
  GraduationCap,
  TrendingUp,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { logout } from "@/lib/actions/auth";
import { toast } from "sonner";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const role = useAppStore((state) => state.role);
  const clearUser = useAppStore((state) => state.clearUser);

  const handleLogout = async () => {
    try {
      clearUser();
      onOpenChange(false);
      await logout();
    } catch (error) {
      toast.error("Failed to logout");
      console.error("Logout error:", error);
    }
  };

  const teacherLinks = [
    { href: "/app/classes", icon: BookOpen, label: "Classes" },
    { href: "/app/videos", icon: Video, label: "Videos" },
    { href: "/app/analytics", icon: BarChart3, label: "Analytics" },
  ];

  const studentLinks = [
    { href: "/app/classes", icon: GraduationCap, label: "My Classes" },
    { href: "/app/progress", icon: TrendingUp, label: "My Progress" },
  ];

  const links = role === "teacher" ? teacherLinks : studentLinks;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle>
            <Link
              href="/app"
              className="flex items-center gap-2"
              onClick={() => onOpenChange(false)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                W
              </div>
              <span className="font-semibold text-lg">WaslaLearn</span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
