"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { publishLessonVersion } from "@/lib/actions/lesson";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";

export default function NewAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonVersionId = searchParams.get("lesson_version_id");
  
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonVersionId) {
      router.push("/app/teacher/lessons");
      return;
    }
    
    const fetchClasses = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .order("created_at", { ascending: false });
        
      if (data) {
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].id);
      }
      setIsLoading(false);
    };
    
    fetchClasses();
  }, [lessonVersionId, router]);

  const handlePublish = async () => {
    if (!selectedClassId || !lessonVersionId) return;
    setIsPublishing(true);
    setError(null);
    try {
      await publishLessonVersion(lessonVersionId, selectedClassId);
      router.push(`/app/teacher/classes/${selectedClassId}`);
    } catch (err: any) {
      setError(err.message || "Failed to publish and assign.");
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="space-y-2 text-center"
      >
        <h1 className="text-4xl font-bold tracking-tight">Publish & Assign</h1>
        <p className="text-muted-foreground text-lg">
          Select a class to assign this lesson to. The lesson will become read-only after publishing.
        </p>
      </motion.div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        <GlassCard className="p-8 border-primary/20 bg-background/50 backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-4">Select Class</h2>
          
          <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2">
            {classes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">You don't have any classes yet. Create one first.</p>
            ) : (
              classes.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedClassId === c.id 
                      ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]' 
                      : 'border-white/10 hover:border-white/30 bg-black/20'
                  } flex items-center justify-between`}
                >
                  <span className="font-medium text-lg">{c.name}</span>
                  {selectedClassId === c.id && <CheckCircle2 className="w-6 h-6 text-primary" />}
                </div>
              ))
            )}
          </div>

          {error && <p className="text-destructive mb-4 text-center">{error}</p>}

          <Button 
            onClick={handlePublish}
            disabled={isPublishing || !selectedClassId || classes.length === 0}
            className="w-full h-14 text-lg rounded-xl bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02]"
          >
            {isPublishing ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Publishing...</>
            ) : (
              <>Publish Lesson & Assign to Class <ArrowRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </GlassCard>
      </motion.div>
    </div>
  );
}
