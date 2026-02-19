"use client";

import { useState, useEffect, useRef } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import type { LessonSection } from "@/data/demoLesson";
import { GLOSSARY } from "@/data/glossary";
import type { TransformedContent } from "@/types/ai";
import { KeywordTooltip } from "@/components/KeywordTooltip";

interface LessonContentProps {
  sections: LessonSection[];
  currentSection: number;
  transformedContent?: TransformedContent | null;
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
  transformedContent,
}: LessonContentProps) {
  // All hooks must be called before any early returns
  const { mode, fontSize, currentReadAloudWordIndex } = useAccessibility();
  const accessibilityMode = mode;
  const [activeSentence, setActiveSentence] = useState(0);
  const activeSentenceRef = useRef<HTMLSpanElement>(null);
  
  // Ensure currentSection is within bounds
  const safeSectionIndex = Math.max(0, Math.min(currentSection, sections.length - 1));
  const section = sections[safeSectionIndex];

  const isDyslexia = mode === "dyslexia";
  const isAdhd = mode === "adhd";
  const isLowVision = mode === "low-vision";

  // Use transformed content if available
  const useTransformed = !!transformedContent;
  const adhdChunks = transformedContent?.adhd_chunked_version;
  const keyTermsMap = transformedContent?.key_terms.reduce((acc, term) => {
    acc[term.word.toLowerCase()] = term.simple_meaning;
    return acc;
  }, {} as Record<string, string>) || {};

  // Determine content to display based on mode and transformed content
  let displayHeading = section.heading;
  let displayParagraphs: string[] = section.paragraphs;

  if (useTransformed && transformedContent) {
    if (isAdhd && adhdChunks && adhdChunks.length > 0) {
      // Use ADHD chunks - note: currentSection is passed from parent, which handles chunk navigation
      const chunkIndex = Math.min(currentSection, adhdChunks.length - 1);
      const currentChunk = adhdChunks[chunkIndex];
      if (currentChunk) {
        displayHeading = currentChunk.section_title;
        displayParagraphs = [currentChunk.content];
      }
    } else if (isDyslexia && transformedContent.dyslexia_version) {
      // Use dyslexia version - split into paragraphs
      const paragraphs = transformedContent.dyslexia_version.split(/\n\n+/).filter(Boolean);
      // For transformed content, use currentSection as paragraph index
      if (paragraphs.length > 0 && currentSection < paragraphs.length) {
        displayParagraphs = [paragraphs[currentSection]];
        displayHeading = `Section ${currentSection + 1}`;
      } else {
        displayParagraphs = paragraphs.length > 0 ? [paragraphs[0]] : section.paragraphs;
      }
    } else if ((mode === "normal" || isLowVision) && transformedContent.simplified_version) {
      // Use simplified version - split into paragraphs
      const paragraphs = transformedContent.simplified_version.split(/\n\n+/).filter(Boolean);
      // For transformed content, use currentSection as paragraph index
      if (paragraphs.length > 0 && currentSection < paragraphs.length) {
        displayParagraphs = [paragraphs[currentSection]];
        displayHeading = `Section ${currentSection + 1}`;
      } else {
        displayParagraphs = paragraphs.length > 0 ? [paragraphs[0]] : section.paragraphs;
      }
    }
  }

  const showReadAloudHighlight = !isAdhd && currentReadAloudWordIndex !== null;
  let headingSegs = { segments: [] as Array<{ type: "word" | "space"; value: string; wordIndex?: number }>, nextWordIndex: 0 };
  const paragraphSegsList: typeof headingSegs["segments"][] = [];
  if (showReadAloudHighlight) {
    headingSegs = segmentText(displayHeading, 0);
    let idx = headingSegs.nextWordIndex;
    for (const p of displayParagraphs) {
      const segs = segmentText(p, idx);
      idx = segs.nextWordIndex;
      paragraphSegsList.push(segs.segments);
    }
  }

  // For ADHD mode: use chunks if available, else fallback to sentence splitting
  const allSentences = isAdhd && adhdChunks && adhdChunks.length > 0
    ? (adhdChunks[currentSection]?.content || adhdChunks[0]?.content || "")
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean)
    : displayParagraphs.flatMap((p) =>
        p
          .split(/\n+/)
          .flatMap((line) =>
            line.split(/(?<=[.!?])\s+/).map((s) => s.trim())
          )
          .filter(Boolean)
      );

  useEffect(() => {
    setActiveSentence(0);
  }, [safeSectionIndex, mode]);

  useEffect(() => {
    if (isAdhd && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSentence, isAdhd]);

  // Handle case where section doesn't exist (shouldn't happen, but safe guard)
  if (!section) {
    return (
      <div className="mx-auto max-w-2xl text-center text-muted-foreground">
        <p>Section not found.</p>
      </div>
    );
  }

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
          : displayHeading}
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
          {displayParagraphs.map((p, i) => (
            <p key={i} className="leading-relaxed text-foreground">
              {showReadAloudHighlight
                ? paragraphSegsList[i]?.map((seg, j) => {
                    if (seg.type !== "word")
                      return <span key={j}>{seg.value}</span>;
                    // Check transformed key_terms first, then fallback to GLOSSARY
                    const meaning = keyTermsMap[seg.value.toLowerCase()] ||
                      Object.entries(GLOSSARY).find(
                        ([k]) => k.toLowerCase() === seg.value.toLowerCase()
                      )?.[1];
                    const isHighlight = seg.wordIndex === currentReadAloudWordIndex;
                    return meaning ? (
                      <KeywordTooltip
                        key={j}
                        meaning={meaning}
                        mode={accessibilityMode}
                        className={
                          (isHighlight ? "read-aloud-highlight " : "") +
                          "cursor-help border-b-2 border-dashed border-primary/50 "
                        }
                      >
                        {seg.value}
                      </KeywordTooltip>
                    ) : (
                      <span
                        key={j}
                        className={isHighlight ? "read-aloud-highlight" : ""}
                      >
                        {seg.value}
                      </span>
                    );
                  }) ?? null
                : (() => {
                    // Use transformed key_terms if available, else use GLOSSARY
                    const entries = useTransformed && transformedContent?.key_terms
                      ? transformedContent.key_terms.map(t => [t.word, t.simple_meaning] as [string, string])
                      : Object.entries(GLOSSARY);
                    const sortedEntries = entries.sort((a, b) => b[0].length - a[0].length);
                    const parts: { key: string; text: string; meaning?: string }[] = [];
                    let remaining = p;
                    let keyIndex = 0;

                    while (remaining.length > 0) {
                      let found = false;
                      for (const [word, meaning] of sortedEntries) {
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

                    return parts.map((part) =>
                      part.meaning ? (
                        <KeywordTooltip
                          key={part.key}
                          meaning={part.meaning}
                          mode={accessibilityMode}
                          className="cursor-help border-b-2 border-dashed border-primary/50 text-foreground"
                        >
                          {part.text}
                        </KeywordTooltip>
                      ) : (
                        <span key={part.key}>{part.text}</span>
                      )
                    );
                  })()}
            </p>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {displayParagraphs.map((p, i) => (
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
                : (() => {
                    // When we have transformed content, wrap key terms with tooltips
                    if (useTransformed && transformedContent?.key_terms?.length) {
                      const entries = transformedContent.key_terms.map((t) => [t.word, t.simple_meaning] as [string, string]).sort((a, b) => b[0].length - a[0].length);
                      const parts: { key: string; text: string; meaning?: string }[] = [];
                      let remaining = p;
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
                      return parts.map((part) =>
                        part.meaning ? (
                          <KeywordTooltip
                            key={part.key}
                            meaning={part.meaning}
                            mode={accessibilityMode}
                            className="cursor-help border-b-2 border-dashed border-primary/50 text-foreground"
                          >
                            {part.text}
                          </KeywordTooltip>
                        ) : (
                          <span key={part.key}>{part.text}</span>
                        )
                      );
                    }
                    return p;
                  })()}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
