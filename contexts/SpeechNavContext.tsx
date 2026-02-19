"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getCommandKey, SPEECH_STORAGE_KEY } from "@/lib/speechCommands";

declare global {
  interface Window {
    SpeechRecognition?: new () => {
      start: () => void;
      stop: () => void;
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onstart: () => void;
      onend: () => void;
      onerror: (e: Event) => void;
      onresult: (e: unknown) => void;
    };
    webkitSpeechRecognition?: Window["SpeechRecognition"];
  }
}

type CommandHandler = (payload?: number) => void;

interface SpeechNavState {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  listening: boolean;
  registerPageCommands: (commands: Record<string, CommandHandler>) => void;
  clearPageCommands: () => void;
  speak: (text: string) => void;
}

const SpeechNavContext = createContext<SpeechNavState | null>(null);

const DEBOUNCE_MS = 700;
const FONT_DEBOUNCE_MS = 1400;
const FONT_KEYS = new Set<string>(["fontBigger", "fontSmaller"]);

export function SpeechNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [enabled, setEnabledState] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SPEECH_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [listening, setListening] = useState(false);
  const pageCommandsRef = useRef<Record<string, CommandHandler>>({});
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommandRef = useRef<{ key: string; at: number } | null>(null);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SPEECH_STORAGE_KEY, v ? "1" : "0");
      } catch {}
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  }, []);

  const globalCommandsRef = useRef<Record<string, CommandHandler>>({});
  useEffect(() => {
    globalCommandsRef.current = {
      home: () => {
        router.push("/");
        speak("Going home.");
      },
      tryDemo: () => {
        router.push("/learn");
        speak("Opening demo lesson.");
      },
      pasteText: () => {
        router.push("/learn/paste");
        speak("Paste text.");
      },
      upload: () => {
        router.push("/learn/upload");
        speak("Upload lesson.");
      },
      preferences: () => {
        router.push("/profile");
        speak("Learning preferences.");
      },
      turnOff: () => {
        setEnabled(false);
        speak("Speech navigation off.");
      },
    };
  }, [router, speak, setEnabled]);

  const registerPageCommands = useCallback((commands: Record<string, CommandHandler>) => {
    pageCommandsRef.current = commands;
  }, []);

  const clearPageCommands = useCallback(() => {
    pageCommandsRef.current = {};
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("[SpeechNav] recognition started");
      setListening(true);
    };
    recognition.onend = () => {
      console.log("[SpeechNav] recognition ended");
      setListening(false);
      if (!enabledRef.current || recognitionRef.current !== recognition) return;
      restartTimeoutRef.current = setTimeout(() => {
        restartTimeoutRef.current = null;
        if (!enabledRef.current || recognitionRef.current !== recognition) return;
        try {
          console.log("[SpeechNav] restarting recognition");
          recognition.start();
        } catch (err) {
          console.log("[SpeechNav] restart error", err);
        }
      }, 180);
    };
    recognition.onerror = (event: Event & { error?: string }) => {
      const err = (event as { error?: string }).error;
      console.log("[SpeechNav] recognition error", err, event);
      setListening(false);
      if (err === "aborted" || err === "not-allowed") return;
      if (
        err === "network" ||
        err === "service-not-allowed" ||
        err === "language-not-supported"
      ) {
        speak("Speech recognition needs an internet connection. Try again when online.");
        return;
      }
      if (!enabledRef.current || recognitionRef.current !== recognition) return;
      restartTimeoutRef.current = setTimeout(() => {
        restartTimeoutRef.current = null;
        if (!enabledRef.current || recognitionRef.current !== recognition) return;
        try {
          recognition.start();
        } catch {}
      }, 600);
    };

    recognition.onresult = (event: unknown) => {
      const e = event as {
        results: Array<{ [i: number]: { transcript: string; confidence?: number }; length: number; isFinal?: boolean }>;
      };
      const resultsLength = e.results.length;
      const last = resultsLength - 1;
      const lastResult = e.results[last];
      const firstItem = lastResult?.[0] as { transcript: string; confidence?: number } | undefined;
      const transcript = firstItem?.transcript?.trim() ?? "";
      const result = getCommandKey(transcript);
      if (!result) return;
      const now = Date.now();
      const lastCmd = lastCommandRef.current;
      const debounceMs = FONT_KEYS.has(result.key) ? FONT_DEBOUNCE_MS : DEBOUNCE_MS;
      if (lastCmd?.key === result.key && now - lastCmd.at < debounceMs) return;
      lastCommandRef.current = { key: result.key, at: now };

      const pageHandler = pageCommandsRef.current[result.key];
      const globalHandler = globalCommandsRef.current[result.key];
      const handler = pageHandler ?? globalHandler;
      if (handler) {
        handler(result.payload);
        return;
      }
      if (result.key === "goToSection" && result.payload != null) {
        const goHandler = pageCommandsRef.current["goToSection"];
        if (goHandler) goHandler(result.payload);
      }
    };

    recognitionRef.current = recognition;
    try {
      console.log("[SpeechNav] starting recognition (enabled=true)");
      recognition.start();
    } catch (err) {
      console.log("[SpeechNav] initial start error", err);
    }

    return () => {
      console.log("[SpeechNav] cleanup: stopping recognition");
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      try {
        recognition.stop();
      } catch {}
      recognitionRef.current = null;
      setListening(false);
    };
  }, [enabled]);

  return (
    <SpeechNavContext.Provider
      value={{
        enabled,
        setEnabled,
        listening,
        registerPageCommands,
        clearPageCommands,
        speak,
      }}
    >
      {children}
    </SpeechNavContext.Provider>
  );
}

export function useSpeechNav() {
  const ctx = useContext(SpeechNavContext);
  if (!ctx)
    throw new Error("useSpeechNav must be used within SpeechNavProvider");
  return ctx;
}
