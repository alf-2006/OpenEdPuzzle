"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { scrollFadeInUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { getStableColor } from "@/lib/design-utils";
import { getInitials } from "@/lib/avatar-utils";

const testimonials = [
  {
    id: "1",
    name: "Sarah Al-Mansouri",
    role: "Mathematics Teacher",
    quote:
      "WaslaLearn transformed how I assign homework. I finally have proof that students actually watch the lessons, not just click play and walk away.",
    rating: 5,
  },
  {
    id: "2",
    name: "Ahmed Hassan",
    role: "Computer Science Professor",
    quote:
      "The checkpoint system is brilliant. Students can't skip ahead without understanding the material. My class completion rate went from 60% to 94%.",
    rating: 5,
  },
  {
    id: "3",
    name: "Leila Ibrahim",
    role: "Physics Instructor",
    quote:
      "The heatmaps show me exactly where students rewind and struggle. I redesigned three entire lessons based on the data. Game changer.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-20 sm:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={scrollFadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Real Teachers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Educators who trust WaslaLearn to track student progress.
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial) => (
            <motion.div key={testimonial.id} variants={scrollFadeInUp}>
              <Card className="h-full border-l-4" style={{ borderLeftColor: getStableColor(testimonial.id) }}>
                <CardContent className="p-6 space-y-4">
                  {/* Rating */}
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-accent text-accent"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-sm italic text-muted-foreground leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2">
                    <Avatar className="w-10 h-10" style={{ backgroundColor: getStableColor(testimonial.id) }}>
                      <AvatarFallback className="text-white font-semibold text-sm">
                        {getInitials(testimonial.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
