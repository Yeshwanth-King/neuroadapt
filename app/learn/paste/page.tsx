"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSpeechNav } from "@/contexts/SpeechNavContext";

export default function PastePage() {
  const router = useRouter();
  const { registerPageCommands, clearPageCommands, speak } = useSpeechNav();
  const [text, setText] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && text.trim()) {
      sessionStorage.setItem("neuroadapt-content", text.trim());
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
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your lesson content here…"
            className="min-h-[200px] w-full resize-y rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            rows={10}
            aria-label="Lesson text"
          />
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
