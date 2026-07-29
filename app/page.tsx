"use client";

import { useMemo, useState } from "react";

type Direction = "science" | "humanities";
type Lens = { key: string; name: string; label: string; question: string; description: string };
type Path = { title: string; focus: string; question: string; detail: string; source?: { title: string; url: string; type: string } };
type Plan = { basic: { what: string; how: string; discover: string }; deepening: Array<{ title: string; text: string; detail: string }> };
type Source = { title: string; url: string; type: string; publisher?: string };
type PerspectiveCase = { key: string; caseTitle?: string; connection?: string; question?: string; description?: string; example?: string; source?: { title: string; url: string; type: string } };
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
  { title: "성립의 경계선을 끝까지 밀어보기", focus: "내부 조건과 한계를 시험하는 길", question: `${topic}은(는) 어떤 조건까지 유지되며, 정확히 어느 지점에서 설명력이 흔들리는가?`, detail: `선택한 사례를 가장 단순한 조건으로 다시 재현하며 ${lens.name} 관점에서 출발점을 고정합니다. 관련 논문과 교과 자료에서 쓰인 변수, 표본, 계산식 또는 관찰 기준을 표로 옮깁니다. 한 번에 한 조건만 바꾸어 결과가 달라지는 지점을 기록합니다. 같은 결과가 반복되는지 다른 자료와 대조하고, 필요한 경우 간단한 증명이나 그래프로 확인합니다. 익숙한 설명이 처음 흔들리는 순간을 찾으면 그 균열이 이 탐구의 가장 중요한 발견이 됩니다.` },
  { title: "변형된 세계로 확장해 보기", focus: "다른 대상과 환경을 비교하는 길", question: `기존의 구조를 유지한 채 대상·환경·조건을 바꾸면 ${topic}은(는) 어떻게 새롭게 설명될 수 있는가?`, detail: `선택한 사례와 닮았지만 조건이 다른 두 번째 사례를 찾아 비교의 기준점을 세웁니다. 학술 자료에서 두 사례의 대상, 환경, 시간, 규모가 어떻게 다른지 표시합니다. 같은 질문을 두 사례에 적용해 공통으로 남는 요소와 새로 생기는 변수를 나눕니다. 비교표와 그래프를 통해 어느 변화가 결과를 바꾸는지 차례로 검토합니다. 자연스럽게 이어지는 확장과 갑자기 막히는 지점을 마주하며 일반화의 실제 경계를 발견하게 됩니다.` },
  { title: "자료의 구조를 새 모형으로 읽어보기", focus: "관계와 패턴을 시각적 모형으로 번역하는 길", question: `${topic}의 핵심 관계를 표·그래프·도식으로 다시 그리면 선택한 사례에서 무엇이 새롭게 보이는가?`, detail: `선택한 사례에 등장하는 대상과 변수의 관계를 한 장의 표나 흐름도로 먼저 번역합니다. 관련 연구에서 제시한 수치, 분류, 관찰 기록을 모아 같은 형식으로 정리합니다. 자료의 순서와 연결 방식을 바꾸어 보며 반복되는 패턴과 비어 있는 구간을 찾습니다. 만든 모형이 실제 사례를 설명하는지 원자료와 다시 대조하고 예외를 표시합니다. 계산이나 문장만으로는 보이지 않던 대칭과 단절을 발견하면 학생만의 설명 틀이 생겨납니다.` },
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
  const selectedCase = generated?.perspectives?.find((item) => item.key === lens.key);
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
    } catch { setShowFallbackCases(true); setNotice(""); }
    setLoading(false);
  }
  async function generatePaths() {
    setLoading(true); setNotice("");
    try {
      const fallback = fallbackCase(topic, lens);
      const response = await fetch("/api/inquiry/expand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, direction, perspective: { ...lens, caseTitle: selectedCase?.caseTitle || fallback.caseTitle, connection: selectedCase?.connection || selectedCase?.description || fallback.connection, question: selectedCase?.question || fallback.question } }) });
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
    {step === 2 && <div><Header eyebrow="관점 — 10가지 사고 형식" title="이 주제를 어떤 관점으로 파고들래요?" description="입력한 주제와 연구 자료를 바탕으로 관점별 실제 사례를 준비했습니다. 마음이 끌리는 카드 하나를 골라 보세요." />{loading ? <LoadingCards /> : generated?.perspectives?.length || showFallbackCases ? <>{notice && <div className="inline-notice"><span>{notice}</span><button onClick={generatePerspectives}>Gemini로 다시 생성</button></div>}<div className="lens-cards">{lenses.map((item, index) => { const ai = generated?.perspectives?.find((value) => value.key === item.key); const fallback = fallbackCase(topic, item); return <article key={item.key} role="button" tabIndex={0} onClick={() => setLensIndex(index)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setLensIndex(index); }} className={lensIndex === index ? "selected" : ""}><small>관점 · {item.name}</small><h3>{ai?.caseTitle || fallback.caseTitle}</h3><p>{ai?.connection || ai?.description || fallback.connection}</p><em>탐구 질문 · {ai?.question || fallback.question}</em>{ai?.source && <a href={ai.source.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>연계 자료 · {ai.source.type} · {ai.source.title} ↗</a>}</article>; })}</div><FooterActions back={() => setStep(1)} next={generatePaths} nextLabel="다음 →" /></> : <div className="status-panel"><strong>사례 카드가 아직 준비되지 않았어요.</strong><p>{notice || "생성 결과가 비어 있습니다. 다시 시도하거나 기본 관점으로 계속할 수 있습니다."}</p><div><button onClick={generatePerspectives}>다시 생성</button><button className="next" onClick={() => setShowFallbackCases(true)}>기본 관점으로 계속 →</button></div></div>}</div>}
    {step === 3 && <div><Header eyebrow="세 길 — 파고드는 결" title="이 관점 안에서 어디를 파볼래요?" description="2페이지에서 고른 실제 사례를 세 가지 서로 다른 방식으로 더 깊게 읽어 봅니다. 난이도가 아니라 파고드는 결로 갈립니다." /><div className="chosen-lens"><small>선택한 사례 · {lens.name}</small><strong>{selectedCase?.caseTitle || fallbackCase(topic, lens).caseTitle}</strong></div><div className="path-list">{activePaths.map((item, index) => <article key={item.title} role="button" tabIndex={0} onClick={() => setPathIndex(index)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setPathIndex(index); }} className={pathIndex === index ? "selected" : ""}><b>{index + 1}</b><div><small>{item.focus}</small><h3>{item.title}</h3><strong>{item.question}</strong><p>{item.detail}</p>{item.source && <a href={item.source.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>연계 자료 · {item.source.type} · {item.source.title} ↗</a>}</div></article>)}</div><FooterActions back={() => setStep(2)} next={generatePlan} nextLabel={loading ? "탐구 청사진을 만드는 중…" : "다음 →"} disabled={loading} /></div>}
    {step === 4 && <div><Header eyebrow="기본 탐구" title="이 길의 탐구를 한 번에" description="고른 길의 탐구가 어떻게 펼쳐지는지 한 번에 보여 드립니다." /><div className="blueprint"><article><small>무엇을 묻나</small><h2>{activePlan.basic.what}</h2></article><article><small>어떻게 알아보나</small><p>{activePlan.basic.how}</p></article><article><small>무엇을 만나게 되나</small><p>{activePlan.basic.discover}</p></article></div><FooterActions back={() => setStep(3)} next={() => setStep(5)} nextLabel="한 층 더 깊이 →" /></div>}
    {step === 5 && <div><Header eyebrow="더 깊이 — 1단" title="한 층 더 깊이" description="지금 관점 안에서 한 층 더 들어가는 세 갈래입니다." /><div className="deep-list">{activePlan.deepening.map((item, index) => <button key={item.title} onClick={() => setDeepIndex(index)} className={deepIndex === index ? "selected" : ""}><b>{index + 1}</b><div><h3>{item.title}</h3><strong>{item.text}</strong><p>{item.detail}</p></div></button>)}</div><FooterActions back={() => setStep(4)} next={() => setStep(6)} nextLabel="보고서 목차 만들기 →" /></div>}
    {step === 6 && <div><Header eyebrow="마무리 — 탐구 보고서 목차" title="탐구 보고서의 뼈대" description="선택한 주제와 관점, 탐구의 길, 심화 질문을 보고서의 구조로 묶었습니다." /><div className="report-title"><small>보고서 제목</small><h2>{reportTitle}</h2></div><Report title="I. 서론" items={[["1.1", "탐구 동기와 배경", `${topic}에 관심을 갖게 된 계기와 문제 상황을 구체적으로 정리합니다.`], ["1.2", "탐구 질문과 목적", activePlan.basic.what]]} /><Report title="II. 본론" items={[["2.1", "이론적 배경과 자료", `${topic}와 관련된 핵심 개념, 선행 자료, 비교 기준을 정리합니다.`], ["2.2", "탐구 방법", activePlan.basic.how], ["2.3", "심화 분석", `${deep.text}을(를) 중심으로 사례와 근거를 분석합니다.`]]} /><Report title="III. 결론" items={[["3.1", "발견과 해석", activePlan.basic.discover], ["3.2", "한계와 후속 질문", "이번 탐구의 한계와 다음에 더 확인하고 싶은 질문을 씁니다."]]} /><div className="save-actions"><button onClick={() => setStep(5)}>← 이전</button><button onClick={downloadReport}>텍스트로 저장</button><button className="next" onClick={() => window.print()}>인쇄 / PDF 저장</button></div></div>}
  </section></main>;
}

function Header({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <header className="stage-header"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></header>; }
function LoadingCards() { return <div className="lens-cards loading-cards">{Array.from({ length: 10 }, (_, index) => <div key={index}><i /><b /><b /><em /></div>)}</div>; }
function FooterActions({ back, next, nextLabel, disabled = false }: { back: () => void; next: () => void; nextLabel: string; disabled?: boolean }) { return <div className="footer-actions"><button onClick={back}>← 이전</button><button onClick={next} className="next" disabled={disabled}>{nextLabel}</button></div>; }
function Report({ title, items }: { title: string; items: string[][] }) { return <section className="report"><h2>{title}</h2>{items.map(([number, heading, text]) => <article key={number}><b>{number}</b><div><strong>{heading}</strong><p>{text}</p><small>• 넣을 내용과 근거 자료를 구체적으로 기록하기</small></div></article>)}</section>; }
function fallbackCase(topic: string, lens: Lens) {
  const cases: Record<string, { caseTitle: string; connection: string; question: string }> = {
    definition: { caseTitle: `‘${topic}’에 포함되는 대상을 가르는 기준표 만들기`, connection: `기사·교과서·공개 자료에서 ‘${topic}’이라고 부르는 대상을 모아 공통 요소와 제외 기준을 표로 정리합니다. 같은 이름을 쓰지만 서로 다른 대상을 가리키는 장면을 찾아, 탐구 대상이 어디까지인지 구체적으로 확인합니다.`, question: `‘${topic}’이라고 부르기 위해 반드시 갖추어야 할 요소와 제외해야 할 요소는 무엇인가?` },
    scope: { caseTitle: `조건이 달라질 때 ‘${topic}’의 효과가 흔들리는 지점`, connection: `서로 다른 환경·대상·시간대에서 나타난 ‘${topic}’ 사례를 같은 기준으로 비교합니다. 잘 설명되는 사례와 그렇지 않은 사례를 나란히 놓아, 어느 조건까지 같은 설명이 유지되는지 경계선을 찾아봅니다.`, question: `‘${topic}’은 어떤 조건·대상·범위까지 같은 방식으로 설명되며, 어디서부터 달라지는가?` },
    similarity: { caseTitle: `‘${topic}’과 닮은 구조를 가진 다른 사례 나란히 놓기`, connection: `‘${topic}’의 핵심 과정과 비슷한 흐름을 보이는 다른 분야의 사례를 찾아 단계·요소·결과를 표로 비교합니다. 겉모습은 달라도 같은 구조가 반복되는지, 반대로 결정적으로 다른 부분은 무엇인지 확인합니다.`, question: `‘${topic}’과 닮은 구조를 가진 사례는 무엇이며, 두 사례를 가르는 차이는 무엇인가?` },
    hierarchy: { caseTitle: `‘${topic}’을 움직이는 토대와 결과의 층위 지도`, connection: `개인·조직·제도 또는 기초 개념·방법·결과처럼 ‘${topic}’의 요소를 층위별로 나눕니다. 아래층의 변화가 위층의 현상으로 이어지는 실제 사례를 추적하며, 무엇이 전제이고 무엇이 결과인지 지도를 만듭니다.`, question: `‘${topic}’에서 가장 근본적인 토대는 무엇이며, 어떤 결과들이 그 위에서 파생되는가?` },
    variable: { caseTitle: `‘${topic}’의 결과를 바꾸는 한 가지 변수씩 비교하기`, connection: `‘${topic}’과 관련된 사례를 모아 대상·시간·비용·환경·규모처럼 결과를 바꿀 수 있는 변수를 기록합니다. 다른 조건은 가능한 한 같게 두고 한 변수만 달라진 사례를 비교해, 변화가 어디서 시작되는지 살핍니다.`, question: `‘${topic}’의 결과를 가장 크게 바꾸는 변수는 무엇이며, 다른 변수와 어떻게 얽히는가?` },
    condition: { caseTitle: `‘${topic}’이 성립하는 데 필요한 조건을 하나씩 빼 보기`, connection: `성공적으로 나타난 사례와 그렇지 않은 사례를 함께 모아 공통으로 갖춘 조건을 찾습니다. 조건 하나가 빠졌을 때 무엇이 달라지는지 자료와 사례를 따라가며, 필수 조건과 부수 조건을 구분합니다.`, question: `‘${topic}’이 성립하거나 작동하려면 반드시 갖추어야 할 조건은 무엇인가?` },
    method: { caseTitle: `‘${topic}’을 확인하는 서로 다른 조사 도구 비교`, connection: `관찰 기록·설문·실험·통계·문헌 조사 중 ‘${topic}’을 확인하는 데 적절한 방법을 두 가지 이상 골라 봅니다. 같은 질문에 서로 다른 도구를 적용했을 때 얻는 근거와 놓치는 부분을 비교합니다.`, question: `‘${topic}’에 답하기 위해 어떤 자료와 조사 방법을 함께 사용해야 가장 설득력 있는 근거가 되는가?` },
    exception: { caseTitle: `예상과 다르게 나타난 ‘${topic}’ 사례의 균열`, connection: `일반적인 설명으로는 잘 맞지 않는 ‘${topic}’ 사례를 찾아, 어떤 조건이 기존 규칙을 비껴 가게 했는지 기록합니다. 예외를 단순한 오류로 넘기지 않고, 기존 설명이 놓친 요인이나 새로운 가설의 출발점으로 삼습니다.`, question: `‘${topic}’에서 일반적인 설명이 깨지는 사례는 무엇이며, 그 균열은 무엇을 새로 설명해야 한다고 말하는가?` },
    case: { caseTitle: `현실의 한 장면에서 만나는 ‘${topic}’`, connection: `학교·지역사회·산업·일상생활 가운데 ‘${topic}’이 실제로 드러나는 한 장면을 골라 자료를 수집합니다. 추상적인 개념이 구체적인 선택·행동·결과로 바뀌는 과정을 시간 순서와 관계자 관점으로 정리합니다.`, question: `선택한 현실 사례에서 ‘${topic}’은 어떤 과정과 결과로 구체화되는가?` },
    model: { caseTitle: `‘${topic}’의 관계를 한눈에 보이는 모형으로 그리기`, connection: `‘${topic}’의 핵심 요소와 관계를 흐름도·그래프·개념도·표 중 하나로 옮깁니다. 여러 사례를 같은 모형에 넣어 보며 반복되는 연결과 끊어지는 지점을 시각적으로 비교합니다.`, question: `‘${topic}’을 어떤 모형으로 표현하면 핵심 요소와 관계, 그리고 빠진 부분까지 가장 잘 드러나는가?` },
  };
  return cases[lens.key] || { caseTitle: `${topic}의 구체적인 탐구 사례`, connection: `${topic}과(와) ${lens.name} 관점을 연결해 실제 자료와 사례를 비교합니다.`, question: lens.question };
}
