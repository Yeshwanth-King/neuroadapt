"use client";

import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { SpeechNavProvider } from "@/contexts/SpeechNavContext";
import { SpeechNavTrigger } from "@/components/SpeechNavTrigger";
import { StartupVoice } from "@/components/StartupVoice";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AccessibilityProvider>
      <SpeechNavProvider>
        <StartupVoice />
        {children}
        <SpeechNavTrigger />
      </SpeechNavProvider>
    </AccessibilityProvider>
  );
}
