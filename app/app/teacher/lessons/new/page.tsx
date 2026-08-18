"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createLesson } from "@/lib/actions/lesson";
import { Play, ArrowRight, Loader2, Video } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { fadeInUp, staggerContainer, slideInRight } from "@/lib/animations";

export default function NewLessonPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sourceUrl) return;

    setIsLoading(true);
    setError(null);
    try {
      const { lessonId } = await createLesson(title, sourceUrl);
      router.push(`/app/teacher/lessons/${lessonId}/edit`);
    } catch (err: any) {
      setError(err.message || "Failed to create lesson.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold tracking-tight">Create New Lesson</h1>
        <p className="text-muted-foreground text-lg">
          Start by adding a YouTube video. You'll be able to add interactive questions on the next step.
        </p>
      </motion.div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <GlassCard className="p-8 border-primary/20 bg-background/50 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={slideInRight} className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Lesson Title</label>
              <Input
                id="title"
                placeholder="e.g. Introduction to Thermodynamics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 text-lg bg-background/50 border-white/10 focus-visible:ring-primary/50"
                required
              />
            </motion.div>

            <motion.div variants={slideInRight} className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">YouTube Video URL</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Video className="w-5 h-5" />
                </div>
                <Input
                  id="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="pl-10 h-12 text-lg bg-background/50 border-white/10 focus-visible:ring-primary/50"
                  required
                />
              </div>
            </motion.div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-destructive text-sm"
              >
                {error}
              </motion.p>
            )}

            <motion.div variants={fadeInUp} className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                size="lg" 
                disabled={isLoading || !title || !sourceUrl}
                className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Continue to Editor
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
