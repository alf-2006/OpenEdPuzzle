"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/cards/video-card";
import {
  BookOpen,
  Video,
  Clock,
  TrendingUp,
  Play,
  CheckCircle2,
} from "lucide-react";
import { fadeInUp, staggerContainer, scrollFadeInUp } from "@/lib/animations";

// Mock data for student dashboard
const mockStats = {
  classesEnrolled: 3,
  videosWatched: 8,
  hoursLearned: 12.5,
  completionRate: 67,
};

const mockAssignedVideos = [
  {
    id: "1",
    title: "Newton's Laws of Motion",
    description: "Understanding the three fundamental laws",
    duration: 720,
    views: 156,
    uploadedAt: new Date("2026-08-01T10:00:00"),
    progress: 100,
    dueDate: new Date("2026-08-10T23:59:59"),
  },
  {
    id: "2",
    title: "Quantum Mechanics Basics",
    description: "Introduction to wave-particle duality",
    duration: 1080,
    views: 89,
    uploadedAt: new Date("2026-08-05T14:30:00"),
    progress: 65,
    dueDate: new Date("2026-08-15T23:59:59"),
  },
  {
    id: "3",
    title: "Thermodynamics Chapter 1",
    description: "The first law of thermodynamics",
    duration: 540,
    views: 142,
    uploadedAt: new Date("2026-08-08T09:15:00"),
    progress: 0,
    dueDate: new Date("2026-08-20T23:59:59"),
  },
];

export default function StudentDashboard() {
  const hasData = mockStats.classesEnrolled > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="space-y-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Welcome to WaslaLearn</h2>
            <p className="text-muted-foreground max-w-md">
              Join your first class to start watching videos and tracking your progress.
            </p>
          </div>
          <Button size="lg">
            <Play className="w-4 h-4 mr-2" />
            Join a Class
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your learning progress.
        </p>
      </motion.div>

      {/* Overview Cards */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={scrollFadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Classes Enrolled</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.classesEnrolled}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active courses
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={scrollFadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Videos Watched</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.videosWatched}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed lessons
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={scrollFadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hours Learned</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.hoursLearned}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total watch time
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={scrollFadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                On track
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Assigned Videos */}
      <div className="space-y-4">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold">Assigned Videos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Continue where you left off
            </p>
          </div>
        </motion.div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {mockAssignedVideos.map((video, index) => (
            <motion.div key={video.id} variants={scrollFadeInUp}>
              <Card className="overflow-hidden">
                <VideoCard
                  {...video}
                  delay={index}
                  onPlay={() => console.log("Play video:", video.id)}
                />
                {/* Progress Indicator */}
                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Progress</span>
                    <span>{video.progress}%</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${video.progress}%` }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    />
                  </div>
                  {video.progress === 100 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
