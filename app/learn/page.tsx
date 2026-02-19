"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";

const DEMO_CONTENT = `Photosynthesis is how plants make their food. Plants use sunlight, water, and carbon dioxide from the air. They turn these into sugar and oxygen. The sugar gives the plant energy. The oxygen goes into the air for us to breathe. Leaves are like small factories where this happens. Chlorophyll in the leaves makes them green and captures sunlight. Without photosynthesis, there would be no life on Earth as we know it.`;

type Mode = "normal" | "dyslexia" | "adhd" | "audio";

function LearnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDemo = searchParams.get("demo") === "1";
  const [content, setContent] = useState<string>("");
  const [mode, setMode] = useState<Mode>("normal");
  const [dark, setDark] = useState(false);
  const [fontScale, setFontScale] = useState(100);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isDemo) {
      setContent(DEMO_CONTENT);
      return;
    }
    const stored = sessionStorage.getItem("neuroadapt-content");
    if (stored) setContent(stored);
  }, [isDemo]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  const chunks = content
    ? content.split(/\n\n+/).filter(Boolean)
    : [];
  const currentChunk = chunks[sectionIndex] ?? "";
  const hasContent = content.length > 0;

  const scaleClass =
    fontScale <= 100
      ? "text-scale-100"
      : fontScale <= 110
        ? "text-scale-110"
        : fontScale <= 125
          ? "text-scale-125"
          : "text-scale-150";

  if (!hasContent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-4">
        <p className="text-lg text-[var(--foreground)]">
          Load a lesson to get started.
        </p>
        <div className="flex gap-4">
          <Button href="/learn?demo=1" variant="primary">
            Try Demo Lesson
          </Button>
          <Button href="/learn/paste" variant="secondary">
            Paste Text
          </Button>
          <Link
            href="/"
            className="min-h-[44px] flex items-center justify-center rounded-xl border border-foreground/30 px-6 py-3 text-base font-medium hover:bg-foreground/5"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      {/* Zone 1: Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-[var(--foreground)]/80">
            Mode:
          </span>
          {(["normal", "dyslexia", "adhd", "audio"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                mode === m
                  ? "bg-foreground text-background"
                  : "bg-foreground/10 text-foreground hover:bg-foreground/20"
              }`}
              aria-pressed={mode === m}
              aria-label={`Switch to ${m} mode`}
            >
              {m === "audio" ? "Listen" : m}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Font size</span>
            <input
              type="range"
              min="100"
              max="150"
              step="10"
              value={fontScale}
              onChange={(e) => setFontScale(Number(e.target.value))}
              className="h-3 w-24 accent-foreground"
              aria-label="Font size"
            />
          </label>
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className="min-h-[44px] rounded-lg border border-foreground/30 px-4 py-2 text-sm font-medium hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className="min-h-[44px] rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={playing ? "Pause read aloud" : "Read aloud"}
          >
            {playing ? "Pause" : "Read Aloud"}
          </button>
        </div>
      </header>

      {/* Zone 2: Main Content */}
      <div className="flex-1 overflow-auto px-4 py-8">
        <article
          className={`mx-auto max-w-[65ch] ${scaleClass} leading-relaxed text-[var(--foreground)] ${
            mode === "dyslexia" ? "font-[family-name:var(--font-dyslexia)] tracking-wide" : ""
          } ${mode === "adhd" ? "space-y-6" : "space-y-4"}`}
          style={
            mode === "dyslexia"
              ? { wordSpacing: "0.15em", letterSpacing: "0.02em" }
              : undefined
          }
        >
          {mode === "adhd" ? (
            <div className="rounded-xl border-2 border-foreground/20 bg-foreground/5 p-6">
              <p>{currentChunk}</p>
            </div>
          ) : (
            chunks.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))
          )}
        </article>
      </div>

      {/* Zone 3: Bottom Nav */}
      <nav className="flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 px-4 py-4">
        <Button
          variant="secondary"
          onClick={() => setSectionIndex((i) => Math.max(0, i - 1))}
          aria-label="Previous section"
        >
          Previous section
        </Button>
        <span className="text-sm font-medium text-[var(--foreground)]/80">
          Section {sectionIndex + 1} of {chunks.length || 1}
        </span>
        <Button
          variant="secondary"
          onClick={() =>
            setSectionIndex((i) => Math.min(chunks.length - 1, i + 1))
          }
          aria-label="Next section"
        >
          Next section
        </Button>
      </nav>
      <div className="px-4 pb-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-foreground/60 transition-all"
            style={{
              width: `${chunks.length ? ((sectionIndex + 1) / chunks.length) * 100 : 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
          <p className="text-[var(--foreground)]">Loading…</p>
        </div>
      }
    >
      <LearnContent />
    </Suspense>
  );
}
