import { NextRequest, NextResponse } from "next/server";
import { transformWithGemini } from "@/lib/gemini";
import { fleschReadingEase, complexityReductionPercent } from "@/lib/readingMetrics";
import type { TransformRequestBody, TransformedContent } from "@/types/ai";

// Simple in-memory rate limiting (10 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  return realIP || "unknown";
}

function createFallbackContent(text: string): TransformedContent {
  const originalScore = fleschReadingEase(text);
  return {
    simplified_version: text,
    dyslexia_version: text,
    adhd_chunked_version: [
      {
        section_title: "Content",
        content: text,
        key_point: "Main content",
      },
    ],
    key_terms: [],
    summary: text.slice(0, 200) + (text.length > 200 ? "..." : ""),
    difficulty_level: originalScore < 30 ? 8 : originalScore < 60 ? 5 : 3,
    original_complexity: originalScore,
    transformed_complexity: originalScore,
    complexity_reduction: 0,
  };
}

export async function POST(request: NextRequest) {
  console.log("[API /transform] POST request received");
  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip)) {
      console.log("[API /transform] Rate limit exceeded");
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body: TransformRequestBody = await request.json();
    console.log("[API /transform] Request body received", { textLength: body.text?.length || 0 });

    // Validation
    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json({ error: "Invalid request: text is required" }, { status: 400 });
    }

    const text = body.text.trim();
    if (text.length === 0) {
      return NextResponse.json({ error: "Text cannot be empty" }, { status: 400 });
    }

    // Enforce max length (2000 words / ~10,000 chars)
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 2000) {
      return NextResponse.json(
        { error: "Text too long. Maximum 2000 words allowed." },
        { status: 400 }
      );
    }

    // Calculate original complexity
    const originalScore = fleschReadingEase(text);

    // Transform with Gemini
    console.log("[API /transform] Calling transformWithGemini");
    const transformed = await transformWithGemini(text, body.profile);
    console.log("[API /transform] transformWithGemini result:", transformed ? "Success" : "Failed");

    if (!transformed) {
      // Fallback to original content
      console.log("[API /transform] Using fallback content");
      const fallback = createFallbackContent(text);
      return NextResponse.json(fallback);
    }

    // Calculate transformed complexity
    const transformedScore = fleschReadingEase(transformed.simplified_version);
    const reduction = complexityReductionPercent(originalScore, transformedScore);

    // Add metrics
    const result: TransformedContent = {
      ...transformed,
      original_complexity: originalScore,
      transformed_complexity: transformedScore,
      complexity_reduction: reduction,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /transform] Error:", error);
    // Don't try to parse request body again - it's already been consumed
    const fallback = createFallbackContent("Error occurred during transformation.");
    return NextResponse.json(fallback);
  }
}
