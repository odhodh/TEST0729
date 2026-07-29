import { NextResponse } from "next/server";

const keys = ["definition", "scope", "similarity", "hierarchy", "variable", "condition", "method", "exception", "case", "model"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { topic?: string } | null;
  const topic = body?.topic?.trim();
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  if (!topic) return NextResponse.json({ error: "주제를 입력해 주세요." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다." }, { status: 503 });
  const schema = `{\"perspectives\":[${keys.map((key) => `{\"key\":\"${key}\",\"question\":\"...\",\"description\":\"...\",\"example\":\"...\"}`).join(",")}],\"paths\":[{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"},{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"},{\"title\":\"...\",\"text\":\"...\",\"detail\":\"...\"}],\"basic\":{\"what\":\"...\",\"how\":\"...\",\"discover\":\"...\"},\"deepening\":[{\"title\":\"...\",\"text\":\"...\"},{\"title\":\"...\",\"text\":\"...\"},{\"title\":\"...\",\"text\":\"...\"}],\"report\":{\"title\":\"...\",\"intro\":\"...\",\"question\":\"...\",\"background\":\"...\",\"method\":\"...\"}}`;
  const prompt = `고등학생의 탐구 주제 설계 전문가로서 입력 주제 "${topic}"를 10가지 사고 형식으로 확장하세요. 정의, 범위, 유사성, 위계, 변수, 조건, 수단, 예외, 사례, 모형 순서입니다. 각 항목에는 주제에 맞는 질문, 설명, 구체적 탐구 예시를 넣으세요. 이후 3개의 탐구 경로, 기본 탐구 요약, 심화 질문 3개, 보고서 목차 문구까지 작성하세요. 학생이 직접 관찰·비교·기록할 수 있는 열린 질문을 쓰고 결론을 단정하지 마세요. 반드시 JSON만 반환하세요. 구조: ${schema}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, responseMimeType: "application/json" } }) });
  if (!response.ok) return NextResponse.json({ error: "Gemini 응답을 받지 못했습니다." }, { status: 502 });
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return NextResponse.json({ error: "Gemini가 빈 응답을 반환했습니다." }, { status: 502 });
  try { return NextResponse.json(JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""))); } catch { return NextResponse.json({ error: "Gemini 응답 형식을 해석하지 못했습니다." }, { status: 502 }); }
}
