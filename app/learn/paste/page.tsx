"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { useSpeechNav } from "@/contexts/SpeechNavContext";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useTransform } from "@/lib/hooks/useTransform";
import type { TransformProfile } from "@/types/ai";

const PROFILE_KEY = "neuroadapt-learner-profile";

export default function PastePage() {
  const router = useRouter();
  const { registerPageCommands, clearPageCommands, speak } = useSpeechNav();
  const { setTransformedContent, setIsTransforming } = useAccessibility();
  const { transform, isTransforming, error } = useTransform();
  const [text, setText] = useState("");
  const [hasTransformed, setHasTransformed] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);

  useEffect(() => {
    registerPageCommands({
      continue: () => {
        document.getElementById("paste-submit")?.click();
        speak("Continuing to lesson.");
      },
      back: () => {
        router.push("/");
        speak("Going back.");
      },
    });
    return () => clearPageCommands();
  }, [router, registerPageCommands, clearPageCommands, speak]);

  useEffect(() => {
    setIsTransforming(isTransforming);
  }, [isTransforming, setIsTransforming]);

  const handleTransform = async () => {
    console.log("[PastePage] handleTransform called", { textLength: text.trim().length });
    if (!text.trim()) {
      console.log("[PastePage] No text to transform");
      return;
    }
    setHasTransformed(false);
    setUseOriginal(false);

    // Get profile from sessionStorage
    let profile: TransformProfile | undefined;
    try {
      const raw = sessionStorage.getItem(PROFILE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { focusDuration?: string; difficulty?: string };
        profile = {};
        if (p.focusDuration === "short" || p.focusDuration === "medium" || p.focusDuration === "long") {
          profile.focusDuration = p.focusDuration;
        }
        if (p.difficulty === "simpler" || p.difficulty === "standard" || p.difficulty === "as-is") {
          profile.difficulty = p.difficulty;
        }
        if (Object.keys(profile).length === 0) {
          profile = undefined;
        }
      }
    } catch {}

    console.log("[PastePage] Calling transform with:", { textLength: text.trim().length, profile });
    // Force refresh to test API - remove this after testing
    const result = await transform(text, profile, true);
    console.log("[PastePage] Transform result:", result ? "Success" : "Failed");
    if (result) {
      setTransformedContent(result);
      setHasTransformed(true);
      speak(`Transformation complete. Complexity reduced by ${Math.abs(result.complexity_reduction || 0).toFixed(1)} percent.`);
      
      // Auto-navigate to learn page after successful transformation
      // Store content and transformed flag
      sessionStorage.setItem("neuroadapt-content", text.trim());
      const hash = text.trim().split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      sessionStorage.setItem("neuroadapt-use-transformed", Math.abs(hash).toString(36));
      
      // Navigate after a short delay to allow state updates
      setTimeout(() => {
        router.push("/learn?custom=1");
      }, 500);
    } else {
      speak("Transformation failed. Using original content.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && text.trim()) {
      sessionStorage.setItem("neuroadapt-content", text.trim());
      if (!useOriginal && hasTransformed) {
        // Store transformed content reference
        const hash = text.trim().split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0);
        sessionStorage.setItem("neuroadapt-use-transformed", Math.abs(hash).toString(36));
      }
      router.push("/learn?custom=1");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to home
        </Link>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Paste your lesson
        </h1>
        <p className="mb-6 text-muted-foreground">
          Paste text below, then continue to read it in your preferred mode.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setHasTransformed(false);
              setUseOriginal(false);
            }}
            placeholder="Paste or type your lesson content here…"
            className="min-h-[200px] w-full resize-y rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            rows={10}
            aria-label="Lesson text"
          />
          <div className="flex flex-wrap gap-4 items-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("[PastePage] Button clicked!");
                handleTransform();
              }}
              disabled={!text.trim() || isTransforming}
              className="btn-accessible flex items-center gap-2 bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Transform with AI"
            >
              {isTransforming ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Transforming...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Transform with AI
                </>
              )}
            </button>
            {hasTransformed && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useOriginal}
                  onChange={(e) => setUseOriginal(e.target.checked)}
                  className="h-5 w-5 rounded border-border"
                />
                <span className="text-sm text-muted-foreground">Use original text</span>
              </label>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              id="paste-submit"
              type="submit"
              className="btn-accessible bg-primary text-primary-foreground hover:opacity-90"
              aria-label="Continue to lesson"
            >
              Continue to lesson
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
