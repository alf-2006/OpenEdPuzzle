"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, PlusCircle, Video, Play, Calendar, User, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface StudentClass {
  id: string;
  name: string;
  join_code: string;
  teacher_name: string;
  enrolled_at: string;
  assignments: {
    id: string;
    title: string;
    duration_seconds: number;
    due_at: string | null;
  }[];
}

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentClasses = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch memberships
        const { data: memberships, error: memError } = await supabase
          .from("class_members")
          .select(`
            enrolled_at,
            classes (
              id,
              name,
              join_code,
              teacher_id,
              profiles (full_name),
              assignments (
                id,
                due_at,
                videos (title, duration_seconds)
              )
            )
          `)
          .eq("student_id", user.id)
          .order("enrolled_at", { ascending: false });

        if (memError) throw memError;

        const formatted: StudentClass[] = (memberships || [])
          .map((m: any) => {
            const cls = m.classes;
            if (!cls) return null;
            return {
              id: cls.id,
              name: cls.name,
              join_code: cls.join_code,
              teacher_name: cls.profiles?.full_name || "معلم الصف",
              enrolled_at: m.enrolled_at,
              assignments: (cls.assignments || []).map((a: any) => ({
                id: a.id,
                title: a.videos?.title || "درس تفاعلي",
                duration_seconds: a.videos?.duration_seconds || 0,
                due_at: a.due_at,
              })),
            };
          })
          .filter(Boolean) as StudentClass[];

        setClasses(formatted);
      } catch (err: any) {
        console.error(err);
        toast.error("فشل تحميل قائمة الصفوف");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentClasses();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            صفوفي الدراسية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            الصفوف التي انضممت إليها والدروس التفاعلية المسندة لك.
          </p>
        </div>

        <Link
          href="/app/student/join"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 shadow-md transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>الانضمام إلى صف جديد</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">جاري تحميل صفوفك...</span>
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card/40 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-foreground">لم تنضم إلى أي صف بعد</h3>
            <p className="text-sm text-muted-foreground">
              اطلب رمز الانضمام المكوّن من 6 إلى 8 أحرف من معلمك للانضمام ومتابعة دروسك.
            </p>
          </div>
          <Link
            href="/app/student/join"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إدخال رمز الانضمام</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {classes.map((cls) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-5"
            >
              {/* Class Top bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-foreground">{cls.name}</h2>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>المعلم: {cls.teacher_name}</span>
                    </span>
                    <span>•</span>
                    <span>رمز الصف: <span className="font-mono font-bold text-foreground">{cls.join_code}</span></span>
                  </div>
                </div>

                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary self-start sm:self-center">
                  {cls.assignments.length} دروس مسندة
                </span>
              </div>

              {/* Assignments list */}
              {cls.assignments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">لا توجد دروس أو واجبات مسندة لهذا الصف حالياً.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cls.assignments.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                          <Video className="w-3.5 h-3.5" />
                          <span>درس تفاعلي</span>
                        </div>
                        <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                          {a.title}
                        </h3>
                        {a.due_at && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>موعد التسليم: {new Date(a.due_at).toLocaleDateString("ar-EG")}</span>
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/app/watch/${a.id}`}
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:bg-primary/90 transition-all group-hover:scale-[1.02]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>بدء المشاهدة والتفاعل</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
