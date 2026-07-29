import { NextResponse } from "next/server";

const keys = ["definition", "scope", "similarity", "hierarchy", "variable", "condition", "method", "exception", "case", "model"];
const forms = ["정의", "범위", "유사성", "위계", "변수", "조건", "수단", "예외", "사례", "모형"];

type PerspectiveCase = { key?: string; caseTitle?: string; connection?: string; question?: string };

function parseJson(text: string) {
  const trimmed = text.replace(/^```json\s*|\s*```$/g, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  return JSON.parse(start >= 0 && end >= start ? trimmed.slice(start, end + 1) : trimmed);
}

function validateCards(text: string) {
  const generated = parseJson(text);
  const cards = (generated?.perspectives || []) as PerspectiveCase[];
  const valid = cards.filter((card) => keys.includes(card.key || "") && Boolean(card.caseTitle?.trim()) && Boolean(card.connection?.trim()) && Boolean(card.question?.trim()));
  if (valid.length !== 10) throw new Error("incomplete cards");
  return valid;
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

  const schema = `{"perspectives":[${keys.map((key) => `{"key":"${key}","caseTitle":"구체적 사례 제목","connection":"주제와 관점을 연결한 2~3문장 설명","question":"학생이 직접 탐구할 질문"}`).join(",")}]}`;
  const prompt = `너는 학생의 탐구 주제를 실제 연구 상황으로 바꾸는 수석 탐구 설계 컨설턴트다.

입력 주제: "${topic}"
탐구 방향: "${direction}"
사고 형식: ${forms.join(", ")}

출력 범위는 2페이지의 사례 카드 10개뿐이다. 탐구 길, 청사진, 심화 질문, 보고서 목차, 자료 목록 등 3페이지 이후에 사용할 내용은 절대 생성하거나 언급하지 않는다.

정확히 10개의 카드 결과를 만든다. 각 카드는 주제와 관점을 따로 설명하지 말고, 둘을 하나의 구체적인 탐구 사례로 결합해야 한다.
- 주제는 사례의 대상과 맥락, 관점은 그 사례를 분석하는 질문 또는 판단 기준이다.
- caseTitle은 실제로 조사·관찰·비교·계산할 수 있는 장면을 짧고 매력적으로 쓴다.
- connection은 주제의 구체적 요소와 관점의 질문이 어떻게 맞물리는지, 무엇을 보고 비교·확인할지를 2~3문장으로 쓴다.
- question은 학생이 직접 답을 찾아갈 수 있는 날카로운 탐구 질문 한 문장이다.
- "이 관점은 탐구의 출발점이다", "이 관점으로 살펴본다" 같은 관점의 일반 정의·추상적 설명·문구 반복은 절대 쓰지 않는다.
- 카드마다 서로 다른 대상·조건·자료·현장·문제 맥락을 사용한다. 사실 여부가 불확실한 고유명사·수치·결과는 꾸며내지 않는다.

JSON만 반환한다. 형식: ${schema}`;
  const call = (modelName: string, structured = true) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: structured ? { temperature: 0.55, responseMimeType: "application/json" } : { temperature: 0.55 } }) });
  let response = await call(model);
  if (response.status === 404 && model !== "gemini-2.5-flash") response = await call("gemini-2.5-flash");
  if (response.status === 400) response = await call(model, false);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json({ error: `Gemini 사례 카드 생성에 실패했습니다. (${response.status})`, detail: detail.slice(0, 240) }, { status: 502 });
  }
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return NextResponse.json({ error: "Gemini가 사례 카드 응답을 반환하지 않았습니다." }, { status: 502 });
  try {
    return NextResponse.json({ perspectives: validateCards(text) });
  } catch {
    const retry = await call(model, false);
    if (retry.ok) {
      const retryResult = await retry.json();
      const retryText = retryResult?.candidates?.[0]?.content?.parts?.[0]?.text;
      try { return NextResponse.json({ perspectives: validateCards(retryText || "") }); } catch { /* fall through */ }
    }
    return NextResponse.json({ error: "Gemini 사례 카드 형식을 해석하지 못했습니다." }, { status: 502 });
  }
}
