"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSpeechNav } from "@/contexts/SpeechNavContext";

export default function UploadPage() {
  const router = useRouter();
  const { registerPageCommands, clearPageCommands, speak } = useSpeechNav();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerPageCommands({
      back: () => {
        router.push("/");
        speak("Going back.");
      },
    });
    return () => clearPageCommands();
  }, [router, registerPageCommands, clearPageCommands, speak]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        sessionStorage.setItem("neuroadapt-content", result);
        router.push("/learn?custom=1");
      } else {
        setError("Could not read file as text.");
      }
    };
    reader.onerror = () => setError("Failed to read file.");
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      reader.readAsText(file);
    } else {
      setError("Please upload a .txt file. PDF support coming soon.");
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
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
