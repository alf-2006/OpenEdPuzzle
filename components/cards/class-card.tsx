"use client";

import { motion } from "framer-motion";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStableColor, hexToRgb, copyToClipboard } from "@/lib/design-utils";
import { getInitials } from "@/lib/avatar-utils";
import { Copy, Users, Archive, Eye } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface ClassCardProps {
  id: string;
  name: string;
  description?: string;
  joinCode: string;
  memberCount: number;
  members?: Array<{ id: string; name: string; avatar?: string }>;
  teacherName: string;
  delay?: number;
  onView?: () => void;
  onArchive?: () => void;
}

export function ClassCard({
  id,
  name,
  description,
  joinCode,
  memberCount,
  members = [],
  teacherName,
  delay = 0,
  onView,
  onArchive,
}: ClassCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const accentColor = getStableColor(id);
  const accentRgb = hexToRgb(accentColor);

  const handleCopyCode = async () => {
    const success = await copyToClipboard(joinCode);
    if (success) {
      toast.success("Join code copied!");
    } else {
      toast.error("Failed to copy");
    }
  };

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      <AnimatedCard
        delay={delay}
        className="relative overflow-hidden p-6 group"
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)`,
          }}
        />

        {/* Floating icon */}
        <motion.div
          className="absolute top-4 right-4 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: `rgba(${accentRgb}, 0.1)`,
            boxShadow: `0 4px 12px rgba(${accentRgb}, 0.2)`,
          }}
          animate={{
            y: isHovered ? -4 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <Users className="w-6 h-6" style={{ color: accentColor }} />
        </motion.div>

        {/* Content */}
        <div className="space-y-4">
          <div className="pr-16">
            <h3 className="text-xl font-bold mb-2">{name}</h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Join code badge */}
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 dark:bg-slate-950/60 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-200 group/copy"
          >
            <span className="text-xs font-mono font-semibold">{joinCode}</span>
            <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
          </button>

          {/* Member count with avatar stack */}
          <div className="flex items-center gap-3">
            {/* Avatar stack */}
            {members.slice(0, 4).length > 0 && (
              <div className="flex -space-x-2">
                {members.slice(0, 4).map((member, idx) => (
                  <Avatar
                    key={member.id}
                    className="w-8 h-8 border-2 border-background"
                    style={{
                      zIndex: 4 - idx,
                    }}
                  >
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback
                      className="text-xs"
                      style={{
                        backgroundColor: getStableColor(member.id),
                      }}
                    >
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}

            {/* Animated count */}
            <motion.div
              className="text-sm text-muted-foreground"
              initial={{ scale: 1 }}
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-semibold">{memberCount}</span> members
            </motion.div>
          </div>

          <div className="text-xs text-muted-foreground">
            by {teacherName}
          </div>
        </div>

        {/* Hover actions - fade in from bottom */}
        <motion.div
          className="mt-4 pt-4 border-t border-white/10 flex gap-2"
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
            className="flex-1"
            onClick={onView}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>

          {onArchive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onArchive}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Archive className="w-4 h-4" />
            </Button>
          )}
        </motion.div>
      </AnimatedCard>
    </motion.div>
  );
}
