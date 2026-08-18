"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowRight, Copy, Check, Users, Video, PlusCircle, Calendar, ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getInitials } from "@/lib/avatar-utils";
import { getStableColor } from "@/lib/design-utils";

interface StudentItem {
  id: string;
  name: string;
  enrolled_at: string;
}

interface AssignmentItem {
  id: string;
  title: string;
  created_at: string;
  due_at: string | null;
  lesson_version_id: string | null;
}

export default function ClassDetailsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const resolvedParams = use(params);
  const classId = resolvedParams.classId;

  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        // 1. Fetch Class
        const { data: cls, error: clsError } = await supabase
          .from("classes")
          .select("*")
          .eq("id", classId)
          .single();

        if (clsError) throw clsError;
        setClassData(cls);

        // 2. Fetch Members
        const { data: members, error: memError } = await supabase
          .from("class_members")
          .select(`
            enrolled_at,
            profiles (id, full_name)
          `)
          .eq("class_id", classId);

        if (!memError && members) {
          const formattedStudents: StudentItem[] = members.map((m: any) => ({
            id: m.profiles?.id || "",
            name: m.profiles?.full_name || "طالب بدون اسم",
            enrolled_at: m.enrolled_at,
          }));
          setStudents(formattedStudents);
        }

        // 3. Fetch Assignments
        const { data: assignData, error: assignError } = await supabase
          .from("assignments")
          .select(`
            id,
            created_at,
            due_at,
            lesson_version_id,
            videos (title)
          `)
          .eq("class_id", classId)
          .order("created_at", { ascending: false });

        if (!assignError && assignData) {
          const formattedAssignments: AssignmentItem[] = assignData.map((a: any) => ({
            id: a.id,
            title: a.videos?.title || "درس تفاعلي",
            created_at: a.created_at,
            due_at: a.due_at,
            lesson_version_id: a.lesson_version_id,
          }));
          setAssignments(formattedAssignments);
        }
      } catch (err: any) {
        console.error(err);
        toast.error("فشل تحميل بيانات الصف");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const copyCode = () => {
    if (!classData?.join_code) return;
    navigator.clipboard.writeText(classData.join_code);
    setCopied(true);
    toast.success(`تم نسخ رمز الانضمام (${classData.join_code})`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-20 space-y-3" dir="rtl">
        <h2 className="text-xl font-bold">لم يتم العثور على الصف الدراسي</h2>
        <Link href="/app/teacher/classes" className="text-primary hover:underline text-sm">
          العودة لقائمة الصفوف
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8" dir="rtl">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Link
          href="/app/teacher/classes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لكل الصفوف</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border/80 shadow-sm">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">{classData.name}</h1>
            <p className="text-xs text-muted-foreground">
              تاريخ الإنشاء: {new Date(classData.created_at).toLocaleDateString("ar-EG")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/60 border border-border/60 px-4 py-2 rounded-2xl">
              <span className="text-xs text-muted-foreground font-medium">رمز الانضمام:</span>
              <span className="font-mono font-black text-primary text-base tracking-wider">
                {classData.join_code}
              </span>
              <button
                onClick={copyCode}
                className="p-1 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                title="نسخ الرمز"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <Link
              href={`/app/teacher/lessons?assignClassId=${classId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تعيين درس</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Assignments & Students */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left (8 cols): Assignments */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Video className="w-5 h-5 text-accent" />
              <span>التعيينات والدروس المسندة</span>
            </h2>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              {assignments.length} درس
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-border text-center bg-card/40 space-y-3">
              <Video className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">لا توجد تعيينات مسندة لهذا الصف حتى الآن.</p>
              <Link
                href="/app/teacher/lessons"
                className="inline-block text-xs font-bold text-primary hover:underline"
              >
                تصفح الدروس التفاعلية لتعيينها ←
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl border border-border/80 bg-card hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground">{a.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>تم الإنشاء: {new Date(a.created_at).toLocaleDateString("ar-EG")}</span>
                      </span>
                      {a.due_at && (
                        <span>موعد التسليم: {new Date(a.due_at).toLocaleDateString("ar-EG")}</span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/app/teacher/assignments/${a.id}`}
                    className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-muted/80 hover:bg-muted text-foreground text-xs font-bold transition-colors shrink-0"
                  >
                    <span>عرض نتائج الطلاب</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right (4 cols): Students Roster */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>الطلاب المسجلون</span>
            </h2>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              {students.length} طالب
            </span>
          </div>

          {students.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-border text-center bg-card/40 space-y-2">
              <Users className="w-7 h-7 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">
                لم ينضم أي طالب بعد. شارك رمز الانضمام ({classData.join_code}) مع طلابك.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden">
              {students.map((s) => (
                <div key={s.id} className="p-3 flex items-center gap-3">
                  <Avatar
                    className="h-8 w-8 shrink-0"
                    style={{ backgroundColor: getStableColor(s.id) }}
                  >
                    <AvatarFallback className="text-white font-semibold text-xs">
                      {getInitials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      انضم في: {new Date(s.enrolled_at).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
