"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";
import { createClient } from "@/lib/supabase/client";
import { startWatchSession, submitHeartbeat, computeChallengeResponse } from "@/lib/supabase/rpc";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Loader2, PlayCircle, CheckCircle2 } from "lucide-react";
import { fadeInUp, slideInRight } from "@/lib/animations";

export default function WatchAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const router = useRouter();
  const { assignmentId } = use(params);
  
  const [assignment, setAssignment] = useState<any>(null);
  const [version, setVersion] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [sessionNonce, setSessionNonce] = useState<string>("");

  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

  // Heartbeat state
  const seqRef = useRef(0);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    
    // Get assignment and version
    const { data: aData, error } = await supabase
      .from("assignments")
      .select("*, lesson_versions(*, lessons(*))")
      .eq("id", assignmentId)
      .single();
      
    if (aData && aData.lesson_versions) {
      setAssignment(aData);
      setVersion(aData.lesson_versions);
      
      // Get timeline events (questions only)
      const { data: eData } = await supabase
        .from("timeline_events")
        .select("*, questions(*, question_choices(id, choice_json, sort_order))")
        .eq("lesson_version_id", aData.lesson_versions.id)
        .order("position_ms", { ascending: true });
        
      if (eData) setEvents(eData);

      // Start Session via RPC
      try {
        const clientSessionId = Math.random().toString(36).substring(7);
        const res = await startWatchSession({
          studentId: user.user?.id || "",
          assignmentId: assignmentId,
          clientSessionId,
          fingerprint: null
        });
        setSession(res);
        if (res.challenge_nonce) setSessionNonce(res.challenge_nonce);
        if (res.resume_position && playerRef.current) {
          playerRef.current.seekTo(res.resume_position);
        }
      } catch (err) {
        console.error("Failed to start session:", err);
      }
    }
    setIsLoading(false);
  };

  const sendHeartbeat = async (kind: "periodic" | "event", eventName: string | null = null) => {
    if (!session || !session.session_id || !sessionNonce) return;
    const currentPos = playerRef.current?.getCurrentTime() || 0;
    seqRef.current += 1;
    
    try {
      const challenge = await computeChallengeResponse(sessionNonce, seqRef.current, currentPos);
      const res = await submitHeartbeat({
        sessionId: session.session_id,
        seq: seqRef.current,
        position: currentPos,
        rate: playerRef.current?.getInternalPlayer()?.getPlaybackRate?.() || 1,
        clientTimestamp: new Date().toISOString(),
        kind,
        event: eventName as any,
        visibility: document.visibilityState === "visible" ? "visible" : "hidden",
        fingerprint: null,
        challengeResponse: challenge,
      });
      if (res.challenge_nonce) setSessionNonce(res.challenge_nonce);
    } catch (e) {
      console.error("Heartbeat failed", e);
    }
  };

  useEffect(() => {
    if (playing) {
      heartbeatTimerRef.current = setInterval(() => {
        sendHeartbeat("periodic");
      }, 10000);
    } else {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    }
    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [playing, session, sessionNonce]);

  const handleProgress = (state: { playedSeconds: number }) => {
    if (!playing) return;
    
    // Check if we hit a question we haven't answered
    const currentMs = state.playedSeconds * 1000;
    const triggerWindow = 1000; // 1 second window
    
    for (const evt of events) {
      if (
        evt.event_type === "question" && 
        evt.questions?.length > 0 &&
        !answeredQuestions.has(evt.id) &&
        currentMs >= evt.position_ms && 
        currentMs <= evt.position_ms + triggerWindow
      ) {
        // Trigger Question
        setPlaying(false);
        setActiveQuestion(evt);
        sendHeartbeat("event", "pause");
        break;
      }
    }
  };

  const handleStartVideo = () => {
    setHasStarted(true);
    setPlaying(true);
    sendHeartbeat("event", "play");
  };

  const submitAnswer = async (choice: any) => {
    if (!activeQuestion) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("submit_question_response", {
        p_assignment_id: assignmentId,
        p_question_id: activeQuestion.questions[0].id,
        p_response_json: choice.choice_json
      });
      
      if (!error) {
        const isCorrect = data;
        // Mark as answered
        setAnsweredQuestions(new Set(answeredQuestions).add(activeQuestion.id));
        setActiveQuestion(null);
        setPlaying(true);
        sendHeartbeat("event", "play");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (!version) return <div className="flex h-screen items-center justify-center">Assignment not found or inaccessible.</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-6 relative h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold truncate">{version.lessons?.title}</h1>
        </div>
      </div>

      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl flex-shrink-0">
        <ReactPlayer
          ref={playerRef}
          url={version.external_id}
          width="100%"
          height="100%"
          playing={playing}
          onPlay={() => { if(hasStarted) sendHeartbeat("event", "play"); setPlaying(true); }}
          onPause={() => { if(hasStarted) sendHeartbeat("event", "pause"); setPlaying(false); }}
          onProgress={handleProgress}
          controls={hasStarted && !activeQuestion}
        />
        
        {!hasStarted && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
            <Button size="lg" onClick={handleStartVideo} className="rounded-full h-16 px-8 text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(var(--primary),0.5)]">
              <PlayCircle className="w-6 h-6 mr-3" />
              Start Lesson
            </Button>
          </div>
        )}

        <AnimatePresence>
          {activeQuestion && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-20 p-6"
            >
              <GlassCard className="max-w-xl w-full p-8 space-y-6">
                <h3 className="text-2xl font-bold text-center mb-6">
                  {activeQuestion.questions[0].prompt_json?.text}
                </h3>
                <div className="space-y-3">
                  {activeQuestion.questions[0].question_choices.map((choice: any) => (
                    <Button 
                      key={choice.id} 
                      variant="outline" 
                      className="w-full h-14 justify-start text-left px-6 text-lg hover:bg-primary/20 hover:border-primary/50"
                      onClick={() => submitAnswer(choice)}
                    >
                      {choice.choice_json?.text}
                    </Button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress tracking display (simplified for MVP) */}
      <GlassCard className="p-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Interactive Questions</h3>
          <span className="text-muted-foreground">{answeredQuestions.size} of {events.length} Completed</span>
        </div>
        <div className="flex gap-2 mt-4">
          {events.map((e, i) => (
            <div 
              key={e.id} 
              className={`h-2 flex-1 rounded-full transition-colors ${answeredQuestions.has(e.id) ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]' : 'bg-white/10'}`}
              title={`Question ${i+1}`}
            />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
