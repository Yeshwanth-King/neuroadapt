"use client";

import { useEffect, useRef } from "react";
import { useSpeechNav } from "@/contexts/SpeechNavContext";

const STARTUP_VOICE_STORAGE_KEY = "neuroadapt-startup-voice-played";
const DELAY_MS = 1500;

const STARTUP_MESSAGE =
  "Welcome to NeuroAdapt. Education that adapts to you. " +
  "You can try the demo lesson, paste your own text, or upload a lesson. " +
  "Use the links on the page, or say 'demo lesson', 'paste text', or 'upload' to navigate. " +
  "Say 'speech off' to turn off voice commands. Enjoy learning.";

export function StartupVoice() {
  const { speak } = useSpeechNav();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      if (sessionStorage.getItem(STARTUP_VOICE_STORAGE_KEY) === "1") return;
    } catch {
      return;
    }

    hasRun.current = true;
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(STARTUP_VOICE_STORAGE_KEY, "1");
      } catch {}
      speak(STARTUP_MESSAGE);
    }, DELAY_MS);

    return () => clearTimeout(t);
  }, [speak]);

  return null;
}
