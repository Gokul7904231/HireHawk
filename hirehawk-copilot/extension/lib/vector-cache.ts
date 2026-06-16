import { create, insert, search } from "@orama/orama";

export interface TailorOutput {
  tailored_bullets: { project_or_role: string; bullet: string }[];
  cover_letter_paragraphs: string[];
  cold_email: { subject: string; body: string };
  referral_message: string;
  claims: any[];
  any_unsupported_claims: boolean;
}

// Simple deterministic hash-seeded vector generator for mock mode
export function getDeterministicVector(text: string, dimensions = 384): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const vector: number[] = [];
  let seed = Math.abs(hash);
  for (let d = 0; d < dimensions; d++) {
    seed = (seed * 9301 + 49297) % 233280;
    vector.push(seed / 233280);
  }
  
  // Normalize vector
  const dotProduct = vector.reduce((sum, val) => sum + val * val, 0);
  const len = Math.sqrt(dotProduct);
  return vector.map(v => v / (len || 1));
}

let dbInstance: any = null;

async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await create({
    schema: {
      jdText: "string",
      embedding: "vector[384]",
      tailoredJson: "string"
    }
  });
  return dbInstance;
}

export async function cacheGet(jdMarkdown: string): Promise<TailorOutput | null> {
  const db = await getDb();
  const vector = getDeterministicVector(jdMarkdown);

  const results = await search(db, {
    mode: "vector",
    vector: {
      value: vector,
      property: "embedding"
    },
    similarity: 0.95, // Cosine similarity threshold
    limit: 1
  });

  const hit = results.hits?.[0];
  if (!hit) return null;

  try {
    return JSON.parse((hit.document as any).tailoredJson) as TailorOutput;
  } catch {
    return null;
  }
}

export async function cacheSet(jdMarkdown: string, output: TailorOutput): Promise<void> {
  const db = await getDb();
  const vector = getDeterministicVector(jdMarkdown);
  
  await insert(db, {
    jdText: jdMarkdown,
    embedding: vector,
    tailoredJson: JSON.stringify(output)
  });
}
