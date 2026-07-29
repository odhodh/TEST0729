"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type Direction = "science" | "humanities";
type Lens = { name: string; label: string; description: string; question: string };
type Path = { title: string; focus: string; question: string; detail: string };
type Generated = { perspectives?: Array<{ key: string; question: string; description: string; example: string }> };

const lenses: Lens[] = [
  { name: "정의", label: "본질을 명확히 하기", description: "대상의 본질을 명확히 하고, 무엇을 무엇으로 쪼개거나 합치는지 살펴봅니다. 부분분수라면 ‘일반항’과 ‘분해’가 정확히 무엇을 뜻하는지부터 다시 세우며 공식의 구조를 발견합니다.", question: "이 주제에서 무엇을 무엇으로 쪼개거나 합친다는 것은 정확히 무슨 뜻일까?" },
  { name: "범위", label: "어디까지 유효한가", description: "개념이나 공식이 어디까지 유효하게 작동하고, 어디서부터 무너지는지 추적합니다. 항의 개수·분모의 형태·수렴 여부를 바꾸어 보며 일반화 공식의 경계선을 직접 찾아볼 수 있습니다.", question: "이 개념이나 공식은 어떤 범위까지 성립하고 어디서부터 달라질까?" },
  { name: "유사성", label: "닮은 구조 겹쳐 보기", description: "다른 분야나 개념과 뼈대가 어떻게 같은지 겹쳐 봅니다. 부분분수의 분해 구조를 수열의 점화식, 망원급수, 다항식 나눗셈과 비교하면 서로 다른 풀이가 사실 같은 원리를 공유하는지 확인할 수 있습니다.", question: "이 주제와 뼈대가 닮은 다른 개념이나 구조는 무엇일까?" },
  { name: "위계", label: "근본과 파생 나누기", description: "무엇이 더 근본적인 토대이고 무엇이 그 위에서 파생된 결과인지 층을 나눕니다. 인수분해와 부분분수 분해, 일반항과 급수의 합처럼 개념의 순서를 세우면 공식이 만들어지는 논리의 계단이 보입니다.", question: "이 결과를 만들기 위해 먼저 성립해야 하는 근본 원리는 무엇일까?" },
  { name: "변수", label: "결정 요인 추적하기", description: "결과를 결정짓는 핵심 요인들이 서로 어떻게 얽히는지 살펴봅니다. 분모의 차수·인수의 간격·항의 개수·계수의 값이 일반항과 합의 형태를 어떻게 바꾸는지 표로 비교해 볼 수 있습니다.", question: "결과를 결정하는 핵심 변수들은 무엇이며 서로 어떻게 영향을 줄까?" },
  { name: "조건", label: "성립의 전제 찾기", description: "현상이나 공식이 성립하기 위해 반드시 필요한 전제를 묻습니다. 서로 다른 인수, 0이 아닌 분모, 수렴 조건 같은 가정을 하나씩 확인하며 ‘왜 이 조건이 필요한가’까지 증명하는 탐구입니다.", question: "이 공식이 성립하기 위해 반드시 필요한 전제는 무엇일까?" },
  { name: "수단", label: "도구와 경로 분석하기", description: "결론에 도달하기 위해 어떤 도구와 경로를 사용할지 분석합니다. 계수 비교·부분합의 망원 구조·수학적 귀납법·그래프 시각화를 함께 사용해 가장 설득력 있는 증명 경로를 설계합니다.", question: "이 결론에 도달하려면 어떤 도구와 경로를 사용해야 할까?" },
  { name: "예외", label: "규칙이 깨지는 순간", description: "일반 규칙이 깨지는 특이점이나 한계 상황을 찾아봅니다. 중복 인수, 복소수 인수, 발산하는 급수처럼 익숙한 풀이가 작동하지 않는 순간을 만났을 때 새로운 분해 방식이 필요한 이유를 밝혀냅니다.", question: "일반적인 규칙이 깨지는 특이점이나 한계 상황은 무엇일까?" },
  { name: "사례", label: "문제 속 구체화하기", description: "추상적인 개념이 실제 문제에서 어떤 모습으로 나타나는지 확인합니다. 조화급수·확률 모형·알고리즘의 시간 복잡도 같은 구체적인 사례에 공식을 적용하며, 기호가 실제 현상을 설명하는 언어가 되는 순간을 경험합니다.", question: "이 추상적 개념은 실제 문제에서 어떤 구체적인 모습으로 나타날까?" },
  { name: "모형", label: "시각적 틀로 그리기", description: "복잡한 수식이나 현상을 기하학적·시각적·단순화된 틀로 그려봅니다. 수직선의 항 배치, 막대그래프, 흐름도, 영역의 넓이로 부분분수와 급수의 관계를 표현하면 식의 움직임을 눈으로 설명할 수 있습니다.", question: "이 복잡한 수식이나 현상을 어떤 시각적 모형으로 표현할 수 있을까?" },
];

const defaultPaths = (topic: string, lens: Lens): Path[] => [
  { title: "공식의 내부 경계를 끝까지 밀어보기", focus: "성립 조건과 균열을 추적하는 길", question: `${topic}의 일반화 공식은 어떤 분모의 형태, 인수의 조건, 항의 개수까지 유지되며 정확히 어느 순간부터 무너지는가?`, detail: `가장 단순한 식에서 출발해 분모의 차수·인수의 간격·중복 인수 여부를 한 가지씩 바꾸며 표본을 쌓아 가는 길입니다. 직접 부분분수 분해와 부분합 계산을 반복해 ‘성립/실패’ 지도를 만들고, 귀납적으로 보인 규칙을 대수적으로 증명해 봅니다. 익숙한 공식이 더 이상 작동하지 않는 균열을 마주하면, 그 예외가 단순한 오류가 아니라 공식의 정확한 경계선임을 발견하게 됩니다.` },
  { title: "변형된 세계로 공식을 확장해 보기", focus: "새로운 대상과 변형에 도전하는 길", question: `기존 공식의 뼈대를 유지한 채 중복 인수, 이차식 인수, 계수가 달라진 수열까지 확장하려면 무엇을 새로 설계해야 하는가?`, detail: `서로 다른 인수를 가진 표준형에서 출발해 중복 인수·복소수 인수·분모 간격의 변형으로 차례로 영역을 넓혀 가는 길입니다. 각 변형마다 계수 비교와 수학적 귀납법, 계산 도구를 병행하여 새로운 일반항 후보를 만들고 반례로 시험합니다. 공식이 자연스럽게 확장되는 장면과 갑자기 새로운 항이 요구되는 장면을 비교하면서, ‘일반화’가 단순한 기호 늘리기가 아니라 구조를 다시 발명하는 일임을 느끼게 됩니다.` },
  { title: "식의 움직임을 모형으로 번역하기", focus: "시각적·구조적 모형으로 전환하는 길", question: `부분분수의 분해와 급수의 상쇄를 그림·도식·그래프의 언어로 옮기면 공식의 유효 범위는 어떻게 보이는가?`, detail: `수직선 위의 항 배치, 막대의 상쇄, 분모 인수의 연결 그래프처럼 식의 구조를 눈으로 번역하는 길입니다. 여러 분해 사례를 같은 도식으로 그려 보고, 어디까지는 상쇄 패턴이 반복되며 어디서 도식이 끊기는지 관찰합니다. 계산 결과만으로는 놓치기 쉬운 대칭과 단절을 한눈에 마주하며, 공식의 범위를 설명하는 자신만의 수학적 모형을 만들게 됩니다.` },
];

function makeBlueprint(topic: string, lens: Lens, path: Path) {
  return { what: path.question, how: `${topic}에 관한 선행 자료를 먼저 읽고, ${path.focus}에 맞는 비교 기준을 세운 뒤 사례·관찰·간단한 설문으로 근거를 모읍니다.`, discover: `${lens.name}의 관점으로 자료를 배열하면 예상과 다른 조건이나 예외가 드러날 수 있습니다. 자료의 한계와 해석의 범위도 함께 기록합니다.` };
}

function StepHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="step-header"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>; }

export default function Home() {
  const [step, setStep] = useState(1);
  const [inputPhase, setInputPhase] = useState<"topic" | "direction">("topic");
  const [topic, setTopic] = useState("");
  const [direction, setDirection] = useState<Direction | null>(null);
  const [lensIndex, setLensIndex] = useState(0);
  const [pathIndex, setPathIndex] = useState(0);
  const [deepIndex, setDeepIndex] = useState(0);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Path[] | null>(null);
  const [expanding, setExpanding] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState("");
  const lens = lenses[lensIndex];
  const paths = useMemo(() => expandedPaths || defaultPaths(topic || "관심 주제", lens), [expandedPaths, topic, lens]);
  const path = paths[pathIndex];
  const blueprint = makeBlueprint(topic || "관심 주제", lens, path);
  const deepQuestions = [
    `${topic || "이 주제"}의 결과를 바꾸는 가장 중요한 조건은 무엇일까?`,
    `서로 다른 사례에서도 ${lens.name}의 설명이 같은 방식으로 적용될까?`,
    `현재 자료로 설명되지 않는 예외를 만난다면 어떤 가설을 세울 수 있을까?`,
  ];
  const reportTitle = `${topic || "탐구 주제"} — ${lens.name} 관점에서 ${path.title}`;
  const reportText = createReportText({ title: reportTitle, topic, direction, lens, path, blueprint, deepQuestion: deepQuestions[deepIndex] });

  async function startDirection() {
    if (!topic.trim()) { setMessage("먼저 탐구하고 싶은 주제나 키워드를 입력해 주세요."); return; }
    setMessage(""); setInputPhase("direction");
  }
  async function chooseDirection() {
    if (!direction) { setMessage("탐구의 방향을 하나 선택해 주세요."); return; }
    setAiLoading(true); setMessage("");
    try {
      const response = await fetch("/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topic.trim(), direction }) });
      if (!response.ok) throw new Error("AI 응답을 받지 못했습니다.");
      const data = await response.json() as Generated;
      setGenerated(data);
    } catch { setMessage("AI 연결이 없어도 탐구를 계속할 수 있도록 기본 질문을 준비했습니다."); }
    setAiLoading(false); setStep(2);
  }
  async function expandLens() {
    if (expanding) return;
    setExpanding(true); setMessage("");
    try {
      const response = await fetch("/api/inquiry/expand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topic.trim(), direction, perspective: { name: lens.name, question: lens.question, description: lens.description } }) });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.approaches)) throw new Error();
      setExpandedPaths(data.approaches);
    } catch { setExpandedPaths(null); setMessage("AI 연결이 없어도 세 갈래의 기본 탐구 길을 확인할 수 있습니다."); }
    setPathIndex(0); setExpanding(false); setStep(3);
  }
  function saveReport() {
    const savedAt = new Date().toLocaleString("ko-KR");
    localStorage.setItem("inquiry-studio-report", JSON.stringify({ title: reportTitle, content: reportText, savedAt }));
    setSaveNotice(`이 브라우저에 ${savedAt}에 저장했습니다.`);
  }
  function downloadReport() {
    saveReport();
    const blob = new Blob([reportText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(topic || "탐구보고서").replace(/[\\/:*?"<>|]/g, "_")}_탐구보고서.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function reset() { setStep(1); setInputPhase("topic"); setTopic(""); setDirection(null); setLensIndex(0); setPathIndex(0); setDeepIndex(0); setGenerated(null); setExpandedPaths(null); setMessage(""); }
  function nextStep() { setStep((current) => Math.min(5, current + 1)); }
  function previousStep() { setStep((current) => Math.max(1, current - 1)); }

  return <main className="app-shell"><header className="topbar"><div className="brand-mark">탐</div><div><strong>탐구 주제 설계실</strong><small>Inquiry Studio</small></div><div className="topbar-spacer" /><span className="student-chip">나의 탐구 여정</span><button className="ghost-button" onClick={reset}>처음으로</button></header><div className="progress"><span className="progress-label">탐구 여정</span>{["주제와 방향", "관점 선택", "탐구의 길", "청사진", "보고서 목차"].map((label, index) => <div className={`progress-item ${step === index + 1 ? "active" : ""} ${step > index + 1 ? "done" : ""}`} key={label}><b>{index + 1}</b><span>{label}</span></div>)}</div><section className="workspace">
    {step === 1 && <section className="welcome"><StepHeader eyebrow="STEP 1 · 시작하기" title={inputPhase === "topic" ? "어떤 주제를 깊이 파고들고 싶나요?" : "이 주제를 어떤 방향으로 풀어볼까요?"} description={inputPhase === "topic" ? "막연한 키워드라도 좋습니다. 질문으로 자라날 씨앗을 적어 주세요." : `‘${topic}’을(를) 어떤 렌즈로 탐구할지 선택해 주세요. 선택에 따라 이후 질문과 자료 탐색의 결이 달라집니다.`} />{inputPhase === "topic" ? <><label className="field-label">관심 주제 또는 개념<textarea value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="예: 기후 변화, 인공지능의 편향, 학교 일회용품 사용" rows={5} autoFocus /></label><button className="primary-button" onClick={startDirection}>다음 · 방향 고르기 <span>→</span></button></> : <><div className="topic-confirm">입력한 주제<strong>{topic}</strong></div><div className="direction-grid"><button className={direction === "science" ? "direction-card selected" : "direction-card"} onClick={() => setDirection("science")}><span>01</span><strong>과학 · 기술 · 수리</strong><p>실험, 관찰, 측정, 증명을 중심으로 현상을 확인합니다.</p><em>“무엇이 어떻게 달라지는지 직접 확인해 볼까?”</em></button><button className={direction === "humanities" ? "direction-card selected" : "direction-card"} onClick={() => setDirection("humanities")}><span>02</span><strong>인문 · 사회 · 예술</strong><p>해석, 맥락, 사람들의 경험과 서술을 중심으로 살펴봅니다.</p><em>“이 현상은 어떤 맥락에서 다르게 읽힐까?”</em></button></div><div className="inline-actions"><button className="secondary-button" onClick={() => setInputPhase("topic")}>← 주제 수정</button><button className="primary-button compact" onClick={chooseDirection} disabled={aiLoading}>{aiLoading ? "질문을 준비하는 중…" : "방향 선택 완료 →"}</button></div></>}{message && <p className="notice">{message}</p>}<div className="first-step-note"><span>TIP</span><p>정답을 고르는 과정이 아닙니다. 지금 가장 궁금하고 오래 들여다보고 싶은 방향을 골라 보세요.</p></div></section>}
    {step === 2 && <section><StepHeader eyebrow="STEP 2 · 사고 형식" title="이 주제를 어떤 관점으로 바라볼까요?" description="같은 주제도 어떤 질문을 던지느냐에 따라 전혀 다른 탐구가 됩니다. 10가지 렌즈 중 가장 끌리는 관점 하나를 골라 보세요." /><div className="lens-grid">{lenses.map((item, index) => { const aiLens = generated?.perspectives?.find((value) => value.key === ["definition", "scope", "similarity", "hierarchy", "variable", "condition", "method", "exception", "case", "model"][index]); return <button className={`lens-card ${lensIndex === index ? "selected" : ""}`} onClick={() => setLensIndex(index)} key={item.name}><span>관점 {index + 1}</span><strong>[{item.name}] {aiLens?.question || item.question}</strong><p>{aiLens?.description || item.description}</p><em>{aiLens?.example ? `탐구 방향 예시 · ${aiLens.example}` : `${item.name} 관점으로 ${topic || "이 주제"}의 새로운 구조를 발견해 보세요.`}</em></button>; })}</div><StepActions onBack={previousStep} onNext={expandLens} next={expanding ? "세 갈래의 길을 설계하는 중…" : "이 관점으로 확장하기 →"} disabled={expanding} /></section>}
    {step === 3 && <section><StepHeader eyebrow="STEP 3 · 세 갈래의 탐구 길" title={`${lens.name} 관점으로 어느 결을 따라갈까요?`} description={`선택한 ‘${lens.name}’ 관점을 ${topic}에 적용한 세 갈래의 길입니다. 난이도가 아니라 무엇을 돋보기로 확대할지에 따라 결이 달라집니다.`} /><div className="selected-summary"><span>선택한 관점</span><strong>{lens.name} · {lens.label}</strong><p>{lens.question}</p></div><div className="path-grid">{paths.map((item, index) => <button className={`path-card-new ${pathIndex === index ? "selected" : ""}`} onClick={() => setPathIndex(index)} key={item.title}><span className="path-index">0{index + 1}</span><strong>{item.title}</strong><h3>핵심 질문</h3><p>{item.question}</p><h3>파고드는 결 · {item.focus}</h3><em>{item.detail}</em></button>)}</div>{message && <p className="notice">{message}</p>}<StepActions onBack={previousStep} onNext={nextStep} next="이 길로 설계하기 →" /></section>}
    {step === 4 && <section><StepHeader eyebrow="STEP 4 · 탐구 청사진" title="이 길을 실제 탐구로 바꿔 볼까요?" description="무엇을 묻고, 어떻게 알아보고, 무엇을 만나게 될지 한 장의 청사진으로 정리했습니다." /><div className="blueprint-grid"><article><span>무엇을 묻나</span><h2>{blueprint.what}</h2><p>선택한 길의 중심에 놓인 핵심 질문입니다.</p></article><article><span>어떻게 알아보나</span><h2>{blueprint.how}</h2><p>자료 조사와 관찰·비교 절차를 구체화해 보세요.</p></article><article><span>무엇을 만나게 되나</span><h2>{blueprint.discover}</h2><p>예상되는 발견뿐 아니라 자료의 한계도 기록합니다.</p></article></div><div className="deep-section"><span className="section-label">한 층 더 깊이 들어가기</span><h2>어떤 심화 질문이 가장 마음에 남나요?</h2><div className="deep-grid">{deepQuestions.map((question, index) => <button className={deepIndex === index ? "selected" : ""} onClick={() => setDeepIndex(index)} key={question}><b>0{index + 1}</b><span>{question}</span></button>)}</div></div><StepActions onBack={previousStep} onNext={nextStep} next="목차 만들기 →" /></section>}
    {step === 5 && <section><StepHeader eyebrow="STEP 5 · 탐구 보고서" title="탐구 보고서의 뼈대가 완성됐어요" description="지금까지 선택한 흐름을 실제 보고서에 옮길 수 있도록 I. 서론 · II. 본론 · III. 결론 구조로 정리했습니다." /><div className="report-title"><span>보고서 제목 제안</span><h2>{reportTitle}</h2></div><ReportSection title="I. 서론" items={[["1.1", "탐구 동기와 배경", `${topic}에 관심을 갖게 된 계기와 일상에서 발견한 문제 상황을 구체적으로 씁니다.`], ["1.2", "탐구 질문과 목적", `${blueprint.what}을 중심 질문으로 제시하고, ${lens.name} 관점과 선택한 탐구 방향을 설명합니다.`], ["1.3", "탐구 범위와 순서", "조사 대상·기간·자료의 범위를 정하고 어떤 순서로 답을 찾아갈지 안내합니다."]]} /><ReportSection title="II. 본론" items={[["2.1", "개념과 선행 자료", `${topic}의 주요 개념을 정의하고 논문·학술지·전공 서적·뉴스 자료를 비교해 정리합니다.`], ["2.2", "탐구 방법과 분석", blueprint.how], ["2.3", "심화 질문 분석", `${deepQuestions[deepIndex]}에 답하기 위해 수집한 사례와 근거를 표·도식·문단으로 분석합니다.`]]} /><ReportSection title="III. 결론" items={[["3.1", "발견과 해석", "자료에서 확인한 패턴을 요약하되, 자료가 보여 주는 범위 안에서 신중하게 해석합니다."], ["3.2", "한계와 후속 질문", `${blueprint.discover}를 바탕으로 이번 탐구에서 남은 한계와 다음 탐구 질문을 씁니다.`]]} /><div className="final-actions"><button className="secondary-button" onClick={previousStep}>← 청사진으로 돌아가기</button><button className="secondary-button" onClick={saveReport}>브라우저에 저장</button><button className="primary-button compact" onClick={downloadReport}>텍스트 파일 저장</button><button className="primary-button compact" onClick={() => window.print()}>인쇄 / PDF 저장</button></div>{saveNotice && <p className="save-notice">{saveNotice}</p>}</section>}
  </section><footer><span>탐구는 답을 받는 일이 아니라, 더 좋은 질문을 만드는 일입니다.</span><button onClick={reset}>새 탐구 시작</button></footer></main>;
}

function StepActions({ onBack, onNext, next, disabled = false }: { onBack: () => void; onNext: () => void; next: string; disabled?: boolean }) { return <div className="step-actions"><button className="secondary-button" onClick={onBack}>← 이전</button><button className="primary-button compact" onClick={onNext} disabled={disabled}>{next}</button></div>; }

function ReportSection({ title, items }: { title: string; items: string[][] }) { return <section className="report-section"><h2>{title}</h2>{items.map(([number, heading, body]) => <article key={number}><b>{number}</b><div><strong>{heading}</strong><p>{body}</p><small>• 핵심 개념과 근거 자료를 구체적으로 기록하기<br />• 자신의 관찰과 해석을 근거와 구분해 쓰기</small></div></article>)}</section>; }

function createReportText({ title, topic, direction, lens, path, blueprint, deepQuestion }: { title: string; topic: string; direction: Direction | null; lens: Lens; path: Path; blueprint: { what: string; how: string; discover: string }; deepQuestion: string }) {
  return `# ${title}\n\n- 탐구 주제: ${topic}\n- 탐구 방향: ${direction === "humanities" ? "인문·사회·예술" : "과학·기술·수리"}\n- 선택 관점: ${lens.name} · ${lens.label}\n- 선택한 탐구 길: ${path.title}\n\n## I. 서론\n\n### 1.1 탐구 동기와 배경\n${topic}에 관심을 갖게 된 계기와 일상에서 발견한 문제 상황을 구체적으로 씁니다.\n\n### 1.2 탐구 질문과 목적\n${blueprint.what}\n\n### 1.3 탐구 범위와 순서\n조사 대상·기간·자료의 범위를 정하고 어떤 순서로 답을 찾아갈지 안내합니다.\n\n## II. 본론\n\n### 2.1 개념과 선행 자료\n${topic}의 주요 개념을 정의하고 논문·학술지·전공 서적·뉴스 자료를 비교해 정리합니다.\n\n### 2.2 탐구 방법과 분석\n${blueprint.how}\n\n### 2.3 심화 질문 분석\n${deepQuestion}\n\n## III. 결론\n\n### 3.1 발견과 해석\n자료에서 확인한 패턴을 요약하되, 자료가 보여 주는 범위 안에서 신중하게 해석합니다.\n\n### 3.2 한계와 후속 질문\n${blueprint.discover}\n`;
}
