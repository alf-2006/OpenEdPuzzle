"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, PlusCircle, Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { joinClassByCode } from "@/lib/supabase/rpc";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function JoinClassPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError("يرجى إدخال رمز الانضمام");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await joinClassByCode(cleanCode);
      toast.success("تم الانضمام إلى الصف بنجاح!");
      router.push("/app/student/classes");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("Invalid join code") || err?.message?.includes("not found")) {
        setError("رمز الانضمام غير صحيح أو أن الصف غير متاح.");
      } else if (err?.message?.includes("already a member")) {
        setError("أنت منضم بالفعل إلى هذا الصف.");
      } else {
        setError(err?.message || "فشل الانضمام إلى الصف. يرجى التأكد من الرمز والمحاولة مجدداً.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-6" dir="rtl">
      {/* Back button */}
      <Link
        href="/app/student/classes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة إلى صفوفي</span>
      </Link>

      <Card className="rounded-3xl border border-border/80 shadow-2xl bg-card">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">الانضمام إلى صف دراسي</CardTitle>
          <CardDescription>
            أدخل رمز الصف الذي شاركه معك معلمك (مكون من 6 إلى 8 أحرف أو أرقام).
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="joinCode">رمز الانضمام (Join Code)</Label>
              <Input
                id="joinCode"
                required
                dir="ltr"
                maxLength={12}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="مثال: PHY101 أو AB12CD"
                className="h-14 text-center font-mono font-black text-xl tracking-[0.25em] uppercase rounded-2xl border-2 focus-visible:ring-primary"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري التحقق والانضمام...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>انضمام للصف الآن</span>
                </>
              )}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
