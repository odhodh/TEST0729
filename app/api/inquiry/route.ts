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
  const prompt = `너는 학생의 탐구 주제를 실제 연구 상황으로 바꾸는 수석 탐구 설계 컨설턴트다.

입력 주제: "${topic}"
탐구 방향: "${direction}"
사고 형식: ${forms.join(", ")}

반드시 10개의 카드 결과를 만든다. 각 카드는 주제와 관점을 따로 설명하지 말고, 둘을 하나의 구체적인 탐구 사례로 결합해야 한다.

핵심 원칙:
1. 주제는 사례의 대상과 맥락이다. 관점은 그 사례를 분석하는 질문 또는 판단 기준이다.
2. "이 관점은 탐구의 출발점이다", "이 관점으로 살펴본다"처럼 관점의 일반 정의를 설명하는 문장은 절대 쓰지 않는다.
3. 각 caseTitle은 실제로 조사·관찰·비교·계산할 수 있는 장면을 제목으로 쓴다. 단순히 "${topic}의 정의"처럼 쓰지 않는다.
4. connection은 해당 사례에서 주제의 구체적 요소가 관점의 질문과 어떻게 맞물리는지 2~3문장으로 설명한다. 무엇을 보고, 무엇을 비교하거나 확인할지 반드시 포함한다.
5. question은 학생이 그 사례에서 직접 답을 찾아갈 수 있는 날카로운 탐구 질문 한 문장이다.
6. 10개 카드는 서로 다른 대상·조건·자료·현장·문제 맥락을 보여야 한다. 같은 문구나 사례의 반복은 금지한다.
7. 사실 여부가 불확실한 고유명사·수치·연구 결과를 꾸며내지 않는다. 학생이 공개 자료·교과 개념·관찰·계산으로 확인할 수 있는 상황만 제시한다.

예시 원리: 주제가 "MOF를 활용한 약물 전달"이고 관점이 구조와 기능이라면, MOF의 기공 크기·표면 작용기·약물 저장과 방출 조건이 연결된 사례를 제시하고, 어떤 조건을 알아야 전달을 정확히 이해했다고 말할 수 있는지 질문해야 한다. 관점의 사전적 정의를 설명해서는 안 된다.

선택 가능한 탐구 방향 3개, 청사진, 심화 질문 3개, 보고서 개요도 함께 작성한다. 결론을 단정하지 말고 JSON만 반환하라. 형식: ${schema}`;
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
    const validCards = generated?.perspectives?.filter((card: { key?: string; caseTitle?: string; connection?: string; question?: string }) => keys.includes(card.key || "") && Boolean(card.caseTitle?.trim()) && Boolean(card.connection?.trim()) && Boolean(card.question?.trim()));
    if (!Array.isArray(validCards) || validCards.length !== 10) throw new Error("incomplete perspective cards");
    generated.perspectives = validCards;
    const [articles, books] = await Promise.all([crossref(topic, "journal-article", "논문·학술지"), crossref(topic, "book", "전공 서적")]);
    return NextResponse.json({ ...generated, sources: uniqueSources([...articles, ...books, ...groundingSources(result?.candidates?.[0]?.groundingMetadata)]) });
  } catch { return NextResponse.json({ error: "Gemini 응답을 JSON으로 해석하지 못했습니다." }, { status: 502 }); }
}
