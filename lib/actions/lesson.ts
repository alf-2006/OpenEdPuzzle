"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLesson(title: string, sourceUrl: string) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }
  
  const userId = userData.user.id;

  // Insert Lesson
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .insert({
      title,
      owner_id: userId,
      status: "draft",
    })
    .select()
    .single();

  if (lessonError) throw lessonError;

  // Insert Lesson Version
  const { data: version, error: versionError } = await supabase
    .from("lesson_versions")
    .insert({
      lesson_id: lesson.id,
      version_no: 1,
      status: "draft",
      source_type: "youtube",
      external_id: sourceUrl, // we can store full URL for now
      created_by: userId,
    })
    .select()
    .single();

  if (versionError) throw versionError;

  revalidatePath("/app/teacher/lessons");
  
  return { lessonId: lesson.id };
}

export async function addTimelineEvent(lessonVersionId: string, positionMs: number, prompt: string, choices: { text: string; isCorrect: boolean }[]) {
  const supabase = await createClient();

  // Create Timeline Event
  const { data: event, error: eventError } = await supabase
    .from("timeline_events")
    .insert({
      lesson_version_id: lessonVersionId,
      event_type: "question",
      position_ms: positionMs,
      sort_order: positionMs,
    })
    .select()
    .single();
    
  if (eventError) throw eventError;

  // Create Question
  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({
      timeline_event_id: event.id,
      question_type: "mcq",
      prompt_json: { text: prompt },
    })
    .select()
    .single();

  if (questionError) throw questionError;

  // Create Choices
  const { error: choicesError } = await supabase
    .from("question_choices")
    .insert(
      choices.map((c, i) => ({
        question_id: question.id,
        choice_json: { text: c.text },
        sort_order: i,
        is_correct: c.isCorrect,
      }))
    );

  if (choicesError) throw choicesError;

  return { eventId: event.id };
}

export async function publishLessonVersion(lessonVersionId: string, classId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Unauthorized");
  
  // 1. Get version details
  const { data: version, error: versionErr } = await supabase
    .from("lesson_versions")
    .select("*, lessons(*)")
    .eq("id", lessonVersionId)
    .single();

  if (versionErr) throw versionErr;

  // 2. Publish version and lesson
  await supabase
    .from("lesson_versions")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", lessonVersionId);

  await supabase
    .from("lessons")
    .update({ status: "published" })
    .eq("id", version.lesson_id);

  // 3. Create dummy video to satisfy legacy video_id requirement
  const { data: video, error: videoErr } = await supabase
    .from("videos")
    .insert({
      teacher_id: userData.user.id,
      source: version.source_type,
      external_id: version.external_id + "_v" + version.version_no, // ensure uniqueness
      title: version.lessons?.title || "Published Lesson",
      duration_seconds: version.duration_seconds || 60,
    })
    .select()
    .single();

  if (videoErr) throw videoErr;

  // 4. Create Assignment
  const { error: assignmentErr } = await supabase
    .from("assignments")
    .insert({
      class_id: classId,
      video_id: video.id,
      lesson_version_id: lessonVersionId,
    });

  if (assignmentErr) throw assignmentErr;

  revalidatePath("/app/teacher/lessons");
  revalidatePath(`/app/teacher/classes/${classId}`);
  
  return { success: true };
}
