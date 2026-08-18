"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Film, Loader2, Plus, CheckCircle2, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();

  // If it's already an 11-char alphanumeric ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }

  // youtu.be/ID
  const shortMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/watch?v=ID
  const watchMatch = clean.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtube.com/embed/ID or /shorts/ID or /v/ID
  const pathMatch = clean.match(/youtube\.com\/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
  if (pathMatch) return pathMatch[1];

  return null;
}

export default function NewVideoPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [maxRate, setMaxRate] = useState(2.0);
  const [loading, setLoading] = useState(false);

  const videoId = useMemo(() => extractYouTubeId(url), [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("يرجى إدخال عنوان الفيديو");
      return;
    }
    if (!videoId) {
      toast.error("يرجى إدخال رابط YouTube صالح");
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

      const durationSeconds = Math.max(10, Math.round(durationMinutes * 60));

      const { data, error } = await supabase
        .from("videos")
        .insert({
          teacher_id: user.id,
          source: "youtube",
          external_id: videoId,
          title: title.trim(),
          duration_seconds: durationSeconds,
          max_playback_rate: maxRate,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes("unique") || error.code === "23505") {
          toast.error("هذا الفيديو مضاف بالفعل في مكتبتك!");
        } else {
          throw error;
        }
        return;
      }

      toast.success("تمت إضافة الفيديو بنجاح إلى مكتبتك!");
      router.push("/app/teacher/videos");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "فشل حفظ الفيديو");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* Back button */}
      <Link
        href="/app/teacher/videos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة إلى مكتبة الفيديوهات</span>
      </Link>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Left: Form (7 cols) */}
        <div className="md:col-span-7">
          <Card className="rounded-3xl border border-border/80 shadow-xl bg-card">
            <CardHeader className="pb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Film className="w-5 h-5" />
              </div>
              <CardTitle className="text-2xl font-bold">إضافة فيديو من YouTube</CardTitle>
              <CardDescription>
                أدخل رابط الفيديو وسيتم استخراج المعرّف وإتاحته لإدراج الأسئلة.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="videoTitle">عنوان الفيديو *</Label>
                  <Input
                    id="videoTitle"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: شرح قوانين نيوتن للحركة بالتفصيل"
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* YouTube URL */}
                <div className="space-y-1.5">
                  <Label htmlFor="youtubeUrl">رابط فيديو YouTube *</Label>
                  <Input
                    id="youtubeUrl"
                    type="url"
                    dir="ltr"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="h-11 rounded-xl text-left font-sans"
                  />
                  {videoId && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تم التعرف على معرّف الفيديو: {videoId}</span>
                    </p>
                  )}
                </div>

                {/* Duration in Minutes */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="duration">المدة التقديرية (بالدقائق)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={1}
                      max={300}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="maxRate">أقصى سرعة تشغيل مسموحة</Label>
                    <Input
                      id="maxRate"
                      type="number"
                      step={0.25}
                      min={1.0}
                      max={4.0}
                      value={maxRate}
                      onChange={(e) => setMaxRate(Number(e.target.value))}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <Link
                    href="/app/teacher/videos"
                    className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    إلغاء
                  </Link>
                  <button
                    type="submit"
                    disabled={loading || !videoId}
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
                        <span>إضافة الفيديو</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview (5 cols) */}
        <div className="md:col-span-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground">معاينة مشغل YouTube المباشر</h3>
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-border shadow-md relative flex items-center justify-center">
            {videoId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                title="معاينة فيديو YouTube"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center p-6 space-y-2 text-muted-foreground">
                <Play className="w-10 h-10 opacity-30 mx-auto" />
                <p className="text-xs">أدخل رابط YouTube صالح لتظهر المعاينة هنا</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
