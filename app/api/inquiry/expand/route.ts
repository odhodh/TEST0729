import { NextResponse } from "next/server";

const thinkingForms = `
지식의 구조: 전제(당연한 출발점을 따져 묻기), 정의(자기 언어로 다시 세우기), 층위(표면 뒤 구조·원리로 내려가기), 단위(분석 단위 바꾸기), 척도(평가 기준 따지기), 범위(적용 한계 긋기).
관계와 구분: 대립(반대 입장 함께 세우기), 차이(미세한 다름 변별하기), 유사성(같은 구조 전이하기), 위계(기초·응용 관계 세우기).
변화와 시간: 변화(변동 추적하기), 고정점(보존되는 것 식별하기), 순서(인과 선후 가리기), 결과(파장 추적하기), 여지(다른 가능성 가정하기).
작동과 영향: 변수(요인 분리·통제하기), 조건(성립 환경 한정하기), 목적(의도·동기 읽기), 수단(방법·경로 비교하기).
결여와 일탈: 모름(무지의 지점 특정하기), 오류(사고 오류 진단하기), 빈자리(빠진 것 발견하기), 예외(깨지는 사례 찾기), 반례(명제 반증하기).
사고 자체: 사례(추상을 구체화하기), 시점(보는 위치 옮기기), 모형(핵심만 남겨 단순화하기).
`;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { topic?: string; perspective?: { name?: string; question?: string; description?: string; example?: string } } | null;
  const topic = body?.topic?.trim();
  const perspective = body?.perspective;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const configuredModel = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim().replace(/^models\//, "");
  const model = /^[a-zA-Z0-9._-]+$/.test(configuredModel) ? configuredModel : "gemini-2.5-flash";
  if (!topic || !perspective?.name) return NextResponse.json({ error: "주제와 선택한 관점이 필요합니다." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "Vercel에 GEMINI_API_KEY 환경변수를 설정해 주세요." }, { status: 503 });

  const prompt = `You are a high-school inquiry coach. A student selected the topic "${topic}" and the thinking lens "${perspective.name}". Their lens question is "${perspective.question || ""}". Use the following 27-form thinking framework as a reference:\n${thinkingForms}\nChoose exactly three complementary forms from this framework that deepen the selected lens. Return three distinct Korean approaches. Each title must start with the chosen thinking form in brackets, for example "[전제] 당연한 출발점 다시 묻기". Each approach needs a focused question, a specific example tied to the topic, and an activity the student can perform. In the detail, include a closing-record sentence pattern such as "~를 ...로 규명함" or "~의 조건을 짚어 한정함". Do not state final conclusions. Return JSON only: {"approaches":[{"title":"...","text":"...","detail":"..."},{"title":"...","text":"...","detail":"..."},{"title":"...","text":"...","detail":"..."}]}`;
  const call = (modelName: string) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.65 } }) });
  let response = await call(model);
  if (response.status === 404 && model !== "gemini-2.5-flash") response = await call("gemini-2.5-flash");
  if (!response.ok) return NextResponse.json({ error: `Gemini 확장 호출에 실패했습니다. (${response.status})` }, { status: 502 });
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  try {
    const parsed = JSON.parse((text || "").replace(/^```json\s*|\s*```$/g, ""));
    if (!Array.isArray(parsed.approaches) || parsed.approaches.length !== 3) throw new Error("Invalid approaches");
    return NextResponse.json({ approaches: parsed.approaches });
  } catch { return NextResponse.json({ error: "Gemini 확장 응답을 해석하지 못했습니다." }, { status: 502 }); }
}
