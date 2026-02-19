"use client";

import { useSpeechNav } from "@/contexts/SpeechNavContext";
import { Mic, MicOff } from "lucide-react";

export function SpeechNavTrigger() {
  const { enabled, setEnabled, listening } = useSpeechNav();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`flex min-h-[56px] min-w-[56px] items-center justify-center rounded-full shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          enabled
            ? listening
              ? "bg-primary text-primary-foreground animate-pulse"
              : "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        }`}
        aria-label={enabled ? "Speech navigation on. Click to turn off." : "Turn on speech navigation"}
        title={enabled ? "Speech navigation on. Say \"next\", \"read\", \"go home\", etc. Click to turn off." : "Turn on speech navigation (say commands like next, read, go home)"}
      >
        {enabled ? (
          <Mic className="h-7 w-7" aria-hidden />
        ) : (
          <MicOff className="h-7 w-7" aria-hidden />
        )}
      </button>
      {enabled && (
        <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
          {listening ? "Listening…" : "Speech on"}
        </p>
      )}
    </div>
  );
}
