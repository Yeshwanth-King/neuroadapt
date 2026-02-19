"use client";

import { useState, useCallback } from "react";
import type { TransformedContent, TransformProfile } from "@/types/ai";

const CACHE_PREFIX = "neuroadapt-transformed-";

function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

function getCacheKey(text: string): string {
  return `${CACHE_PREFIX}${simpleHash(text)}`;
}

function getCachedContent(text: string): TransformedContent | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getCacheKey(text);
    const cached = sessionStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached) as TransformedContent;
    }
  } catch {}
  return null;
}

function setCachedContent(text: string, content: TransformedContent): void {
  if (typeof window === "undefined") return;
  try {
    const key = getCacheKey(text);
    sessionStorage.setItem(key, JSON.stringify(content));
  } catch {}
}

export function useTransform() {
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transform = useCallback(
    async (text: string, profile?: TransformProfile, forceRefresh = false): Promise<TransformedContent | null> => {
      console.log("[useTransform] transform called", { textLength: text.trim().length, profile, forceRefresh });
      if (!text.trim()) {
        setError("Text cannot be empty");
        return null;
      }

      // Check cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cached = getCachedContent(text);
        if (cached) {
          console.log("[useTransform] Using cached content");
          return cached;
        }
      } else {
        console.log("[useTransform] Force refresh - skipping cache");
      }

      setIsTransforming(true);
      setError(null);

      try {
        console.log("[useTransform] Fetching from /api/transform");
        const response = await fetch("/api/transform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, profile }),
        });

        console.log("[useTransform] Response status:", response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const result: TransformedContent = await response.json();
        console.log("[useTransform] Success, got result:", Object.keys(result));
        setCachedContent(text, result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transformation failed";
        setError(message);
        console.error("[useTransform] Error:", err);
        return null;
      } finally {
        setIsTransforming(false);
      }
    },
    []
  );

  return { transform, isTransforming, error };
}
