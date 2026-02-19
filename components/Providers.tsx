"use client";

import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { SpeechNavProvider } from "@/contexts/SpeechNavContext";
import { SpeechNavTrigger } from "@/components/SpeechNavTrigger";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AccessibilityProvider>
      <SpeechNavProvider>
        {children}
        <SpeechNavTrigger />
      </SpeechNavProvider>
    </AccessibilityProvider>
  );
}
