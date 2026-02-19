"use client";

import { useState, useEffect, useRef } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import type { LessonSection } from "@/data/demoLesson";
import { GLOSSARY } from "@/data/glossary";

interface LessonContentProps {
  sections: LessonSection[];
  currentSection: number;
}

/** Segment text into word/space tokens with word indices for read-aloud highlighting */
function segmentText(
  text: string,
  startWordIndex: number
): { segments: Array<{ type: "word" | "space"; value: string; wordIndex?: number }>; nextWordIndex: number } {
  const tokens = text.split(/(\s+)/);
  let wi = startWordIndex;
  const segments = tokens.map((t) =>
    /\w+/.test(t)
      ? { type: "word" as const, value: t, wordIndex: wi++ }
      : { type: "space" as const, value: t }
  );
  return { segments, nextWordIndex: wi };
}

/** Split text into tokens; wrap glossary terms in <span> with title for hover */
function paragraphWithGlossary(text: string) {
  const entries = Object.entries(GLOSSARY).sort((a, b) => b[0].length - a[0].length);
  const parts: { key: string; text: string; meaning?: string }[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    let found = false;
    for (const [word, meaning] of entries) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b(${escaped})\\b`, "i");
      const match = remaining.match(re);
      if (!match || match.index === undefined) continue;
      const idx = match.index;
      const matchedText = match[1];
      if (idx > 0) {
        parts.push({ key: `t-${keyIndex++}`, text: remaining.slice(0, idx) });
      }
      parts.push({ key: `g-${keyIndex++}`, text: matchedText, meaning });
      remaining = remaining.slice(idx + matchedText.length);
      found = true;
      break;
    }
    if (!found) {
      parts.push({ key: `t-${keyIndex++}`, text: remaining });
      break;
    }
  }

  return parts;
}

export function LessonContent({
  sections,
  currentSection,
}: LessonContentProps) {
  const { mode, fontSize, currentReadAloudWordIndex } = useAccessibility();
  const [activeSentence, setActiveSentence] = useState(0);
  const activeSentenceRef = useRef<HTMLSpanElement>(null);
  const section = sections[currentSection];

  if (!section) return null;

  const isDyslexia = mode === "dyslexia";
  const isAdhd = mode === "adhd";
  const isLowVision = mode === "low-vision";

  const showReadAloudHighlight = !isAdhd && currentReadAloudWordIndex !== null;
  let headingSegs = { segments: [] as Array<{ type: "word" | "space"; value: string; wordIndex?: number }>, nextWordIndex: 0 };
  const paragraphSegsList: typeof headingSegs["segments"][] = [];
  if (showReadAloudHighlight) {
    headingSegs = segmentText(section.heading, 0);
    let idx = headingSegs.nextWordIndex;
    for (const p of section.paragraphs) {
      const segs = segmentText(p, idx);
      idx = segs.nextWordIndex;
      paragraphSegsList.push(segs.segments);
    }
  }

  // Split into chunks: by newlines first (paste/upload), then by sentence-ending punctuation (demo)
  const allSentences = section.paragraphs.flatMap((p) =>
    p
      .split(/\n+/)
      .flatMap((line) =>
        line.split(/(?<=[.!?])\s+/).map((s) => s.trim())
      )
      .filter(Boolean)
  );

  useEffect(() => {
    setActiveSentence(0);
  }, [currentSection, mode]);

  useEffect(() => {
    if (isAdhd && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSentence, isAdhd]);

  const effectiveFontSize = isLowVision ? Math.max(fontSize, 24) : fontSize;
  const lineHeight = isDyslexia ? 2.2 : isLowVision ? 2 : 1.8;
  const letterSpacing = isDyslexia ? "0.05em" : "normal";
  const wordSpacing = isDyslexia ? "0.15em" : "normal";

  return (
    <div
      id="lesson-content"
      className={`mx-auto max-w-2xl ${isDyslexia ? "font-dyslexic" : ""}`}
      style={{
        fontSize: `${effectiveFontSize}px`,
        lineHeight,
        letterSpacing,
        wordSpacing,
      }}
    >
      <h2
        className="mb-6 font-bold text-foreground"
        style={{ fontSize: `${effectiveFontSize + 6}px` }}
      >
        {showReadAloudHighlight
          ? headingSegs.segments.map((seg, i) =>
              seg.type === "word" ? (
                <span
                  key={i}
                  className={seg.wordIndex === currentReadAloudWordIndex ? "read-aloud-highlight" : ""}
                >
                  {seg.value}
                </span>
              ) : (
                seg.value
              )
            )
          : section.heading}
      </h2>

      {isAdhd ? (
        <div className="space-y-6">
          <p className="leading-relaxed text-foreground">
            {allSentences.map((sentence, i) => (
              <span
                key={i}
                ref={i === activeSentence ? activeSentenceRef : null}
                className={i === activeSentence ? "text-highlight" : "dimmed-text"}
              >
                {sentence}{" "}
              </span>
            ))}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                setActiveSentence((s) => Math.max(0, s - 1))
              }
              disabled={activeSentence === 0}
              className="btn-accessible bg-secondary text-secondary-foreground disabled:opacity-40"
              aria-label="Previous sentence"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveSentence((s) =>
                  Math.min(allSentences.length - 1, s + 1)
                )
              }
              disabled={activeSentence === allSentences.length - 1}
              className="btn-accessible bg-primary text-primary-foreground disabled:opacity-40"
              aria-label="Next sentence"
            >
              Next →
            </button>
          </div>
          <p className="text-sm font-bold text-muted-foreground">
            Sentence {activeSentence + 1} of {allSentences.length}
          </p>
        </div>
      ) : isDyslexia ? (
        <div className="space-y-6">
          {section.paragraphs.map((p, i) => (
            <p key={i} className="leading-relaxed text-foreground">
              {showReadAloudHighlight
                ? paragraphSegsList[i]?.map((seg, j) => {
                    if (seg.type !== "word")
                      return <span key={j}>{seg.value}</span>;
                    const meaning = Object.entries(GLOSSARY).find(
                      ([k]) => k.toLowerCase() === seg.value.toLowerCase()
                    )?.[1];
                    const isHighlight = seg.wordIndex === currentReadAloudWordIndex;
                    return (
                      <span
                        key={j}
                        className={
                          (isHighlight ? "read-aloud-highlight " : "") +
                          (meaning ? "cursor-help border-b-2 border-dashed border-primary/50 " : "")
                        }
                        title={meaning}
                      >
                        {seg.value}
                      </span>
                    );
                  }) ?? null
                : paragraphWithGlossary(p).map((part) =>
                    part.meaning ? (
                      <span
                        key={part.key}
                        className="cursor-help border-b-2 border-dashed border-primary/50 text-foreground"
                        title={part.meaning}
                      >
                        {part.text}
                      </span>
                    ) : (
                      <span key={part.key}>{part.text}</span>
                    )
                  )}
            </p>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {section.paragraphs.map((p, i) => (
            <p key={i} className="leading-relaxed text-foreground">
              {showReadAloudHighlight
                ? paragraphSegsList[i]?.map((seg, j) =>
                    seg.type === "word" ? (
                      <span
                        key={j}
                        className={
                          seg.wordIndex === currentReadAloudWordIndex
                            ? "read-aloud-highlight"
                            : ""
                        }
                      >
                        {seg.value}
                      </span>
                    ) : (
                      seg.value
                    )
                  ) ?? p
                : p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
