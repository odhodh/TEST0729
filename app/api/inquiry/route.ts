import { NextResponse } from "next/server";

const keys = ["definition", "scope", "similarity", "hierarchy", "variable", "condition", "method", "exception", "case", "model"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { topic?: string } | null;
  const topic = body?.topic?.trim();
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const configuredModel = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim().replace(/^models\//, "");
  const model = /^[a-zA-Z0-9._-]+$/.test(configuredModel) ? configuredModel : "gemini-2.5-flash";
  if (!topic) return NextResponse.json({ error: "주제를 입력해 주세요." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "Vercel에 GEMINI_API_KEY 환경변수를 설정해 주세요." }, { status: 503 });

  const schema = `{\"perspectives\":[${keys.map((key) => `{\"key\":\"${key}\",\"question\":\"...\",\"description\":\"...\",\"example\":\"...\"}`).join(",")}],\"paths\":[{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"},{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"},{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"}],\"basic\":{\"what\":\"...\",\"how\":\"...\",\"discover\":\"...\"},\"deepening\":[{\"title\":\"...\",\"text\":\"...\"},{\"title\":\"...\",\"text\":\"...\"},{\"title\":\"...\",\"text\":\"...\"}],\"report\":{\"title\":\"...\",\"intro\":\"...\",\"question\":\"...\",\"background\":\"...\",\"method\":\"...\"}}`;
  const prompt = `You are an expert high-school inquiry designer. Using the student topic "${topic}", create content for ten thinking lenses in this order: definition, scope, similarity, hierarchy, variable, condition, method, exception, case, model. Each lens needs a topic-specific question, short explanation, and concrete example. Also create three inquiry paths, a basic inquiry summary, three deepening prompts, and report outline text. Keep questions open-ended and evidence-based. Return JSON only. All content values must be in Korean. JSON schema: ${schema}`;
  const requestBody = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } };
  let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
  if (response.status === 404 && model !== "gemini-2.5-flash") response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    let message = `Gemini 호출 실패 (${response.status})`;
    try { message += `: ${(JSON.parse(detail) as { error?: { message?: string } }).error?.message || detail.slice(0, 180)}`; } catch { if (detail) message += `: ${detail.slice(0, 180)}`; }
    return NextResponse.json({ error: message }, { status: 502 });
  }
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return NextResponse.json({ error: "Gemini가 빈 응답을 반환했습니다." }, { status: 502 });
  try { return NextResponse.json(JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""))); } catch { return NextResponse.json({ error: "Gemini 응답 JSON을 해석하지 못했습니다." }, { status: 502 }); }
}
