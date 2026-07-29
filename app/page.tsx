"use client";

import { useMemo, useState } from "react";

type Direction = "science" | "humanities";
type Lens = { key: string; name: string; label: string; question: string; description: string };
type Path = { title: string; focus: string; question: string; detail: string };
type Plan = { basic: { what: string; how: string; discover: string }; deepening: Array<{ title: string; text: string; detail: string }> };
type Source = { title: string; url: string; type: string; publisher?: string };
type PerspectiveCase = { key: string; caseTitle?: string; connection?: string; question?: string; description?: string; example?: string };
type Generated = { perspectives?: PerspectiveCase[]; sources?: Source[] };

const lenses: Lens[] = [
  { key: "definition", name: "정의", label: "개념의 뼈대 세우기", question: "이 주제에서 정확히 무엇을 무엇으로 부르고, 어떤 단위로 나누어 볼 것인가?", description: "핵심 용어를 다시 정의하며 탐구의 출발선을 단단하게 세웁니다." },
  { key: "scope", name: "범위", label: "유효한 경계 찾기", question: "이 현상이나 공식은 어디까지 유효하고, 어느 순간부터 달라지는가?", description: "성립과 붕괴 사이의 경계선을 직접 시험하는 관점입니다." },
  { key: "similarity", name: "유사성", label: "닮은 구조 겹쳐 보기", question: "다른 개념이나 분야에서 이 주제와 닮은 구조는 무엇인가?", description: "멀리 떨어진 개념 사이에서 공통된 뼈대를 발견합니다." },
  { key: "hierarchy", name: "위계", label: "근본과 파생 나누기", question: "무엇이 토대가 되고, 무엇이 그 위에서 파생되는가?", description: "개념이 쌓이는 순서를 따라 논리의 계단을 살핍니다." },
  { key: "variable", name: "변수", label: "결정 요인 추적하기", question: "결과를 바꾸는 핵심 요인은 무엇이며 어떻게 얽히는가?", description: "조건을 바꿔 보며 변화의 원인을 비교합니다." },
  { key: "condition", name: "조건", label: "성립의 전제 찾기", question: "이 현상이나 공식이 성립하기 위한 필수 전제는 무엇인가?", description: "당연해 보이는 가정 하나하나를 검증합니다." },
  { key: "method", name: "수단", label: "도구와 경로 설계하기", question: "이 결론에 닿기 위해 어떤 자료와 도구를 어떻게 사용할 것인가?", description: "탐구의 방법 자체를 하나의 연구 대상으로 삼습니다." },
  { key: "exception", name: "예외", label: "균열과 반례 찾기", question: "일반적인 설명이 깨지거나 비껴 가는 사례는 무엇인가?", description: "예외에서 새로운 질문과 더 정확한 설명을 만납니다." },
  { key: "case", name: "사례", label: "현실의 장면으로 옮기기", question: "추상적인 개념은 실제 사례에서 어떤 모습으로 드러나는가?", description: "기호와 이론을 구체적인 문제의 장면으로 가져옵니다." },
  { key: "model", name: "모형", label: "그림과 구조로 번역하기", question: "복잡한 구조를 어떤 그림·도식·모형으로 설명할 수 있는가?", description: "눈에 보이지 않던 관계를 한눈에 드러냅니다." },
];

const fallbackPaths = (topic: string, lens: Lens): Path[] => [
  { title: "성립의 경계선을 끝까지 밀어보기", focus: "내부 조건과 한계를 시험하는 길", question: `${topic}은(는) 어떤 조건까지 유지되며, 정확히 어느 지점에서 설명력이 흔들리는가?`, detail: `가장 단순한 사례에서 출발해 조건을 하나씩 바꾸며 성립과 실패의 지도를 만드는 길입니다. 표·계산·관찰 기록을 쌓고, 반복되는 패턴을 증명이나 근거 자료로 다시 확인합니다. 익숙한 설명이 무너지는 장면과 마주하면 그 균열이 이 탐구의 가장 중요한 발견이 됩니다.` },
  { title: "변형된 세계로 확장해 보기", focus: "새 대상과 변형에 도전하는 길", question: `기존의 구조를 유지한 채 대상·환경·조건을 바꾸면 ${topic}은(는) 어떻게 새롭게 설명될 수 있는가?`, detail: `기준 사례를 하나 세운 뒤, 다른 조건과 사례에 차례로 적용하며 확장의 가능성을 밀어보는 길입니다. 같은 분석 틀로 자료를 비교하고, 새 변수가 들어올 때 무엇을 보완해야 하는지 추적합니다. 자연스럽게 이어지는 확장과 갑자기 막히는 지점을 비교하며 일반화의 진짜 의미를 발견하게 됩니다.` },
  { title: "구조를 눈으로 번역해 보기", focus: "시각적·기하학적 모형으로 전환하는 길", question: `${topic}의 핵심 관계를 그림·도식·그래프·간단한 모형으로 바꾸면 무엇이 새롭게 보이는가?`, detail: `텍스트와 계산으로만 보던 관계를 흐름도·표·그래프·개념도로 옮겨 보는 길입니다. 여러 사례를 같은 모형 위에 놓고 반복되는 부분과 끊기는 부분을 관찰합니다. 계산만으로는 놓치기 쉬운 대칭과 단절을 마주하며, 자신만의 설명 모형을 설계하게 됩니다.` },
];

function fallbackPlan(topic: string, lens: Lens, path: Path): Plan {
  return {
    basic: { what: path.question, how: `${topic} 관련 선행 자료와 사례를 먼저 모은 뒤, ${path.focus}에 맞는 비교 기준을 세웁니다. 같은 형식의 표·도식·기록지에 근거를 정리하며 관찰과 해석을 구분합니다.`, discover: `${lens.name} 관점으로 자료를 배열하면 예상과 다른 조건, 예외, 자료의 빈자리가 드러날 수 있습니다. 그 장면을 다음 탐구 질문으로 남겨 둡니다.` },
    deepening: [
      { title: "경계를 흔드는 변수", text: `${topic}의 결과를 가장 크게 바꾸는 한 가지 요인은 무엇이며, 그 요인을 통제할 수 있을까?`, detail: "한 변수만 바꾼 비교 사례를 모아 변화를 추적합니다. 그 과정에서 원인처럼 보였던 것이 사실은 다른 조건과 얽혀 있었음을 발견할 수 있습니다." },
      { title: "반례가 들려주는 이야기", text: "기존 설명이 들어맞지 않는 사례는 무엇이며, 그 사례는 무엇을 새로 요구하는가?", detail: "반례를 오류로 밀어내지 않고 자료의 중심으로 가져옵니다. 설명이 비껴 가는 지점에서 더 섬세한 조건과 새로운 가설을 만납니다." },
      { title: "다른 세계에서의 재검증", text: "다른 사례·집단·환경에서도 같은 탐구 틀이 유지되는가?", detail: "처음 사례와 성격이 다른 대상을 골라 같은 기준으로 다시 살펴봅니다. 탐구의 범위가 넓어지는 순간과 더 이상 적용할 수 없는 장면을 함께 기록합니다." },
    ],
  };
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<"topic" | "direction">("topic");
  const [topic, setTopic] = useState("");
  const [direction, setDirection] = useState<Direction | null>(null);
  const [lensIndex, setLensIndex] = useState(0);
  const [pathIndex, setPathIndex] = useState(0);
  const [deepIndex, setDeepIndex] = useState(0);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [showFallbackCases, setShowFallbackCases] = useState(false);
  const [paths, setPaths] = useState<Path[] | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const lens = lenses[lensIndex];
  const activePaths = useMemo(() => paths || fallbackPaths(topic || "관심 주제", lens), [paths, topic, lens]);
  const path = activePaths[pathIndex];
  const activePlan = plan || fallbackPlan(topic || "관심 주제", lens, path);
  const deep = activePlan.deepening[deepIndex];
  const reportTitle = `${topic || "탐구 주제"} — ${lens.name} 관점에서 ${path.title}`;

  async function generatePerspectives() {
    if (!topic.trim()) { setNotice("먼저 파고들고 싶은 주제나 키워드를 입력해 주세요."); return; }
    if (!direction) { setNotice("탐구 방향을 하나 골라 주세요."); return; }
    setLoading(true); setNotice(""); setGenerated(null); setShowFallbackCases(false); setStep(2);
    try {
      const response = await fetch("/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, direction }) });
      if (!response.ok) throw new Error();
      const data = await response.json() as Generated;
      if (!data.perspectives?.length) throw new Error();
      setGenerated(data);
    } catch { setShowFallbackCases(true); setNotice("Gemini 사례 카드를 불러오지 못해 주제 기반 기본 사례를 표시했습니다."); }
    setLoading(false);
  }
  async function generatePaths() {
    setLoading(true); setNotice("");
    try {
      const response = await fetch("/api/inquiry/expand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, direction, perspective: lens }) });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.approaches)) throw new Error();
      setPaths(data.approaches); setPathIndex(0);
    } catch { setPaths(null); setNotice("Gemini 응답을 받지 못해 기본 세 갈래를 보여 드립니다."); }
    setLoading(false); setStep(3);
  }
  async function generatePlan() {
    setLoading(true); setNotice("");
    try {
      const response = await fetch("/api/inquiry/deepen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, direction, lens, path }) });
      const data = await response.json();
      if (!response.ok || !data.basic || !Array.isArray(data.deepening)) throw new Error();
      setPlan(data); setDeepIndex(0);
    } catch { setPlan(null); setNotice("Gemini 응답을 받지 못해 현재 선택을 바탕으로 기본 청사진을 만들었습니다."); }
    setLoading(false); setStep(4);
  }
  function reset() { setStep(1); setPhase("topic"); setTopic(""); setDirection(null); setLensIndex(0); setPathIndex(0); setDeepIndex(0); setGenerated(null); setPaths(null); setPlan(null); setNotice(""); }
  function downloadReport() {
    const text = `# ${reportTitle}\n\n- 탐구 주제: ${topic}\n- 탐구 방향: ${direction === "humanities" ? "인문·사회·예술" : "과학·기술·수리"}\n- 선택 관점: ${lens.name}\n- 선택한 길: ${path.title}\n\n## 무엇을 묻나\n${activePlan.basic.what}\n\n## 어떻게 알아보나\n${activePlan.basic.how}\n\n## 무엇을 만나게 되나\n${activePlan.basic.discover}\n\n## 심화 질문\n${deep.title}\n${deep.text}\n${deep.detail}\n`;
    localStorage.setItem("inquiry-studio-report", text);
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${(topic || "탐구보고서").replace(/[\\/:*?"<>|]/g, "_")}_탐구보고서.md`; link.click(); URL.revokeObjectURL(url);
  }

  return <main className="inquiry-page"><header className="page-nav"><button onClick={reset}>← 처음</button><span>학생 탐구</span><strong>탐구 주제 잡기</strong></header>{step > 1 && <div className="context-chips"><span>주제&nbsp; {topic}</span><i>→</i><b>결&nbsp; {direction === "humanities" ? "인문·사회·예술" : "과학·기술·수리"}</b><i>→</i><b>관점&nbsp; {lens.name}</b></div>}<section className={`stage stage-${step}`}>
    {step === 1 && <div className="start-stage"><Header eyebrow="시작" title={phase === "topic" ? "무엇을 파고들고 싶나요?" : "어떤 결로 탐구를 시작할까요?"} description={phase === "topic" ? "막연해도 됩니다. ‘기후위기’, ‘조선 신분제’, ‘호스가 신기하다’ 정도면 충분해요." : `‘${topic}’을 어떤 방식으로 탐구할지 골라 주세요.`} />{phase === "topic" ? <><textarea className="topic-input" rows={4} value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="예: MOF, 인체 약물 전달 / 수열과 급수를 활용한 부분분수 일반화" /><button className="next" onClick={() => topic.trim() ? setPhase("direction") : setNotice("주제를 입력해 주세요.")}>다음 →</button></> : <><div className="direction-choice"><button className={direction === "science" ? "picked" : ""} onClick={() => setDirection("science")}><small>과학·기술·수리</small><strong>관찰하고, 비교하고, 증명하기</strong><p>실험·계산·자료 분석으로 현상의 구조를 확인합니다.</p></button><button className={direction === "humanities" ? "picked" : ""} onClick={() => setDirection("humanities")}><small>인문·사회·예술</small><strong>해석하고, 맥락을 읽고, 서술하기</strong><p>사람·사회·문화의 의미와 관계를 깊이 살핍니다.</p></button></div><div className="actions"><button onClick={() => setPhase("topic")}>← 주제 수정</button><button className="next" disabled={loading} onClick={generatePerspectives}>{loading ? "Gemini가 관점을 준비하는 중…" : "관점 만나기 →"}</button></div></>}{notice && <p className="notice">{notice}</p>}</div>}
    {step === 2 && <div><Header eyebrow="관점 — 10가지 사고 형식" title="이 주제를 어떤 관점으로 파고들래요?" description="입력한 주제에 맞춰 관점별 실제 사례를 준비했습니다. 마음이 끌리는 카드 하나를 골라 보세요." />{loading ? <LoadingCards /> : generated?.perspectives?.length || showFallbackCases ? <>{notice && <div className="inline-notice"><span>{notice}</span><button onClick={generatePerspectives}>Gemini로 다시 생성</button></div>}<div className="lens-cards">{lenses.map((item, index) => { const ai = generated?.perspectives?.find((value) => value.key === item.key); const fallback = fallbackCase(topic, item); return <button key={item.key} onClick={() => setLensIndex(index)} className={lensIndex === index ? "selected" : ""}><small>관점 · {item.name}</small><h3>{ai?.caseTitle || fallback.caseTitle}</h3><p>{ai?.connection || ai?.description || fallback.connection}</p><em>탐구 질문 · {ai?.question || fallback.question}</em></button>; })}</div><FooterActions back={() => setStep(1)} next={generatePaths} nextLabel="다음 →" /></> : <div className="status-panel"><strong>사례 카드가 아직 준비되지 않았어요.</strong><p>{notice || "생성 결과가 비어 있습니다. 다시 시도하거나 기본 관점으로 계속할 수 있습니다."}</p><div><button onClick={generatePerspectives}>다시 생성</button><button className="next" onClick={() => setShowFallbackCases(true)}>기본 관점으로 계속 →</button></div></div>}</div>}
    {step === 3 && <div><Header eyebrow="세 길 — 파고드는 결" title="이 관점 안에서 어디를 파볼래요?" description="같은 관점이라도 파고들 길이 셋 있습니다. 난이도가 아니라 파고드는 결로 갈립니다. 가슴 뛰는 한 길을 고르세요." /><div className="chosen-lens"><small>선택한 관점 · {lens.name}</small><strong>{lens.question}</strong></div><div className="path-list">{activePaths.map((item, index) => <button key={item.title} onClick={() => setPathIndex(index)} className={pathIndex === index ? "selected" : ""}><b>{index + 1}</b><div><h3>{item.title}</h3><strong>{item.question}</strong><p>{item.detail}</p></div></button>)}</div><FooterActions back={() => setStep(2)} next={generatePlan} nextLabel={loading ? "탐구 청사진을 만드는 중…" : "다음 →"} disabled={loading} /></div>}
    {step === 4 && <div><Header eyebrow="기본 탐구" title="이 길의 탐구를 한 번에" description="고른 길의 탐구가 어떻게 펼쳐지는지 한 번에 보여 드립니다." /><div className="blueprint"><article><small>무엇을 묻나</small><h2>{activePlan.basic.what}</h2></article><article><small>어떻게 알아보나</small><p>{activePlan.basic.how}</p></article><article><small>무엇을 만나게 되나</small><p>{activePlan.basic.discover}</p></article></div><FooterActions back={() => setStep(3)} next={() => setStep(5)} nextLabel="한 층 더 깊이 →" /></div>}
    {step === 5 && <div><Header eyebrow="더 깊이 — 1단" title="한 층 더 깊이" description="지금 관점 안에서 한 층 더 들어가는 세 갈래입니다." /><div className="deep-list">{activePlan.deepening.map((item, index) => <button key={item.title} onClick={() => setDeepIndex(index)} className={deepIndex === index ? "selected" : ""}><b>{index + 1}</b><div><h3>{item.title}</h3><strong>{item.text}</strong><p>{item.detail}</p></div></button>)}</div><FooterActions back={() => setStep(4)} next={() => setStep(6)} nextLabel="보고서 목차 만들기 →" /></div>}
    {step === 6 && <div><Header eyebrow="마무리 — 탐구 보고서 목차" title="탐구 보고서의 뼈대" description="선택한 주제와 관점, 탐구의 길, 심화 질문을 보고서의 구조로 묶었습니다." /><div className="report-title"><small>보고서 제목</small><h2>{reportTitle}</h2></div><Report title="I. 서론" items={[["1.1", "탐구 동기와 배경", `${topic}에 관심을 갖게 된 계기와 문제 상황을 구체적으로 정리합니다.`], ["1.2", "탐구 질문과 목적", activePlan.basic.what]]} /><Report title="II. 본론" items={[["2.1", "이론적 배경과 자료", `${topic}와 관련된 핵심 개념, 선행 자료, 비교 기준을 정리합니다.`], ["2.2", "탐구 방법", activePlan.basic.how], ["2.3", "심화 분석", `${deep.text}을(를) 중심으로 사례와 근거를 분석합니다.`]]} /><Report title="III. 결론" items={[["3.1", "발견과 해석", activePlan.basic.discover], ["3.2", "한계와 후속 질문", "이번 탐구의 한계와 다음에 더 확인하고 싶은 질문을 씁니다."]]} /><div className="save-actions"><button onClick={() => setStep(5)}>← 이전</button><button onClick={downloadReport}>텍스트로 저장</button><button className="next" onClick={() => window.print()}>인쇄 / PDF 저장</button></div></div>}
  </section></main>;
}

function Header({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <header className="stage-header"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></header>; }
function LoadingCards() { return <div className="lens-cards loading-cards">{Array.from({ length: 10 }, (_, index) => <div key={index}><i /><b /><b /><em /></div>)}</div>; }
function FooterActions({ back, next, nextLabel, disabled = false }: { back: () => void; next: () => void; nextLabel: string; disabled?: boolean }) { return <div className="footer-actions"><button onClick={back}>← 이전</button><button onClick={next} className="next" disabled={disabled}>{nextLabel}</button></div>; }
function Report({ title, items }: { title: string; items: string[][] }) { return <section className="report"><h2>{title}</h2>{items.map(([number, heading, text]) => <article key={number}><b>{number}</b><div><strong>{heading}</strong><p>{text}</p><small>• 넣을 내용과 근거 자료를 구체적으로 기록하기</small></div></article>)}</section>; }
function fallbackCase(topic: string, lens: Lens) { return { caseTitle: `${topic}을(를) ${lens.name}의 렌즈로 다시 보기`, connection: `${topic}과(와) ${lens.name} 관점을 연결해 핵심 요소와 실제 적용 장면을 비교해 보는 탐구입니다.`, question: lens.question }; }
