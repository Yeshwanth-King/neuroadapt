"use client";

import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Minus, Moon, Plus, Sun, Volume2 } from "lucide-react";

const WORD_REGEX = /\b\w+\b/g;

function getWordRanges(text: string): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = WORD_REGEX.exec(text)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  return ranges;
}

export function AccessibilityToolbar({
  currentSectionText,
}: {
  currentSectionText: string;
}) {
  const {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    setCurrentReadAloudWordIndex,
  } = useAccessibility();

  const speak = () => {
    const textToSpeak = currentSectionText.trim() || (typeof document !== "undefined" ? document.getElementById("lesson-content")?.textContent ?? "" : "");
    if (!textToSpeak || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    setCurrentReadAloudWordIndex(null);

    const ranges = getWordRanges(textToSpeak);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.85;

    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name !== "word" && e.name !== "sentence") return;
      const charIndex = "charIndex" in e ? (e as { charIndex: number }).charIndex : 0;
      const i = ranges.findIndex((r) => r.start <= charIndex && charIndex < r.end);
      if (i >= 0) setCurrentReadAloudWordIndex(i);
    };

    utterance.onend = () => setCurrentReadAloudWordIndex(null);
    utterance.onerror = () => setCurrentReadAloudWordIndex(null);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1 rounded-xl bg-secondary px-4 py-2">
        <span className="text-xs font-bold text-muted-foreground">Text Size</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.max(14, s - 2))}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-foreground hover:opacity-80"
            aria-label="Decrease font size"
          >
            <Minus className="h-5 w-5" aria-hidden />
          </button>
          <span className="min-w-[3ch] text-center font-bold text-foreground">
            {fontSize}
          </span>
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.min(32, s + 2))}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-foreground hover:opacity-80"
            aria-label="Increase font size"
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setHighContrast(!highContrast)}
        className={`flex min-h-[48px] items-center gap-2 rounded-xl px-5 py-3 font-bold transition-all ${
          highContrast
            ? "bg-foreground text-background"
            : "bg-secondary text-secondary-foreground"
        }`}
        aria-label={
          highContrast ? "Disable high contrast" : "Enable high contrast"
        }
      >
        {highContrast ? (
          <Moon className="h-5 w-5" aria-hidden />
        ) : (
          <Sun className="h-5 w-5" aria-hidden />
        )}
        Contrast
      </button>

      <button
        id="btn-read-aloud"
        type="button"
        onClick={speak}
        className="btn-accessible flex items-center gap-2 bg-accent text-accent-foreground hover:opacity-90"
        aria-label="Read lesson aloud"
      >
        <Volume2 className="h-5 w-5" aria-hidden />
        Read Aloud
      </button>
    </div>
  );
}
