/**
 * AI transformation contract.
 * Frontend depends on this exact structure from /api/transform.
 */

export interface AdhdChunk {
  section_title: string;
  content: string;
  key_point: string;
}

export interface KeyTerm {
  word: string;
  simple_meaning: string;
}

export interface TransformedContent {
  simplified_version: string;
  dyslexia_version: string;
  adhd_chunked_version: AdhdChunk[];
  key_terms: KeyTerm[];
  summary: string;
  difficulty_level: number;
  original_complexity?: number;
  transformed_complexity?: number;
  complexity_reduction?: number;
}

export interface TransformProfile {
  focusDuration?: "short" | "medium" | "long";
  difficulty?: "simpler" | "standard" | "as-is";
}

export interface TransformRequestBody {
  text: string;
  profile?: TransformProfile;
}
