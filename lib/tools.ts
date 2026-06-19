import { getAnonId } from "@/lib/anon";

export async function generateContent(
  tool: "lesson" | "worksheet" | "check" | "corrector",
  prompt: string
): Promise<{
  content: string;
  creditsRemaining: number;
  isPro: boolean;
}> {
  const anonId = getAnonId();

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, prompt, anonId }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Generation failed") as Error & {
      status?: number;
      code?: string;
    };
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export function parseSections(
  body: string,
  sectionPattern: RegExp
): { heading: string; content: string }[] {
  const parts = body.split(sectionPattern);
  return parts
    .map((s) => {
      const lines = s.trim().split("\n");
      const heading = lines[0]?.trim() || "";
      const content = lines.slice(1).join("\n").trim();
      return { heading, content };
    })
    .filter((s) => s.heading || s.content);
}