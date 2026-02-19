"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { AccessibilityMode } from "@/data/demoLesson";
import type { TransformedContent } from "@/types/ai";

export type AdhdThemeId = "calm" | "sage" | "dark";

const ADHD_THEME_STORAGE_KEY = "neuroadapt-adhd-theme";

interface AccessibilityState {
  mode: AccessibilityMode;
  setMode: (m: AccessibilityMode) => void;
  fontSize: number;
  setFontSize: Dispatch<SetStateAction<number>>;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  currentReadAloudWordIndex: number | null;
  setCurrentReadAloudWordIndex: (n: number | null) => void;
  adhdTheme: AdhdThemeId;
  setAdhdTheme: (t: AdhdThemeId) => void;
  transformedContent: TransformedContent | null;
  setTransformedContent: (content: TransformedContent | null) => void;
  isTransforming: boolean;
  setIsTransforming: (v: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityState | null>(null);

function loadAdhdTheme(): AdhdThemeId {
  if (typeof window === "undefined") return "calm";
  try {
    const s = localStorage.getItem(ADHD_THEME_STORAGE_KEY);
    if (s === "calm" || s === "sage" || s === "dark") return s;
  } catch {}
  return "calm";
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AccessibilityMode>("normal");
  const [fontSize, setFontSize] = useState(18);
  const [highContrast, setHighContrast] = useState(false);
  const [currentReadAloudWordIndex, setCurrentReadAloudWordIndex] = useState<number | null>(null);
  const [adhdTheme, setAdhdThemeState] = useState<AdhdThemeId>(() => loadAdhdTheme());
  const [transformedContent, setTransformedContent] = useState<TransformedContent | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);

  const setAdhdTheme = (t: AdhdThemeId) => {
    setAdhdThemeState(t);
    try {
      localStorage.setItem(ADHD_THEME_STORAGE_KEY, t);
    } catch {}
  };

  return (
    <AccessibilityContext.Provider
      value={{
        mode,
        setMode,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        currentReadAloudWordIndex,
        setCurrentReadAloudWordIndex,
        adhdTheme,
        setAdhdTheme,
        transformedContent,
        setTransformedContent,
        isTransforming,
        setIsTransforming,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx)
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
