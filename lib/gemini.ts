import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, buildUserPrompt } from "./prompts";
import type { TransformedContent } from "@/types/ai";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn("[Gemini] GEMINI_API_KEY not set. AI transformation will use fallback.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const MODEL = "gemini-2.5-flash";

/**
 * Call Gemini API to transform text.
 * Returns transformed content or null on error.
 */
export async function transformWithGemini(
  text: string,
  profile?: { focusDuration?: string; difficulty?: string }
): Promise<TransformedContent | null> {
  console.log("[Gemini] transformWithGemini called", { textLength: text.length, hasApiKey: !!API_KEY, hasAi: !!ai });
  if (!ai || !API_KEY) {
    console.warn("[Gemini] API key not configured, returning null");
    return null;
  }

  try {
    const prompt = buildUserPrompt(text, {
      focusDuration: profile?.focusDuration as "short" | "medium" | "long" | undefined,
      difficulty: profile?.difficulty as "simpler" | "standard" | "as-is" | undefined,
    });

    console.log("[Gemini] Calling generateContent with model:", MODEL);
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: SYSTEM_INSTRUCTION + "\n\n" + prompt }],
        },
      ],
      config: {
        temperature: 0.3, // Lower temperature for better schema adherence
        maxOutputTokens: 16000, // Increased to handle full transformations without truncation
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            simplified_version: { type: "string" },
            dyslexia_version: { type: "string" },
            adhd_chunked_version: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section_title: { type: "string" },
                  content: { type: "string" },
                  key_point: { type: "string" },
                },
                required: ["section_title", "content", "key_point"],
              },
            },
            key_terms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  word: { type: "string" },
                  simple_meaning: { type: "string" },
                },
                required: ["word", "simple_meaning"],
              },
            },
            summary: { type: "string" },
            difficulty_level: { type: "number" },
          },
          required: [
            "simplified_version",
            "dyslexia_version",
            "adhd_chunked_version",
            "key_terms",
            "summary",
            "difficulty_level",
          ],
        },
      },
    });

    const jsonText = response.text ?? "";
    console.log("[Gemini] Got response, text length:", jsonText.length);

    // Check if response was truncated (common sign: ends mid-string or incomplete JSON)
    if (jsonText.length > 0 && !jsonText.trim().endsWith("}")) {
      console.warn("[Gemini] Response may be truncated - doesn't end with closing brace");
      console.log("[Gemini] Last 100 chars:", jsonText.slice(-100));
    }

    // With responseSchema, the response should be valid JSON
    // But we still handle parsing errors gracefully
    let parsed: TransformedContent;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("[Gemini] JSON parse error:", parseError);
      console.error("[Gemini] Response text length:", jsonText.length);
      console.error("[Gemini] Response text (first 500 chars):", jsonText.slice(0, 500));
      console.error("[Gemini] Response text (last 200 chars):", jsonText.slice(-200));
      throw new Error("Could not parse JSON from response - response may be truncated");
    }

    // Validate structure
    if (
      typeof parsed.simplified_version !== "string" ||
      typeof parsed.dyslexia_version !== "string" ||
      !Array.isArray(parsed.adhd_chunked_version) ||
      !Array.isArray(parsed.key_terms) ||
      typeof parsed.summary !== "string" ||
      typeof parsed.difficulty_level !== "number"
    ) {
      throw new Error("Invalid response structure from Gemini");
    }

    return parsed;
  } catch (error) {
    console.error("[Gemini] Transformation error:", error);
    return null;
  }
}
