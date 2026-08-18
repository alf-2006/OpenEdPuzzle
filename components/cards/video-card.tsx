"use client";

import { motion } from "framer-motion";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Button } from "@/components/ui/button";
import { Play, Clock, Eye, Calendar } from "lucide-react";
import { getStableColor, hexToRgb } from "@/lib/design-utils";
import { useState } from "react";

interface VideoCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration: number; // in seconds
  views: number;
  uploadedAt: Date;
  className?: string;
  delay?: number;
  onPlay?: () => void;
}

export function VideoCard({
  id,
  title,
  description,
  thumbnailUrl,
  duration,
  views,
  uploadedAt,
  className,
  delay = 0,
  onPlay,
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const accentColor = getStableColor(id);
  const accentRgb = hexToRgb(accentColor);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={className}
    >
      <AnimatedCard delay={delay} className="overflow-hidden p-0 group">
        {/* Thumbnail with overlay */}
        <div className="relative aspect-video overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, rgba(${accentRgb}, 0.3), rgba(${accentRgb}, 0.1))`,
              }}
            />
          )}

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-sm text-xs font-semibold text-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(duration)}
          </div>

          {/* Play button overlay - appears on hover */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={onPlay}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: `rgba(${accentRgb}, 0.9)`,
                boxShadow: `0 8px 32px rgba(${accentRgb}, 0.4)`,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </motion.button>
          </motion.div>

          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)`,
            }}
          />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-lg line-clamp-2 mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{views.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(uploadedAt)}</span>
            </div>
          </div>

          {/* Actions - slide in from bottom on hover */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 10,
            }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onPlay}
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Now
            </Button>
          </motion.div>
        </div>
      </AnimatedCard>
    </motion.div>
  );
}
