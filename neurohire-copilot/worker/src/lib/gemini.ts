export async function callGemini(
  apiKey: string,
  model: string, // "gemini-1.5-flash" or similar
  systemPrompt: string,
  userPrompt: string,
  responseSchema: object,
  mock: boolean,
  mockFixture: any
): Promise<any> {
  if (mock) {
    return mockFixture;
  }

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  // Standard API Endpoint for Gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as any;
  try {
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  } catch (e: any) {
    throw new Error(`Gemini invalid response structure: ${e.message}`);
  }
}
