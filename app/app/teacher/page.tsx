"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BookOpen,
  Video,
  Users,
  TrendingUp,
  PlusCircle,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { fadeInUp, staggerContainer, scrollFadeInUp } from "@/lib/animations";
import { getInitials } from "@/lib/avatar-utils";
import { getStableColor } from "@/lib/design-utils";

// Mock data for teacher dashboard
const mockStats = {
  totalClasses: 4,
  totalVideos: 12,
  activeStudents: 87,
  completionRate: 78.5,
};

const mockRecentActivity = [
  {
    id: "1",
    type: "completion",
    student: { id: "s1", name: "Ahmed Hassan" },
    video: "Newton's Laws of Motion",
    timestamp: new Date("2026-08-13T18:30:00"),
  },
  {
    id: "2",
    type: "enrollment",
    student: { id: "s2", name: "Leila Ibrahim" },
    class: "Introduction to Physics",
    timestamp: new Date("2026-08-13T16:15:00"),
  },
  {
    id: "3",
    type: "tamper",
    student: { id: "s3", name: "Sarah Al-Mansouri" },
    video: "Quantum Mechanics Basics",
    timestamp: new Date("2026-08-13T14:45:00"),
  },
  {
    id: "4",
    type: "completion",
    student: { id: "s4", name: "Omar Khalid" },
    video: "Thermodynamics Chapter 1",
    timestamp: new Date("2026-08-13T12:20:00"),
  },
];

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function TeacherDashboard() {
  const hasData = mockStats.totalClasses > 0;

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
              Get started by creating your first class and uploading videos to track student progress.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Your First Class
            </Button>
            <Button size="lg" variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </div>
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
          Welcome back! Here's what's happening with your classes.
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
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalClasses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active courses
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={scrollFadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalVideos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Assigned content
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={scrollFadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.activeStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Enrolled learners
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
                Average across all videos
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Class
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Invite Students
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                  >
                    {/* Avatar */}
                    <Avatar
                      className="h-9 w-9 shrink-0"
                      style={{ backgroundColor: getStableColor(activity.student.id) }}
                    >
                      <AvatarFallback className="text-white font-semibold text-sm">
                        {getInitials(activity.student.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm">
                          <span className="font-medium">{activity.student.name}</span>
                          {activity.type === "completion" && (
                            <span className="text-muted-foreground">
                              {" "}completed{" "}
                              <span className="font-medium">{activity.video}</span>
                            </span>
                          )}
                          {activity.type === "enrollment" && (
                            <span className="text-muted-foreground">
                              {" "}enrolled in{" "}
                              <span className="font-medium">{activity.class}</span>
                            </span>
                          )}
                          {activity.type === "tamper" && (
                            <span className="text-muted-foreground">
                              {" "}tamper attempt detected in{" "}
                              <span className="font-medium">{activity.video}</span>
                            </span>
                          )}
                        </p>
                        {/* Icon */}
                        <div className="shrink-0">
                          {activity.type === "completion" && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                          {activity.type === "enrollment" && (
                            <Users className="h-4 w-4 text-accent" />
                          )}
                          {activity.type === "tamper" && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
