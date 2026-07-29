import { NextResponse } from "next/server";

type SourceType = "논문·학술지" | "전공 서적" | "뉴스·웹 자료";
type ResearchSource = { title: string; url: string; type: SourceType; publisher?: string };
const keys = ["definition", "scope", "similarity", "hierarchy", "variable", "condition", "method", "exception", "case", "model"];
const forms = ["정의", "범위", "유사성", "위계", "변수", "조건", "수단", "예외", "사례", "모형"];

async function crossref(topic: string, type: "journal-article" | "book", label: SourceType) {
  try {
    const params = new URLSearchParams({ "query.bibliographic": topic, filter: `type:${type}`, rows: "3", select: "title,URL,container-title,publisher,DOI" });
    const response = await fetch(`https://api.crossref.org/works?${params}`, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) return [];
    const data = await response.json();
    return (data?.message?.items || []).map((item: { title?: string[]; URL?: string; DOI?: string; "container-title"?: string[]; publisher?: string }) => ({ title: item.title?.[0] || item.DOI || "참고 자료", url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ""), type: label, publisher: item["container-title"]?.[0] || item.publisher })).filter((item: ResearchSource) => item.url);
  } catch { return []; }
}

function groundingSources(metadata: unknown): ResearchSource[] {
  const chunks = (metadata as { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> })?.groundingChunks || [];
  return chunks.flatMap((chunk) => chunk.web?.uri ? [{ title: chunk.web.title || new URL(chunk.web.uri).hostname, url: chunk.web.uri, type: "뉴스·웹 자료" as const }] : []);
}

function uniqueSources(sources: ResearchSource[]) {
  const seen = new Set<string>();
  return sources.filter((source) => !seen.has(source.url) && Boolean(seen.add(source.url))).slice(0, 9);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { topic?: string; direction?: string } | null;
  const topic = body?.topic?.trim();
  const direction = body?.direction === "humanities" ? "인문·사회·예술" : "과학·기술·수리";
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const configuredModel = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim().replace(/^models\//, "");
  const model = /^[a-zA-Z0-9._-]+$/.test(configuredModel) ? configuredModel : "gemini-2.5-flash";
  if (!topic) return NextResponse.json({ error: "주제를 입력해 주세요." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "Vercel 환경 변수 GEMINI_API_KEY를 설정해 주세요." }, { status: 503 });
  const schema = `{\"perspectives\":[${keys.map((key) => `{\"key\":\"${key}\",\"caseTitle\":\"구체적 실제 사례 제목\",\"connection\":\"주제와 관점이 연결되는 2~3문장 설명\",\"question\":\"학생이 확인할 탐구 질문\"}`).join(",")}],\"paths\":[{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"},{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"},{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"}],\"basic\":{\"what\":\"...\",\"how\":\"...\",\"discover\":\"...\"},\"deepening\":[{\"title\":\"...\",\"text\":\"...\"},{\"title\":\"...\",\"text\":\"...\"},{\"title\":\"...\",\"text\":\"...\"}],\"report\":{\"title\":\"...\",\"intro\":\"...\",\"question\":\"...\",\"background\":\"...\",\"method\":\"...\"}}`;
  const prompt = `너는 학생의 막연한 아이디어를 다각도로 확장하는 사고 확장 전문가다. 주제는 "${topic}", 탐구 방향은 "${direction}"이다. 다음 10가지 사고 형식으로 주제를 분석하라: ${forms.join(", ")}. 각 관점별로 학생이 실제로 조사·관찰·비교할 수 있는 서로 다른 구체적 사례를 하나씩 제안하라. 사례는 관점 라벨, 짧고 매력적인 사례 제목(caseTitle), 주제와 관점이 만나는 이유를 설명하는 connection 2~3문장, 탐구 질문(question)으로 구성한다. 서로 다른 관점의 사례는 같은 대상을 반복하지 말고 서로 다른 맥락·자료·장면을 보여야 한다. 사실 여부가 불확실한 고유명사나 수치를 꾸며내지 말고, 학생 수준에서 검증 가능한 실제 현상·자료·문제 상황을 선택하라. 이후 선택 가능한 탐구 방향 3개, 청사진, 심화 질문 3개, 보고서 개요도 작성하라. 결론을 단정하지 말며 JSON만 반환하라. 형식: ${schema}`;
  const requestBody = { contents: [{ role: "user", parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.65 } };
  const call = (modelName: string, withSearch = true) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(withSearch ? requestBody : { ...requestBody, tools: undefined }) });
  let response = await call(model);
  if (response.status === 404 && model !== "gemini-2.5-flash") response = await call("gemini-2.5-flash");
  if (response.status === 400) response = await call(model, false);
  if (!response.ok) return NextResponse.json({ error: `Gemini 호출에 실패했습니다. (${response.status})` }, { status: 502 });
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return NextResponse.json({ error: "Gemini가 빈 응답을 반환했습니다." }, { status: 502 });
  try {
    const generated = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
    const [articles, books] = await Promise.all([crossref(topic, "journal-article", "논문·학술지"), crossref(topic, "book", "전공 서적")]);
    return NextResponse.json({ ...generated, sources: uniqueSources([...articles, ...books, ...groundingSources(result?.candidates?.[0]?.groundingMetadata)]) });
  } catch { return NextResponse.json({ error: "Gemini 응답을 JSON으로 해석하지 못했습니다." }, { status: 502 }); }
}
