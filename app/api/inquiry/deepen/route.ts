import { NextResponse } from "next/server";

type Lens = { name?: string; question?: string; description?: string };
type Path = { title?: string; focus?: string; question?: string; detail?: string };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { topic?: string; direction?: "science" | "humanities"; lens?: Lens; path?: Path } | null;
  const topic = body?.topic?.trim();
  const lens = body?.lens;
  const path = body?.path;
  const direction = body?.direction === "humanities" ? "인문·사회·예술" : "과학·기술·수리";
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim().replace(/^models\//, "");
  if (!topic || !lens?.name || !path?.title) return NextResponse.json({ error: "주제, 관점, 탐구 길이 필요합니다." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "Vercel 환경 변수 GEMINI_API_KEY를 설정해 주세요." }, { status: 503 });

  const prompt = `너는 학생의 연구 주제를 깊게 설계하는 수석 탐구 컨설턴트다.
주제: ${topic}
탐구 방향: ${direction}
선택 관점: [${lens.name}] ${lens.question || lens.description || ""}
선택한 탐구 길: ${path.title} — ${path.question || path.focus || ""}

이전 선택을 반드시 이어받아 다음 두 단계를 한국어로 풍성하게 작성하라.
1) 기본 탐구 청사진: 무엇을 묻나, 어떻게 알아보나, 무엇을 만나게 되나. 각각 3~4문장으로 구체적인 자료·사례·실험 또는 분석 절차·예상되는 경계와 난관을 담아라.
2) 한 층 더 깊이 들어가는 질문 3개: 서로 다른 초점을 갖게 하고, 각 항목에 제목, 날카로운 질문, 구체적으로 파고들 활동과 지적 발견을 3~4문장으로 작성하라. 이전 선택과 무관한 일반론을 쓰지 말라. 결론을 단정하지 말고, 학생이 직접 확인할 수 있는 탐구로 제시하라.

JSON만 반환하라.
{"basic":{"what":"...","how":"...","discover":"..."},"deepening":[{"title":"...","text":"...","detail":"..."},{"title":"...","text":"...","detail":"..."},{"title":"...","text":"...","detail":"..."}]}`;
  const call = (modelName: string) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.72 } }) });
  let response = await call(model);
  if (response.status === 404 && model !== "gemini-2.5-flash") response = await call("gemini-2.5-flash");
  if (!response.ok) return NextResponse.json({ error: `Gemini 호출에 실패했습니다. (${response.status})` }, { status: 502 });
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  try {
    const data = JSON.parse((text || "").replace(/^```json\s*|\s*```$/g, ""));
    if (!data.basic || !Array.isArray(data.deepening) || data.deepening.length < 3) throw new Error("invalid response");
    return NextResponse.json({ basic: data.basic, deepening: data.deepening.slice(0, 3) });
  } catch { return NextResponse.json({ error: "Gemini 응답을 탐구 청사진으로 해석하지 못했습니다." }, { status: 502 }); }
}
