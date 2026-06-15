import { FREE_MODEL, PRO_MODEL } from "./constants";

export async function callOpenRouter(
  prompt: string,
  isPro: boolean
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const model = isPro ? PRO_MODEL : FREE_MODEL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eslify.io";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": appUrl,
      "X-Title": "ESLify",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "OpenRouter API error");
  }

  return data.choices?.[0]?.message?.content || "";
}
