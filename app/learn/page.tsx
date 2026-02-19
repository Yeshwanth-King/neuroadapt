"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAccessibility, type AdhdThemeId } from "@/contexts/AccessibilityContext";
import { useSpeechNav } from "@/contexts/SpeechNavContext";
import { DEMO_LESSON } from "@/data/demoLesson";
import type { DemoLesson } from "@/data/demoLesson";
import { ModeSelector } from "@/components/ModeSelector";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { LessonContent } from "@/components/LessonContent";
import { ProgressBar } from "@/components/ProgressBar";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Keyboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PROFILE_KEY = "neuroadapt-learner-profile";

const MODE_LABELS: Record<string, string> = {
  normal: "Normal",
  dyslexia: "Dyslexia",
  adhd: "ADHD Focus",
  "low-vision": "Low Vision",
};

const FOCUS_LABELS: Record<string, string> = {
  short: "Short focus",
  medium: "Medium focus",
  long: "Long focus",
};

function useOptimizedBadge(): string | null {
  const [badge, setBadge] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(PROFILE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { mode?: string; focusDuration?: string };
      const modeLabel = MODE_LABELS[p.mode ?? "normal"] ?? p.mode ?? "Normal";
      const focusLabel = FOCUS_LABELS[p.focusDuration ?? "medium"] ?? p.focusDuration ?? "Medium focus";
      setBadge(`Optimized for: ${modeLabel} + ${focusLabel}`);
    } catch {
      setBadge(null);
    }
  }, []);
  return badge;
}

function useLesson(): DemoLesson {
  const searchParams = useSearchParams();
  const isCustom = searchParams.get("custom") === "1";
  return useMemo(() => {
    if (!isCustom || typeof window === "undefined") return DEMO_LESSON;
    const raw = sessionStorage.getItem("neuroadapt-content");
    if (!raw?.trim()) return DEMO_LESSON;
    const blocks = raw.trim().split(/\n\n+/).filter(Boolean);
    const sections = blocks.map((p, i) => ({
      heading: `Section ${i + 1}`,
      paragraphs: [p],
    }));
    return {
      title: "Your lesson",
      subtitle: "Custom content",
      sections,
    };
  }, [isCustom]);
}

function LearnContent() {
  const lesson = useLesson();
  const optimizedBadge = useOptimizedBadge();
  const { mode, highContrast, setMode, setFontSize, setHighContrast, setCurrentReadAloudWordIndex, adhdTheme, setAdhdTheme, fontSize } =
    useAccessibility();
  const { registerPageCommands, clearPageCommands, speak } = useSpeechNav();
  const [currentSection, setCurrentSection] = useState(0);
  const total = lesson.sections.length;

  useEffect(() => {
    registerPageCommands({
      next: () => {
        setCurrentSection((s) => Math.min(total - 1, s + 1));
        speak("Next section.");
      },
      previous: () => {
        setCurrentSection((s) => Math.max(0, s - 1));
        speak("Previous section.");
      },
      read: () => {
        document.getElementById("btn-read-aloud")?.click();
        // Don't speak confirmation here — it would cancel the lesson TTS
      },
      pause: () => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setCurrentReadAloudWordIndex(null);
        speak("Paused.");
      },
      repeat: () => {
        document.getElementById("btn-read-aloud")?.click();
        // Don't speak confirmation — it would cancel the lesson TTS
      },
      goToSection: (payload) => {
        if (payload != null) {
          const idx = Math.max(1, Math.min(total, payload)) - 1;
          setCurrentSection(idx);
          speak(`Section ${idx + 1}.`);
        }
      },
      modeNormal: () => {
        setMode("normal");
        speak("Normal mode.");
      },
      modeDyslexia: () => {
        setMode("dyslexia");
        speak("Dyslexia mode.");
      },
      modeAdhd: () => {
        setMode("adhd");
        speak("ADHD focus mode.");
      },
      modeLowVision: () => {
        setMode("low-vision");
        speak("Low vision mode.");
      },
      fontBigger: () => {
        setFontSize(Math.min(32, fontSize + 2));
        speak("Larger text.");
      },
      fontSmaller: () => {
        setFontSize(Math.max(14, fontSize - 2));
        speak("Smaller text.");
      },
      contrast: () => {
        setHighContrast(!highContrast);
        speak("Contrast toggled.");
      },
    });
    return () => clearPageCommands();
  }, [
    total,
    highContrast,
    fontSize,
    registerPageCommands,
    clearPageCommands,
    speak,
    setMode,
    setFontSize,
    setHighContrast,
    setCurrentReadAloudWordIndex,
  ]);

  useEffect(() => {
    if (highContrast || mode === "low-vision") {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    return () => document.documentElement.classList.remove("high-contrast");
  }, [highContrast, mode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentSection < total - 1)
        setCurrentSection((s) => s + 1);
      if (e.key === "ArrowLeft" && currentSection > 0)
        setCurrentSection((s) => s - 1);
      if (e.key === " ") {
        e.preventDefault();
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.paused
            ? window.speechSynthesis.resume()
            : window.speechSynthesis.pause();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentSection, total]);

  const adhdThemeClass = mode === "adhd" ? `adhd-theme-${adhdTheme}` : "";
  const adhdThemeOptions: { value: AdhdThemeId; label: string }[] = [
    { value: "calm", label: "Calm (cream + blue)" },
    { value: "sage", label: "Sage green" },
    { value: "dark", label: "Dark focus" },
  ];
  const currentAdhdLabel = adhdThemeOptions.find((o) => o.value === adhdTheme)?.label ?? adhdTheme;

  return (
    <div className={`min-h-screen bg-background ${adhdThemeClass}`}>
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="mb-4 flex items-center gap-4">
            <Link
              href="/"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground hover:opacity-80"
              aria-label="Go back to home"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {lesson.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {lesson.subtitle}
              </p>
              {optimizedBadge && (
                <p className="mt-1.5 inline-block rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                  {optimizedBadge}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <ModeSelector />
              {mode === "adhd" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-border bg-background px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label="ADHD focus theme"
                    >
                      <span className="text-muted-foreground">ADHD theme</span>
                      <span className="min-w-[8rem] font-semibold">{currentAdhdLabel}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[12rem]">
                    {adhdThemeOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setAdhdTheme(opt.value)}
                        className={adhdTheme === opt.value ? "bg-accent/20 font-semibold" : ""}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <AccessibilityToolbar
              currentSectionText={
                lesson.sections[currentSection]
                  ? lesson.sections[currentSection].heading +
                    "\n\n" +
                    lesson.sections[currentSection].paragraphs.join("\n\n")
                  : ""
              }
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <LessonContent
          sections={lesson.sections}
          currentSection={currentSection}
        />
      </main>

      <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <ProgressBar current={currentSection} total={total} />
          <div className="mt-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() =>
                setCurrentSection((s) => Math.max(0, s - 1))
              }
              disabled={currentSection === 0}
              className="btn-accessible flex items-center gap-2 bg-secondary text-secondary-foreground disabled:opacity-40"
              aria-label="Previous section"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
              Previous
            </button>
            <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-muted-foreground">
              <Keyboard className="h-4 w-4 shrink-0" aria-hidden />
              Press ← → to navigate · Space to pause audio
            </p>
            <button
              type="button"
              onClick={() =>
                setCurrentSection((s) => Math.min(total - 1, s + 1))
              }
              disabled={currentSection === total - 1}
              className="btn-accessible flex items-center gap-2 bg-primary text-primary-foreground disabled:opacity-40"
              aria-label="Next section"
            >
              Next
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-foreground">Loading…</p>
        </div>
      }
    >
      <LearnContent />
    </Suspense>
  );
}
