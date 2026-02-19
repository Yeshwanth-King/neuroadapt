import type { TransformProfile } from "@/types/ai";

const DIFFICULTY_INSTRUCTION: Record<string, string> = {
  simpler: "Target difficulty: MUCH easier. Use grade 4-6 vocabulary. Maximum 12 words per sentence. Break everything into very short sentences.",
  standard: "Target difficulty: moderate. Use grade 6-8 vocabulary. Maximum 15 words per sentence. Simplify complex concepts.",
  "as-is": "Target difficulty: keep close to original complexity but still simplify sentence structure. Use grade 8-10 vocabulary. Maximum 18 words per sentence.",
};

export const SYSTEM_INSTRUCTION = `You are an educational accessibility transformation engine. Your job is to make learning content more accessible while maintaining factual accuracy. 

CRITICAL RULES:
- You MUST transform the text meaningfully - output cannot be identical to input
- Use numeric constraints strictly (word counts, sentence lengths, etc.)
- Remove all citation markers [1][2][3] from transformed versions
- Simplify vocabulary to grade 6-8 level unless specified otherwise
- Break complex sentences into simple, short sentences
- Focus on cognitive accessibility: clarity, structure, and reduced cognitive load`;

export function buildUserPrompt(text: string, profile?: TransformProfile): string {
  const difficulty = profile?.difficulty ?? "standard";
  const difficultyInstruction = DIFFICULTY_INSTRUCTION[difficulty] ?? DIFFICULTY_INSTRUCTION.standard;

  return `Transform the following text for accessibility. ${difficultyInstruction}

CRITICAL: The transformed versions MUST be meaningfully different from the original. If output is too similar, rewrite again.

TEXT TO TRANSFORM:
---
${text}
---

TRANSFORMATION INSTRUCTIONS (STRICT CONSTRAINTS):

1. simplified_version:
   - Use sentences UNDER 15 words each
   - Replace advanced vocabulary with grade 6-8 level words
   - Remove citation markers like [1][2][3] completely
   - Break long paragraphs into maximum 3 sentences
   - Avoid compound sentences (use simple sentences)
   - Use active voice ("The plant makes food" not "Food is made by the plant")
   - Aim to reduce reading complexity by at least 20%

2. dyslexia_version:
   - Same rules as simplified_version PLUS:
   - Add clear paragraph breaks (new paragraph every 2-3 sentences)
   - Avoid homophones that could confuse (e.g., "there/their", "to/too")
   - Use common, concrete words instead of abstract terms
   - Break complex words into simpler alternatives
   - Maximum 80 words per paragraph

3. adhd_chunked_version:
   - Break content into EXACTLY 5-6 chunks (no more, no less)
   - Each chunk must represent ONE core concept only
   - Each chunk content: maximum 120 words
   - Each chunk: 1-3 short paragraphs (each paragraph max 3 sentences)
   - section_title: short heading (max 8 words)
   - key_point: one sentence takeaway (max 12 words)
   - Chunks must be logically sequential

4. key_terms:
   - Extract EXACTLY 5-8 words from the original text
   - Only include words above grade 8 reading level OR important domain-specific terms
   - For each term:
     * word: the exact word/phrase from text
     * simple_meaning: explanation under 10 words, using grade 6 vocabulary

5. summary:
   - Write 2-4 sentences summarizing the main points
   - Use simple language (grade 6-8 level)
   - Maximum 50 words total

6. difficulty_level:
   - Number from 1 (easiest) to 10 (hardest) for the ORIGINAL text
   - Consider: sentence length, vocabulary complexity, concept density

OUTPUT FORMAT:
Return valid JSON matching the required schema structure. The response will be automatically validated against the schema.`;
}
