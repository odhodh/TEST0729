import { NextResponse } from "next/server";

type Perspective = { name?: string; question?: string; description?: string };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { topic?: string; direction?: "science" | "humanities"; perspective?: Perspective } | null;
  const topic = body?.topic?.trim();
  const perspective = body?.perspective;
  const direction = body?.direction === "humanities" ? "인문·사회·예술" : "과학·기술·수리";
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const configuredModel = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim().replace(/^models\//, "");
  const model = /^[a-zA-Z0-9._-]+$/.test(configuredModel) ? configuredModel : "gemini-2.5-flash";
  if (!topic || !perspective?.name) return NextResponse.json({ error: "주제와 선택한 관점이 필요합니다." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "Vercel 환경 변수 GEMINI_API_KEY를 설정해 주세요." }, { status: 503 });

  const prompt = `너는 학생의 연구 주제를 고도화하는 수석 탐구 설계 컨설턴트다.

입력 정보
- 탐구 주제: ${topic}
- 선택한 관점: [${perspective.name}] ${perspective.question || perspective.description || ""}
- 탐구 방향: ${direction}

선택 관점을 바탕으로 서로 다른 세 갈래의 탐구 길을 한국어로 제시하라. 세 길은 쉬움·보통·어려움의 차이가 절대 아니며, 각각 완전히 다른 포커스와 접근 방식을 가져야 한다. 첫 길은 내부 조건·성립 범위·한계에 집중하고, 둘째 길은 외부 확장·변형·다른 대상에의 적용에 집중하며, 셋째 길은 시각적·기하학적·구조적 모형으로의 전환에 집중하라. 단, 주제와 관점에 맞게 이 세 초점을 창의적으로 조정할 수 있다.

각 길에는 학생이 실제로 볼 데이터·사례·계산 또는 관찰, 수행할 실험·비교·증명, 마지막에 마주할 균열·경계·예외·발견을 한 편의 시나리오처럼 구체적으로 담아라. "밀어보는 길입니다", "균열을 들여다보게 됩니다", "경계를 시험받는 장면과 마주합니다"처럼 지적 호기심을 자극하는 학술적 어조를 사용하라. 결론을 단정하지 말고 탐구 가능성으로 제시하라.

JSON만 반환하라. approaches는 정확히 3개이며 각 객체는 title, focus, question, detail을 가진다.
{"approaches":[{"title":"첫 번째 길의 매력적인 소제목","focus":"이 길의 서로 다른 포커스","question":"학생이 던질 날카로운 핵심 질문 1~2문장","detail":"파고드는 결 3~4문장"},{"title":"두 번째 길의 매력적인 소제목","focus":"...","question":"...","detail":"..."},{"title":"세 번째 길의 매력적인 소제목","focus":"...","question":"...","detail":"..."}]}`;

  const call = (modelName: string) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.75 } }) });
  let response = await call(model);
  if (response.status === 404 && model !== "gemini-2.5-flash") response = await call("gemini-2.5-flash");
  if (!response.ok) return NextResponse.json({ error: `Gemini 호출에 실패했습니다. (${response.status})` }, { status: 502 });
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  try {
    const parsed = JSON.parse((text || "").replace(/^```json\s*|\s*```$/g, ""));
    if (!Array.isArray(parsed.approaches) || parsed.approaches.length !== 3) throw new Error("invalid approaches");
    return NextResponse.json({ approaches: parsed.approaches });
  } catch { return NextResponse.json({ error: "Gemini 응답을 세 갈래의 탐구 길로 해석하지 못했습니다." }, { status: 502 }); }
}
