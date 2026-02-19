"use client";

import { useAccessibility } from "@/contexts/AccessibilityContext";
import type { AccessibilityMode } from "@/data/demoLesson";
import { BookOpen, Brain, Eye, Focus } from "lucide-react";

const modes: {
  id: AccessibilityMode;
  label: string;
  sublabel: string;
  icon: typeof BookOpen;
}[] = [
  { id: "normal", label: "Normal", sublabel: "Standard reading", icon: BookOpen },
  { id: "dyslexia", label: "Dyslexia", sublabel: "Simplified + Spaced", icon: Brain },
  { id: "adhd", label: "ADHD Focus", sublabel: "Chunked + Focused", icon: Focus },
  { id: "low-vision", label: "Low Vision", sublabel: "High Contrast + Enlarged", icon: Eye },
];

export function ModeSelector() {
  const { mode, setMode } = useAccessibility();

  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label="Accessibility mode"
    >
      {modes.map((m) => {
        const Icon = m.icon;
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(m.id)}
            className={`flex min-h-[48px] flex-col items-center justify-center gap-0 rounded-xl px-4 py-2.5 text-left transition-all duration-200 sm:min-h-[56px] sm:px-5 sm:py-3 ${
              active
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-secondary-foreground hover:opacity-80"
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="font-bold">{m.label}</span>
            </span>
            <span
              className={`mt-0.5 text-xs sm:text-sm ${
                active ? "opacity-95" : "opacity-80"
              }`}
            >
              {m.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
