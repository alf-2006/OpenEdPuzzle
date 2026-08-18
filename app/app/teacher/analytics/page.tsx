"use client";

import { motion } from "framer-motion";
import { AnalyticsTable, GlassBadge, AnimatedProgress } from "@/components/ui/analytics-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download } from "lucide-react";
import { fadeInUp, staggerContainer, scrollFadeInUp } from "@/lib/animations";

// Mock data for analytics
const mockAnalyticsData = [
  {
    id: "1",
    student: "Ahmed Hassan",
    video: "Newton's Laws of Motion",
    completion: 100,
    status: "completed",
    watchTime: "12:00",
    tamperAttempts: 0,
    lastActive: new Date("2026-08-13T18:30:00"),
  },
  {
    id: "2",
    student: "Leila Ibrahim",
    video: "Quantum Mechanics Basics",
    completion: 65,
    status: "in-progress",
    watchTime: "11:45",
    tamperAttempts: 0,
    lastActive: new Date("2026-08-13T16:15:00"),
  },
  {
    id: "3",
    student: "Sarah Al-Mansouri",
    video: "Thermodynamics Chapter 1",
    completion: 45,
    status: "in-progress",
    watchTime: "4:03",
    tamperAttempts: 2,
    lastActive: new Date("2026-08-13T14:45:00"),
  },
  {
    id: "4",
    student: "Omar Khalid",
    video: "Calculus: Limits and Derivatives",
    completion: 100,
    status: "completed",
    watchTime: "16:00",
    tamperAttempts: 0,
    lastActive: new Date("2026-08-13T12:20:00"),
  },
  {
    id: "5",
    student: "Fatima Ali",
    video: "Data Structures: Binary Trees",
    completion: 30,
    status: "in-progress",
    watchTime: "4:12",
    tamperAttempts: 0,
    lastActive: new Date("2026-08-13T10:00:00"),
  },
  {
    id: "6",
    student: "Youssef Ahmed",
    video: "Organic Chemistry Reactions",
    completion: 0,
    status: "not-started",
    watchTime: "0:00",
    tamperAttempts: 0,
    lastActive: new Date("2026-08-12T20:00:00"),
  },
];

const columns = [
  {
    key: "student" as const,
    label: "Student",
    sortable: true,
  },
  {
    key: "video" as const,
    label: "Video",
    sortable: true,
  },
  {
    key: "completion" as const,
    label: "Completion",
    sortable: true,
    render: (value: number, row: any) => (
      <AnimatedProgress value={value} max={100} showLabel={false} />
    ),
  },
  {
    key: "status" as const,
    label: "Status",
    sortable: true,
    render: (value: string) => {
      const variant =
        value === "completed"
          ? "success"
          : value === "in-progress"
          ? "warning"
          : "default";
      return (
        <GlassBadge variant={variant as any}>
          {value === "completed" && "Completed"}
          {value === "in-progress" && "In Progress"}
          {value === "not-started" && "Not Started"}
        </GlassBadge>
      );
    },
  },
  {
    key: "watchTime" as const,
    label: "Watch Time",
    sortable: true,
  },
  {
    key: "tamperAttempts" as const,
    label: "Tamper Attempts",
    sortable: true,
    render: (value: number) => (
      <GlassBadge variant={value > 0 ? "danger" : "success"} glow={value > 0}>
        {value}
      </GlassBadge>
    ),
  },
];

export default function TeacherAnalyticsPage() {
  const hasData = mockAnalyticsData.length > 0;

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
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">No data yet</h2>
            <p className="text-muted-foreground max-w-md">
              Student activity will appear here once they start watching videos.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Track student progress and engagement across all videos
          </p>
        </div>
        <Button size="lg" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={scrollFadeInUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">56.7%</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={scrollFadeInUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Watch Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48h 20m</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={scrollFadeInUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Videos Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2 / 6</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={scrollFadeInUp}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tamper Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">2</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Analytics Table */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        <AnalyticsTable
          columns={columns}
          data={mockAnalyticsData}
          onRowClick={(row) => console.log("Row clicked:", row)}
        />
      </motion.div>
    </div>
  );
}
