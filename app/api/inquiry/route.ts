import { NextResponse } from "next/server";

const keys = ["definition", "scope", "similarity", "hierarchy", "variable", "condition", "method", "exception", "case", "model"];
const forms = ["정의", "범위", "유사성", "위계", "변수", "조건", "수단", "예외", "사례", "모형"];
type ResearchSource = { title: string; url: string; type: "논문·학술지" | "전공 서적"; publisher?: string };
type PerspectiveCase = { key?: string; caseTitle?: string; connection?: string; question?: string; sourceIndex?: number };

async function findResearch(topic: string): Promise<ResearchSource[]> {
  try {
    const params = new URLSearchParams({ "query.bibliographic": topic, rows: "12", select: "title,URL,DOI,type,container-title,publisher" });
    const response = await fetch(`https://api.crossref.org/works?${params}`, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) return [];
    const data = await response.json();
    const seen = new Set<string>();
    return (data?.message?.items || []).flatMap((item: { title?: string[]; URL?: string; DOI?: string; type?: string; "container-title"?: string[]; publisher?: string }) => {
      const url = item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : "");
      const title = item.title?.[0];
      if (!url || !title || seen.has(url)) return [];
      seen.add(url);
      return [{ title, url, type: item.type === "book" ? "전공 서적" : "논문·학술지", publisher: item["container-title"]?.[0] || item.publisher } as ResearchSource];
    }).slice(0, 12);
  } catch { return []; }
}

function parseJson(text: string) {
  const trimmed = text.replace(/^```json\s*|\s*```$/g, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  return JSON.parse(start >= 0 && end >= start ? trimmed.slice(start, end + 1) : trimmed);
}

function validateCards(text: string, sources: ResearchSource[]) {
  const generated = parseJson(text);
  const cards = (generated?.perspectives || []) as PerspectiveCase[];
  const valid = cards.filter((card) => keys.includes(card.key || "") && Boolean(card.caseTitle?.trim()) && Boolean(card.connection?.trim()) && Boolean(card.question?.trim()));
  if (valid.length !== 10) throw new Error("incomplete cards");
  return valid.map((card, index) => ({ ...card, source: sources.length ? sources[Math.max(0, Math.min(sources.length - 1, (Number(card.sourceIndex) || index + 1) - 1))] : undefined }));
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

  const sources = await findResearch(topic);
  const catalog = sources.length ? sources.map((source, index) => `${index + 1}. ${source.title} (${source.type}, ${source.url})`).join("\n") : "연계할 검색 자료를 찾지 못했습니다. 자료 링크 없이 카드 내용을 생성하세요.";
  const schema = `{"perspectives":[${keys.map((key) => `{"key":"${key}","caseTitle":"구체적인 사례 제목","connection":"정확히 세 문장인 사례 분석","question":"탐구 질문","sourceIndex":1}`).join(",")}]}`;
  const prompt = `너는 학생의 탐구 주제를 실제 연구 상황으로 바꾸는 수석 탐구 설계 컨설턴트다.

입력 주제: "${topic}"
탐구 방향: "${direction}"
사고 형식: ${forms.join(", ")}

아래 연구 자료 목록을 참고하여 2페이지 카드 10개만 작성하라.
${catalog}

카드 작성 규칙:
- 각 카드는 주제를 사례의 대상·맥락으로, 관점을 사례를 분석하는 질문·기준으로 사용한다. 주제와 관점을 따로 정의하거나 일반 관계를 설명하지 않는다.
- caseTitle은 실제로 조사·관찰·비교·계산할 수 있는 구체적 장면이다.
- connection은 정확히 세 문장으로 쓴다. 첫 문장은 해당 주제의 구체적 연구 상황, 둘째 문장은 관점으로 확인할 자료·변수·조건, 셋째 문장은 그 분석이 열어 주는 탐구의 쟁점 또는 경계다.
- question은 학생이 사례를 통해 답을 찾을 수 있는 한 문장이다.
- sourceIndex에는 이 사례와 가장 관련 깊은 연구 자료 번호를 넣는다. 목록이 없으면 0을 넣는다.
- 10개 카드는 서로 다른 자료·조건·사례 맥락을 사용하고, 추상적 관점 설명·단순 문구 반복·3페이지 이후 내용은 절대 넣지 않는다.

JSON만 반환하라. 형식: ${schema}`;
  const call = (modelName: string, structured = true) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: structured ? { temperature: 0.5, responseMimeType: "application/json" } : { temperature: 0.5 } }) });
  let response = await call(model);
  if (response.status === 404 && model !== "gemini-2.5-flash") response = await call("gemini-2.5-flash");
  if (response.status === 400) response = await call(model, false);
  if (!response.ok) return NextResponse.json({ error: `Gemini 사례 카드 생성에 실패했습니다. (${response.status})` }, { status: 502 });
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return NextResponse.json({ error: "Gemini가 사례 카드 응답을 반환하지 않았습니다." }, { status: 502 });
  try { return NextResponse.json({ perspectives: validateCards(text, sources) }); }
  catch {
    const retry = await call(model, false);
    if (retry.ok) {
      const retryResult = await retry.json();
      try { return NextResponse.json({ perspectives: validateCards(retryResult?.candidates?.[0]?.content?.parts?.[0]?.text || "", sources) }); } catch { /* fall through */ }
    }
    return NextResponse.json({ error: "Gemini 사례 카드 형식을 해석하지 못했습니다." }, { status: 502 });
  }
}
