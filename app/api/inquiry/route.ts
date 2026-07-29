import { NextResponse } from "next/server";

type ResearchSource = { title: string; url: string; type: "논문·학술지" | "전공 서적" | "뉴스·웹 자료"; publisher?: string };
const keys = ["definition", "scope", "similarity", "hierarchy", "variable", "condition", "method", "exception", "case", "model"];

async function fetchCrossref(topic: string, type: "journal-article" | "book", label: ResearchSource["type"]) {
  try {
    const params = new URLSearchParams({ "query.bibliographic": topic, filter: `type:${type}`, rows: "3", select: "title,URL,container-title,publisher,DOI" });
    const response = await fetch(`https://api.crossref.org/works?${params}`, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) return [];
    const data = await response.json();
    return (data?.message?.items || []).map((item: { title?: string[]; URL?: string; DOI?: string; "container-title"?: string[]; publisher?: string }) => ({ title: item.title?.[0] || item.DOI || "학술 자료", url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ""), type: label, publisher: item["container-title"]?.[0] || item.publisher })).filter((item: ResearchSource) => item.url);
  } catch { return []; }
}

function groundingSources(metadata: unknown): ResearchSource[] {
  const chunks = (metadata as { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> })?.groundingChunks || [];
  return chunks.map((chunk) => chunk.web).filter((web): web is { uri: string; title?: string } => Boolean(web?.uri)).map((web) => ({ title: web.title || new URL(web.uri).hostname, url: web.uri, type: /news|bbc|reuters|apnews|kbs|ytn|yna\.co/i.test(web.uri) ? "뉴스·웹 자료" : "뉴스·웹 자료" }));
}

function uniqueSources(sources: ResearchSource[]) {
  const seen = new Set<string>();
  return sources.filter((source) => !seen.has(source.url) && Boolean(seen.add(source.url))).slice(0, 9);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { topic?: string } | null;
  const topic = body?.topic?.trim();
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const configuredModel = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim().replace(/^models\//, "");
  const model = /^[a-zA-Z0-9._-]+$/.test(configuredModel) ? configuredModel : "gemini-2.5-flash";
  if (!topic) return NextResponse.json({ error: "주제를 입력해 주세요." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "Vercel에 GEMINI_API_KEY 환경변수를 설정해 주세요." }, { status: 503 });

  const schema = `{\"perspectives\":[${keys.map((key) => `{\"key\":\"${key}\",\"question\":\"...\",\"description\":\"...\",\"example\":\"...\"}`).join(",")}],\"paths\":[{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"},{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"},{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"}],\"basic\":{\"what\":\"...\",\"how\":\"...\",\"discover\":\"...\"},\"deepening\":[{\"title\":\"...\",\"text\":\"...\"},{\"title\":\"...\",\"text\":\"...\"},{\"title\":\"...\",\"text\":\"...\"}],\"report\":{\"title\":\"...\",\"intro\":\"...\",\"question\":\"...\",\"background\":\"...\",\"method\":\"...\"}}`;
  const prompt = `You are an expert high-school inquiry designer. Use the topic "${topic}" to create evidence-based Korean content for ten lenses: definition, scope, similarity, hierarchy, variable, condition, method, exception, case, model. Include a specific question, explanation, and classroom-appropriate example for each. Then create three inquiry paths, a basic inquiry summary, three deepening prompts, and a report outline. Do not invent named sources or make conclusive claims. Return JSON only, in this exact shape: ${schema}`;
  const requestBody = { contents: [{ role: "user", parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.6 } };
  const callGemini = (modelName: string, tools = true) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tools ? requestBody : { ...requestBody, tools: undefined }) });
  let response = await callGemini(model);
  if (response.status === 404 && model !== "gemini-2.5-flash") response = await callGemini("gemini-2.5-flash");
  if (response.status === 400) response = await callGemini(model, false);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    let message = `Gemini 호출 실패 (${response.status})`;
    try { message += `: ${(JSON.parse(detail) as { error?: { message?: string } }).error?.message || detail.slice(0, 180)}`; } catch { if (detail) message += `: ${detail.slice(0, 180)}`; }
    return NextResponse.json({ error: message }, { status: 502 });
  }
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return NextResponse.json({ error: "Gemini가 빈 응답을 반환했습니다." }, { status: 502 });
  try {
    const generated = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    const [articles, books] = await Promise.all([fetchCrossref(topic, "journal-article", "논문·학술지"), fetchCrossref(topic, "book", "전공 서적")]);
    return NextResponse.json({ ...generated, sources: uniqueSources([...articles, ...books, ...groundingSources(result?.candidates?.[0]?.groundingMetadata)]) });
  } catch { return NextResponse.json({ error: "Gemini 응답 JSON을 해석하지 못했습니다." }, { status: 502 }); }
}
