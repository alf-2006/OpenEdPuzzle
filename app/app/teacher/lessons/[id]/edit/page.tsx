"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";
import { createClient } from "@/lib/supabase/client";
import { addTimelineEvent } from "@/lib/actions/lesson";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { CheckCircle2, Circle, Plus, Trash2, Save, Video, ArrowRight, Play, Pause } from "lucide-react";
import { fadeInUp, slideInRight } from "@/lib/animations";

export default function LessonEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: lessonId } = use(params);
  
  const [lesson, setLesson] = useState<any>(null);
  const [version, setVersion] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [duration, setDuration] = useState(0);

  // New Question State
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    setIsLoading(true);
    const supabase = createClient();
    
    // Get lesson and version
    const { data: vData } = await supabase
      .from("lesson_versions")
      .select("*, lessons(*)")
      .eq("lesson_id", lessonId)
      .eq("status", "draft")
      .single();
      
    if (vData) {
      setVersion(vData);
      setLesson(vData.lessons);
      
      // Get events and questions
      const { data: eData } = await supabase
        .from("timeline_events")
        .select("*, questions(*, question_choices(*))")
        .eq("lesson_version_id", vData.id)
        .order("position_ms", { ascending: true });
        
      if (eData) setEvents(eData);
    }
    setIsLoading(false);
  };

  const handleProgress = (state: { played: number, playedSeconds: number }) => {
    setProgress(state.played);
  };

  const handleDuration = (d: number) => {
    setDuration(d);
  };

  const startAddingQuestion = () => {
    setPlaying(false);
    setIsAddingQuestion(true);
  };

  const handleAddChoice = () => {
    setChoices([...choices, { text: "", isCorrect: false }]);
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length <= 2) return;
    setChoices(choices.filter((_, i) => i !== index));
  };

  const handleChoiceChange = (index: number, text: string) => {
    const newChoices = [...choices];
    newChoices[index].text = text;
    setChoices(newChoices);
  };

  const handleSetCorrect = (index: number) => {
    const newChoices = choices.map((c, i) => ({ ...c, isCorrect: i === index }));
    setChoices(newChoices);
  };

  const handleSaveQuestion = async () => {
    if (!prompt || choices.some(c => !c.text) || !version) return;
    setIsSaving(true);
    
    try {
      const positionMs = Math.floor((playerRef.current?.getCurrentTime() || 0) * 1000);
      await addTimelineEvent(version.id, positionMs, prompt, choices);
      
      // Reset form & fetch
      setIsAddingQuestion(false);
      setPrompt("");
      setChoices([{ text: "", isCorrect: true }, { text: "", isCorrect: false }]);
      await fetchLessonData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center">Loading...</div>;
  if (!version) return <div className="flex h-[50vh] items-center justify-center">Draft not found.</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 h-[calc(100vh-8rem)]">
      {/* Left side: Video & Timeline */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold truncate">{lesson?.title}</h1>
            <p className="text-sm text-muted-foreground">Draft Version {version.version_no}</p>
          </div>
          <Button onClick={() => router.push(`/app/teacher/assignments/new?lesson_version_id=${version.id}`)} variant="default">
            Publish & Assign <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <GlassCard className="overflow-hidden aspect-video relative flex-shrink-0 bg-black">
          <ReactPlayer
            ref={playerRef}
            url={version.external_id}
            width="100%"
            height="100%"
            playing={playing}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onProgress={handleProgress}
            onDuration={handleDuration}
            controls
          />
        </GlassCard>

        {/* Custom Timeline visualization */}
        <GlassCard className="p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Timeline Events</span>
            <Button size="sm" variant="secondary" onClick={startAddingQuestion} disabled={isAddingQuestion}>
              <Plus className="w-4 h-4 mr-2" /> Add Question at {formatTime(playerRef.current?.getCurrentTime() || 0)}
            </Button>
          </div>
          <div className="relative h-12 bg-secondary/50 rounded-lg overflow-hidden border border-white/5">
            {/* Progress bar visual */}
            <div 
              className="absolute top-0 left-0 bottom-0 bg-primary/20 pointer-events-none" 
              style={{ width: `${progress * 100}%` }}
            />
            {/* Events markers */}
            {events.map((e, i) => {
              const posPercent = duration > 0 ? ((e.position_ms / 1000) / duration) * 100 : 0;
              return (
                <div 
                  key={e.id}
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)] cursor-pointer z-10 transform -translate-x-1/2 hover:scale-125 transition-transform"
                  style={{ left: `${posPercent}%` }}
                  title={`Question ${i + 1}`}
                  onClick={() => {
                    playerRef.current?.seekTo(e.position_ms / 1000);
                  }}
                />
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Right side: Editor Sidebar */}
      <GlassCard className="w-full lg:w-96 flex flex-col flex-shrink-0 overflow-y-auto border-l border-white/10 bg-background/50">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Interactive Elements</h2>
          
          <AnimatePresence mode="wait">
            {isAddingQuestion ? (
              <motion.div
                key="editor"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={slideInRight}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label>Question Prompt</Label>
                  <Input 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="What is the main topic here?"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Choices (Select the correct one)</Label>
                  {choices.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => handleSetCorrect(i)}
                        className={`p-2 rounded-full transition-colors ${c.isCorrect ? 'text-green-500' : 'text-muted-foreground hover:text-white'}`}
                      >
                        {c.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <Input 
                        value={c.text}
                        onChange={e => handleChoiceChange(i, e.target.value)}
                        placeholder={`Choice ${i + 1}`}
                        className="flex-1"
                      />
                      {choices.length > 2 && (
                        <button onClick={() => handleRemoveChoice(i)} className="text-destructive/70 hover:text-destructive p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddChoice} className="w-full mt-2">
                    <Plus className="w-4 h-4 mr-2" /> Add Choice
                  </Button>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setIsAddingQuestion(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveQuestion} disabled={isSaving || !prompt || choices.some(c => !c.text)} className="flex-1">
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={fadeInUp}
                className="space-y-4"
              >
                {events.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Video className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>No questions yet.</p>
                    <p className="text-sm">Pause the video and click 'Add Question'</p>
                  </div>
                ) : (
                  events.map((e, i) => (
                    <GlassCard key={e.id} className="p-4 border border-white/5 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => playerRef.current?.seekTo(e.position_ms / 1000)}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">Question {i + 1}</span>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {formatTime(e.position_ms / 1000)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2">{e.questions[0]?.prompt_json?.text}</p>
                    </GlassCard>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
