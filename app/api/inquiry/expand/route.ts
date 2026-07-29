import { NextResponse } from "next/server";

type Perspective = { name?: string; question?: string; description?: string; caseTitle?: string; connection?: string };
type ResearchSource = { title: string; url: string; type: "논문·학술지" | "전공 서적"; publisher?: string };
type Approach = { title?: string; focus?: string; question?: string; detail?: string; sourceIndex?: number };

async function findResearch(topic: string): Promise<ResearchSource[]> {
  try {
    const params = new URLSearchParams({ "query.bibliographic": topic, rows: "10", select: "title,URL,DOI,type,container-title,publisher" });
    const response = await fetch(`https://api.crossref.org/works?${params}`, { headers: { "User-Agent": "InquiryTopicStudio/1.0 (educational research helper)" }, next: { revalidate: 86400 } });
    if (!response.ok) return [];
    const data = await response.json();
    return (data?.message?.items || []).map((item: { title?: string[]; URL?: string; DOI?: string; type?: string; "container-title"?: string[]; publisher?: string }) => ({
      title: item.title?.[0] || item["container-title"]?.[0] || "관련 학술 자료",
      url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ""),
      type: item.type === "book" || item.type === "book-chapter" ? "전공 서적" : "논문·학술지",
      publisher: item.publisher,
    })).filter((item: ResearchSource) => item.url && item.title).slice(0, 8);
  } catch { return []; }
}

function sentenceCount(text: string) { return text.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean).length; }

function validateApproaches(value: unknown, sources: ResearchSource[]) {
  const approaches = (value as { approaches?: Approach[] })?.approaches;
  if (!Array.isArray(approaches) || approaches.length !== 3) return null;
  const valid = approaches.every((item) => typeof item.title === "string" && typeof item.focus === "string" && typeof item.question === "string" && typeof item.detail === "string" && item.title.trim().length > 3 && item.detail.trim().length > 180 && sentenceCount(item.detail) >= 5 && sentenceCount(item.detail) <= 6);
  if (!valid) return null;
  return approaches.map((item) => ({ title: item.title!.trim(), focus: item.focus!.trim(), question: item.question!.trim(), detail: item.detail!.trim(), source: typeof item.sourceIndex === "number" ? sources[item.sourceIndex - 1] : undefined }));
}

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

  const sources = await findResearch(topic);
  const researchCatalog = sources.length ? sources.map((source, index) => `${index + 1}. ${source.title} (${source.type}${source.publisher ? `, ${source.publisher}` : ""})`).join("\n") : "검색된 자료가 없습니다. 검증 가능한 학술 연구의 일반적인 조사 방법을 제안하세요.";
  const prompt = `당신은 학생에게 선택한 실제 탐구 사례를 세 갈래의 풍부한 탐구로 제안하는 수석 탐구 설계 컨설턴트입니다.

이번 응답은 오직 '3페이지: 세 갈래의 탐구 길'만 작성합니다. 4페이지 이후의 청사진, 심화 질문, 보고서 목차나 다음 단계는 절대 언급하지 마세요.

[학생의 입력]
- 탐구 주제: ${topic}
- 탐구 방향: ${direction}
- 선택한 관점: [${perspective.name}] ${perspective.question || perspective.description || ""}
- 2페이지에서 선택한 구체 사례 제목: ${perspective.caseTitle || "선택한 사례"}
- 그 사례의 설명: ${perspective.connection || perspective.description || ""}
- 사례에서 출발한 탐구 질문: ${perspective.question || ""}

[관련 학술 자료 목록]
${researchCatalog}

선택한 '구체 사례'를 출발점으로만 삼아 서로 다른 세 길을 만드세요. 단순한 난이도 차이가 아니라, 1번은 사례의 내부 조건·작동 한계, 2번은 다른 대상·환경으로의 비교와 변형, 3번은 구조·자료·모형을 새롭게 읽는 길처럼 포커스와 자료 다루는 방식이 확실히 달라야 합니다. 주제나 관점의 일반적 정의를 반복하지 마세요.

각 길의 detail은 정확히 5~6개의 완결된 한국어 문장으로 쓰세요. 첫 문장은 선택 사례의 구체적 연구 장면을 열고, 둘째 문장은 학생이 살펴볼 자료·논문·실험값·기록을 밝히고, 셋째와 넷째 문장은 비교·실험·증명·해석의 실제 행동을 제안하고, 마지막 문장은 예상되는 경계·예외·발견을 생생하게 제시하세요. 자료 목록을 참고한 경우 sourceIndex에 그 번호를 넣으세요. 자료가 없거나 직접 연결하기 어렵다면 sourceIndex는 생략하세요.

JSON만 반환하세요.
{"approaches":[{"title":"매력적인 길의 제목","focus":"이 길의 고유한 초점","question":"학생이 던질 날카로운 질문","detail":"정확히 5~6문장의 구체적인 탐구 제안.","sourceIndex":1}]}`;

  const call = (modelName: string, structured: boolean) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.65, ...(structured ? { responseMimeType: "application/json" } : {}) } }) });
  let response = await call(model, true);
  if (response.status === 404 && model !== "gemini-2.5-flash") response = await call("gemini-2.5-flash", true);
  if (!response.ok) return NextResponse.json({ error: `Gemini 호출에 실패했습니다. (${response.status})` }, { status: 502 });
  let result = await response.json();
  let text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  let parsed: unknown;
  try { parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")); } catch { parsed = null; }
  let approaches = validateApproaches(parsed, sources);
  if (!approaches) {
    response = await call(model, false);
    if (!response.ok) return NextResponse.json({ error: "Gemini 응답 형식을 확인하지 못했습니다." }, { status: 502 });
    result = await response.json(); text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    try { parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")); } catch { parsed = null; }
    approaches = validateApproaches(parsed, sources);
  }
  if (!approaches) return NextResponse.json({ error: "Gemini가 세 갈래 탐구 내용을 완성하지 못했습니다." }, { status: 502 });
  return NextResponse.json({ approaches });
}
