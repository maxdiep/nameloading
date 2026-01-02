import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function embedText(input) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in environment.");
  }

  const text = (input ?? "").toString().trim();
  if (!text) return [];

  // OpenAI Retrieval guide uses text-embedding-3-small for semantic similarity. :contentReference[oaicite:2]{index=2}
  const resp = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 12000), // simple guardrail
  });

  return resp.data[0].embedding;
}

export function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
