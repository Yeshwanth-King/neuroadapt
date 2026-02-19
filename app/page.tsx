import Link from "next/link";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 py-12">
      <main className="flex w-full max-w-lg flex-col items-center gap-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
            NeuroAdapt
          </h1>
          <p className="text-lg text-[var(--foreground)]/90">
            Education that adapts to you.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <Button href="/learn?demo=1" variant="primary" aria-label="Try demo lesson">
            Try Demo Lesson
          </Button>
          <Button href="/learn/paste" variant="secondary" aria-label="Paste your own text">
            Paste Text
          </Button>
          <Button href="/learn/upload" variant="tertiary" aria-label="Upload a lesson file">
            Upload Lesson
          </Button>
        </div>

        <Link
          href="/profile"
          className="min-h-[44px] text-sm text-[var(--foreground)]/70 underline underline-offset-2 hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Set up my learning preferences"
        >
          Set up my learning preferences
        </Link>
      </main>
    </div>
  );
}
