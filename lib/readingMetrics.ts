/**
 * Flesch Reading Ease score and complexity metrics.
 * Formula: 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
 * Higher score = easier to read. Typical range ~0–100.
 */

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:es|ed|e)$/, "");
  const matches = word.match(/[aeiouy]+/g);
  return matches ? Math.max(1, matches.length) : 1;
}

function countWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const parts = trimmed.split(/[.!?]+/).filter(Boolean);
  return parts.length || 1;
}

/**
 * Compute Flesch Reading Ease score for the given text.
 * Returns a number typically in 0–100 (higher = easier). Can go negative for very hard text.
 */
export function fleschReadingEase(text: string): number {
  const words = countWords(text);
  const sentenceCount = countSentences(text);
  if (words.length === 0 || sentenceCount === 0) return 0;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSentenceLength = words.length / sentenceCount;
  const avgSyllablesPerWord = totalSyllables / words.length;

  return 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
}

/**
 * Compute percentage reduction in complexity for display.
 * Flesch Reading Ease: higher = easier to read. So we convert to a "complexity" scale
 * where complexity = 100 - Flesch (capped), so higher Flesch = lower complexity.
 * Reduction = (originalComplexity - transformedComplexity) / originalComplexity * 100.
 * This never exceeds 100% and is mathematically correct.
 */
export function complexityReductionPercent(originalScore: number, transformedScore: number): number {
  // Map Flesch (ease) to a 0–100 complexity scale: higher Flesch = lower complexity
  const originalComplexity = Math.max(0, 100 - originalScore);
  const transformedComplexity = Math.max(0, 100 - transformedScore);
  if (originalComplexity === 0) return 0;
  const reduction = ((originalComplexity - transformedComplexity) / originalComplexity) * 100;
  const clamped = Math.max(0, Math.min(100, reduction));
  return Math.round(clamped * 10) / 10;
}

export interface ReadingMetrics {
  fleschScore: number;
  wordCount: number;
  sentenceCount: number;
}

export function getReadingMetrics(text: string): ReadingMetrics {
  const words = countWords(text);
  return {
    fleschScore: fleschReadingEase(text),
    wordCount: words.length,
    sentenceCount: countSentences(text),
  };
}
