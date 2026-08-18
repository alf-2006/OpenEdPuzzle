"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function NewClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("يرجى إدخال اسم الصف");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("يرجى تسجيل الدخول أولاً");
        return;
      }

      // Generate clean 6-character random uppercase join code
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase
        .from("classes")
        .insert({
          teacher_id: user.id,
          name: name.trim(),
          join_code: randomCode,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`تم إنشاء الصف "${name}" بنجاح! رمز الانضمام: ${data.join_code}`);
      router.push("/app/teacher/classes");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "فشل إنشاء الصف الدراسـي");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      {/* Back button */}
      <Link
        href="/app/teacher/classes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة إلى قائمة الصفوف</span>
      </Link>

      <Card className="rounded-3xl border border-border/80 shadow-xl bg-card">
        <CardHeader className="pb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <CardTitle className="text-2xl font-bold">إنشاء صف دراسي جديد</CardTitle>
          <CardDescription>
            سيتم إنشاء رمز انضمام فريد تلقائياً لمشاركته مع طلابك.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="className">اسم الصف الدراسي *</Label>
              <Input
                id="className"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: فيزياء الصف الأول الثانوي - المجموعة أ"
                className="h-11 rounded-xl"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="classDesc">وصف الصف (اختياري)</Label>
              <Textarea
                id="classDesc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ملاحظات حول المنهج أو جدول الحصص..."
                className="rounded-xl resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                href="/app/teacher/classes"
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>إنشاء الصف</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
