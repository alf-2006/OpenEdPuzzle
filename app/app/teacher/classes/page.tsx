"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, PlusCircle, Copy, Check, Users, Video, Archive, ChevronLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface ClassItem {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
  archived_at: string | null;
  student_count?: number;
  assignment_count?: number;
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          join_code,
          created_at,
          archived_at,
          class_members (count),
          assignments (count)
        `)
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted: ClassItem[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        join_code: c.join_code,
        created_at: c.created_at,
        archived_at: c.archived_at,
        student_count: c.class_members?.[0]?.count || 0,
        assignment_count: c.assignments?.[0]?.count || 0,
      }));

      setClasses(formatted);
    } catch (err: any) {
      console.error(err);
      toast.error("فشل تحميل قائمة الصفوف");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const copyJoinCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`تم نسخ رمز الانضمام (${code}) إلى الحافظة`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleArchive = async (id: string, currentlyArchived: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("classes")
        .update({ archived_at: currentlyArchived ? null : new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentlyArchived ? "تم استعادة الصف" : "تم أرشفة الصف");
      fetchClasses();
    } catch (err: any) {
      toast.error("فشل تعديل حالة الصف");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            الصفوف الدراسية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة مجموعات الطلاب ومشاركة رموز الانضمام ومتابعة المهام.
          </p>
        </div>

        <Link
          href="/app/teacher/classes/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 shadow-md transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إنشاء صف جديد</span>
        </Link>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">جاري تحميل الصفوف...</span>
        </div>
      ) : classes.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card/40 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-foreground">لا توجد صفوف دراسية بعد</h3>
            <p className="text-sm text-muted-foreground">
              أنشئ صفك الأول الآن وشارك رمز الانضمام مع طلابك للبدء في تعيين الدروس التفاعلية.
            </p>
          </div>
          <Link
            href="/app/teacher/classes/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إنشاء أول صف دراسي</span>
          </Link>
        </div>
      ) : (
        /* Grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className={`h-full border border-border/80 bg-card hover:shadow-lg transition-all rounded-2xl flex flex-col justify-between overflow-hidden ${c.archived_at ? 'opacity-60 bg-muted/30' : ''}`}>
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-foreground leading-tight line-clamp-1">
                      {c.name}
                    </h3>
                    {c.archived_at && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                        مؤرشف
                      </span>
                    )}
                  </div>

                  {/* Join Code Box */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border/60 text-xs">
                    <span className="text-muted-foreground font-medium">رمز الانضمام:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-primary tracking-wider text-sm">
                        {c.join_code}
                      </span>
                      <button
                        onClick={() => copyJoinCode(c.join_code, c.id)}
                        className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                        title="نسخ الرمز"
                      >
                        {copiedId === c.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/50 border border-border/40">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span>{c.student_count} طالب</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/50 border border-border/40">
                      <Video className="w-3.5 h-3.5 text-accent" />
                      <span>{c.assignment_count} تعيين</span>
                    </div>
                  </div>
                </CardContent>

                {/* Footer Actions */}
                <div className="px-5 py-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleArchive(c.id, !!c.archived_at)}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{c.archived_at ? "استعادة" : "أرشفة"}</span>
                  </button>

                  <Link
                    href={`/app/teacher/classes/${c.id}`}
                    className="font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>عرض التفاصيل</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
