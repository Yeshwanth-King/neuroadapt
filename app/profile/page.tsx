"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSpeechNav } from "@/contexts/SpeechNavContext";

const PROFILE_KEY = "neuroadapt-learner-profile";

type Profile = {
  mode: string;
  audio: string;
  focusDuration: string;
  difficulty: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { registerPageCommands, clearPageCommands, speak } = useSpeechNav();
  const [mode, setMode] = useState<string>("normal");
  const [audio, setAudio] = useState<string>("no");
  const [focusDuration, setFocusDuration] = useState<string>("medium");
  const [difficulty, setDifficulty] = useState<string>("standard");

  useEffect(() => {
    registerPageCommands({
      save: () => {
        document.getElementById("profile-save")?.click();
        speak("Preferences saved.");
      },
      skip: () => {
        document.getElementById("profile-skip")?.click();
        speak("Skipped.");
      },
      back: () => {
        router.push("/");
        speak("Going back.");
      },
    });
    return () => clearPageCommands();
  }, [router, registerPageCommands, clearPageCommands, speak]);

  const save = () => {
    const profile: Profile = { mode, audio, focusDuration, difficulty };
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
    router.push("/learn?optimized=1");
  };

  const skip = () => router.push("/");

  const options = (
    value: string,
    set: (v: string) => void,
    choices: { value: string; label: string }[]
  ) => (
    <div className="flex flex-wrap gap-3">
      {choices.map(({ value: v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => set(v)}
          className={`btn-accessible rounded-xl px-5 py-2 text-base font-bold ${
            value === v
              ? "bg-primary text-primary-foreground"
              : "border-2 border-border bg-secondary text-secondary-foreground hover:opacity-80"
          }`}
          aria-pressed={value === v}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to home
        </Link>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Learning preferences
        </h1>
        <p className="mb-8 text-muted-foreground">
          We’ll use this to suggest a default mode and settings.
        </p>

        <div className="space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Preferred reading mode?
            </h2>
            {options(mode, setMode, [
              { value: "normal", label: "Normal" },
              { value: "dyslexia", label: "Dyslexia-friendly" },
              { value: "adhd", label: "Focus (ADHD)" },
              { value: "low-vision", label: "Listen (audio)" },
            ])}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Need audio assistance?
            </h2>
            {options(audio, setAudio, [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ])}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Focus duration?
            </h2>
            {options(focusDuration, setFocusDuration, [
              { value: "short", label: "Short (3 min)" },
              { value: "medium", label: "Medium (5 min)" },
              { value: "long", label: "Long (10 min)" },
            ])}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Text difficulty?
            </h2>
            {options(difficulty, setDifficulty, [
              { value: "simpler", label: "Simpler" },
              { value: "standard", label: "Standard" },
              { value: "as-is", label: "As written" },
            ])}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <button
            id="profile-save"
            type="button"
            onClick={save}
            className="btn-accessible bg-primary text-primary-foreground hover:opacity-90"
            aria-label="Save preferences"
          >
            Save
          </button>
          <button
            id="profile-skip"
            type="button"
            onClick={skip}
            className="btn-accessible bg-secondary text-secondary-foreground hover:opacity-80"
            aria-label="Skip"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
