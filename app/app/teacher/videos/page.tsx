"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Film, PlusCircle, Play, Clock, Zap, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface VideoItem {
  id: string;
  title: string;
  source: string;
  external_id: string;
  duration_seconds: number;
  max_playback_rate: number;
  created_at: string;
}

export default function TeacherVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("videos")
          .select("*")
          .eq("teacher_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setVideos(data || []);
      } catch (err: any) {
        console.error(err);
        toast.error("فشل تحميل قائمة الفيديوهات");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const formatDuration = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const remainingSec = Math.floor(sec % 60);
    return `${minutes}:${remainingSec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            مكتبة الفيديوهات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إضافة وإدارة فيديوهات YouTube لتضمين أسئلة تفاعلية عليها.
          </p>
        </div>

        <Link
          href="/app/teacher/videos/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 shadow-md transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إضافة فيديو من YouTube</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">جاري تحميل الفيديوهات...</span>
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card/40 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Film className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-foreground">لا توجد فيديوهات في مكتبتك بعد</h3>
            <p className="text-sm text-muted-foreground">
              أضف أي رابط من YouTube للبدء في تحويله إلى درس تفاعلي بالأسئلة والمحطات الزمنية.
            </p>
          </div>
          <Link
            href="/app/teacher/videos/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة أول فيديو</span>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((v) => {
            const youtubeThumb = `https://img.youtube.com/vi/${v.external_id}/hqdefault.jpg`;

            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="h-full border border-border/80 bg-card hover:shadow-xl transition-all rounded-3xl overflow-hidden flex flex-col justify-between group">
                  <div>
                    {/* Thumbnail */}
                    <div className="aspect-video w-full relative bg-slate-950 overflow-hidden">
                      <img
                        src={youtubeThumb}
                        alt={v.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as any).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60";
                        }}
                      />
                      {/* Duration overlay */}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[11px] font-mono font-medium backdrop-blur-sm flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>{formatDuration(v.duration_seconds)}</span>
                      </div>

                      {/* Speed badge */}
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-emerald-400 text-[10px] font-mono border border-white/10 backdrop-blur-sm">
                        Max {v.max_playback_rate}x
                      </div>
                    </div>

                    <CardContent className="p-5 space-y-2">
                      <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2">
                        {v.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        YouTube ID: {v.external_id}
                      </p>
                    </CardContent>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-muted/20 border-t border-border/60 flex items-center justify-between">
                    <Link
                      href={`/app/teacher/lessons/new?sourceUrl=https://www.youtube.com/watch?v=${v.external_id}&title=${encodeURIComponent(v.title)}`}
                      className="w-full py-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold text-xs text-center transition-all"
                    >
                      إنشاء درس تفاعلي من هذا الفيديو ←
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
