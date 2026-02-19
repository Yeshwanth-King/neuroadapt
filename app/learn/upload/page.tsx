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

export default function UploadPage() {
  const router = useRouter();
  const { registerPageCommands, clearPageCommands, speak } = useSpeechNav();
  const { setTransformedContent, setIsTransforming } = useAccessibility();
  const { transform, isTransforming, error: transformError } = useTransform();
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [hasTransformed, setHasTransformed] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);

  useEffect(() => {
    registerPageCommands({
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setHasTransformed(false);
    setUseOriginal(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setFileContent(result);
        sessionStorage.setItem("neuroadapt-content", result);
      } else {
        setFileError("Could not read file as text.");
      }
    };
    reader.onerror = () => setFileError("Failed to read file.");
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      reader.readAsText(file);
    } else {
      setFileError("Please upload a .txt file. PDF support coming soon.");
    }
  };

  const handleTransform = async () => {
    if (!fileContent.trim()) return;
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

    const result = await transform(fileContent, profile);
    if (result) {
      setTransformedContent(result);
      setHasTransformed(true);
      speak(`Transformation complete. Complexity reduced by ${Math.abs(result.complexity_reduction || 0).toFixed(1)} percent.`);
    } else {
      speak("Transformation failed. Using original content.");
    }
  };

  const handleContinue = () => {
    if (!useOriginal && hasTransformed && fileContent) {
      const hash = fileContent.trim().split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      sessionStorage.setItem("neuroadapt-use-transformed", Math.abs(hash).toString(36));
    }
    router.push("/learn?custom=1");
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
          Upload a lesson
        </h1>
        <p className="mb-6 text-muted-foreground">
          Upload a .txt file. PDF support coming soon.
        </p>
        <div className="flex flex-col gap-4">
          <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 py-8 transition-colors hover:bg-secondary/50 focus-within:ring-2 focus-within:ring-foreground">
            <span className="mb-2 text-sm font-medium text-foreground">
              Choose a file
            </span>
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={handleFile}
              className="sr-only"
              aria-label="Choose lesson file"
            />
          </label>
          {fileContent && (
            <div className="flex flex-wrap gap-4 items-center">
              <button
                type="button"
                onClick={handleTransform}
                disabled={isTransforming}
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
            </div>
          )}
          {(fileError || transformError) && (
            <p className="text-sm text-destructive" role="alert">
              {fileError || transformError}
            </p>
          )}
          {fileContent && (
            <button
              type="button"
              onClick={handleContinue}
              className="btn-accessible bg-primary text-primary-foreground hover:opacity-90"
              aria-label="Continue to lesson"
            >
              Continue to lesson
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
