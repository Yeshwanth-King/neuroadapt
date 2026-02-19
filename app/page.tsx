import Link from "next/link";
import { BookOpen, Sparkles, Type } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl animate-fade-in-up text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <BookOpen
              className="h-8 w-8 text-primary-foreground"
              strokeWidth={2.5}
              aria-hidden
            />
          </div>
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          NeuroAdapt
        </h1>
        <p className="mb-12 text-xl leading-relaxed text-muted-foreground">
          Education that adapts to you.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/learn"
            className="btn-accessible flex items-center justify-center gap-3 bg-primary text-primary-foreground shadow-lg hover:opacity-90 active:scale-[0.98]"
            aria-label="Try the demo lesson"
          >
            <Sparkles className="h-6 w-6" aria-hidden />
            Try Demo Lesson
          </Link>

          <Link
            href="/learn/paste"
            className="btn-accessible flex items-center justify-center gap-3 bg-secondary text-secondary-foreground hover:opacity-80 active:scale-[0.98]"
            aria-label="Paste your own text to learn"
          >
            <Type className="h-6 w-6" aria-hidden />
            Paste Text
          </Link>

          <Link
            href="/learn/upload"
            className="btn-accessible flex items-center justify-center gap-3 border-2 border-border bg-background text-foreground hover:bg-secondary/50 active:scale-[0.98]"
            aria-label="Upload a lesson file"
          >
            Upload Lesson
          </Link>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Designed for dyslexia, ADHD, low vision &amp; more
        </p>

        <Link
          href="/profile"
          className="mt-6 inline-block min-h-[44px] text-sm text-primary underline underline-offset-2 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Set up my learning preferences"
        >
          Set up my learning preferences
        </Link>
      </div>
    </div>
  );
}
