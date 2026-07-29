"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type Direction = "science" | "humanities";
type Lens = { name: string; label: string; description: string; question: string };
type Path = { title: string; focus: string; question: string; example: string };
type Generated = { perspectives?: Array<{ key: string; question: string; description: string; example: string }>; paths?: Array<{ title: string; text: string; detail: string }> };

const lenses: Lens[] = [
  { name: "정의", label: "개념을 정확히 세우기", description: "주제의 핵심 단어를 다시 정의하고, 우리가 당연하게 쓰던 말의 경계를 확인합니다.", question: "이 주제를 설명하려면 먼저 어떤 개념을 분명히 정의해야 할까?" },
  { name: "범위", label: "어디까지 적용되는가", description: "주제가 성립하는 범위와 성립하지 않는 경계를 찾아 탐구의 크기를 조절합니다.", question: "이 현상은 언제, 어디까지 나타나며 어느 지점에서 달라질까?" },
  { name: "인과", label: "무엇이 무엇을 바꾸는가", description: "원인과 결과의 연결 고리를 살피며 단순한 상관관계와 실제 영향을 구분합니다.", question: "어떤 요인이 이 현상에 영향을 주고, 그 근거는 무엇일까?" },
  { name: "변수", label: "조건을 바꿔 비교하기", description: "결과에 영향을 줄 수 있는 요소를 나누고, 하나씩 바꾸며 차이를 비교합니다.", question: "무엇을 바꾸거나 측정하면 주제의 차이를 확인할 수 있을까?" },
  { name: "예외", label: "다르게 나타나는 경우", description: "일반적인 설명이 맞지 않는 사례를 찾아 주제의 빈틈과 새로운 질문을 발견합니다.", question: "보통의 설명과 다르게 나타나는 예외나 반례는 무엇일까?" },
  { name: "사례", label: "현실의 장면에서 보기", description: "구체적인 인물·사건·제품·지역을 통해 추상적인 주제를 실제 장면으로 가져옵니다.", question: "이 주제를 가장 잘 보여 주는 구체적인 사례는 무엇일까?" },
  { name: "유사성", label: "닮은 구조와 비교하기", description: "서로 다른 분야에서 비슷하게 작동하는 구조를 찾아 주제를 새로운 각도에서 봅니다.", question: "이 주제와 닮은 현상은 무엇이며 무엇이 같고 다를까?" },
  { name: "위계", label: "부분과 전체의 관계", description: "개인·집단·사회처럼 분석 단위를 나누어 같은 현상이 층위마다 어떻게 보이는지 살핍니다.", question: "부분의 변화와 전체의 변화는 어떻게 연결되어 있을까?" },
  { name: "모형", label: "그림과 구조로 단순화하기", description: "복잡한 주제를 흐름도·도식·지도처럼 표현해 요소와 관계를 한눈에 드러냅니다.", question: "이 주제를 어떤 모형이나 그림으로 표현하면 핵심이 보일까?" },
  { name: "관점", label: "누구의 눈으로 보는가", description: "관찰자의 위치와 이해관계가 달라질 때 같은 주제가 어떻게 해석되는지 비교합니다.", question: "누구의 입장에서 보느냐에 따라 질문과 해석은 어떻게 달라질까?" },
];

const defaultPaths = (topic: string, lens: Lens): Path[] => [
  { title: "현상의 구조를 해부하기", focus: "핵심 요소와 관계를 세밀하게 나눠 봅니다.", question: `${topic}을(를) 구성하는 요소들은 무엇이며 서로 어떻게 연결되는가?`, example: `관련 개념을 3~5개 요소로 나누고, 각 요소 사이의 관계를 표나 개념도로 정리합니다.` },
  { title: "조건을 바꿔 차이 확인하기", focus: "조건·환경·대상을 달리해 결과의 차이를 비교합니다.", question: `${lens.name}의 관점에서 어떤 조건을 바꾸면 결과가 달라지는가?`, example: `비교 기준을 정한 뒤 두 개 이상의 사례를 같은 기준으로 조사하고 차이를 기록합니다.` },
  { title: "반대 사례에서 새 질문 찾기", focus: "기존 설명이 흔들리는 예외와 다른 사례를 출발점으로 삼습니다.", question: `일반적인 설명으로 충분히 설명되지 않는 사례는 무엇이며 왜 그런가?`, example: `서로 다른 자료에서 예외 사례를 찾고, 기존 설명이 놓친 변수를 추론합니다.` },
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
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState("");
  const lens = lenses[lensIndex];
  const paths = useMemo(() => generated?.paths?.length === 3 ? generated.paths.map((item) => ({ title: item.title, focus: item.text, question: item.text, example: item.detail })) : defaultPaths(topic || "관심 주제", lens), [generated, topic, lens]);
  const path = paths[pathIndex];
  const blueprint = makeBlueprint(topic || "관심 주제", lens, path);
  const deepQuestions = [
    `${topic || "이 주제"}의 결과를 바꾸는 가장 중요한 조건은 무엇일까?`,
    `서로 다른 사례에서도 ${lens.name}의 설명이 같은 방식으로 적용될까?`,
    `현재 자료로 설명되지 않는 예외를 만난다면 어떤 가설을 세울 수 있을까?`,
  ];

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

  function reset() { setStep(1); setInputPhase("topic"); setTopic(""); setDirection(null); setLensIndex(0); setPathIndex(0); setDeepIndex(0); setGenerated(null); setMessage(""); }
  function nextStep() { setStep((current) => Math.min(5, current + 1)); }
  function previousStep() { setStep((current) => Math.max(1, current - 1)); }

  return <main className="app-shell"><header className="topbar"><div className="brand-mark">탐</div><div><strong>탐구 주제 설계실</strong><small>Inquiry Studio</small></div><div className="topbar-spacer" /><span className="student-chip">나의 탐구 여정</span><button className="ghost-button" onClick={reset}>처음으로</button></header><div className="progress"><span className="progress-label">탐구 여정</span>{["주제와 방향", "관점 선택", "탐구의 길", "청사진", "보고서 목차"].map((label, index) => <div className={`progress-item ${step === index + 1 ? "active" : ""} ${step > index + 1 ? "done" : ""}`} key={label}><b>{index + 1}</b><span>{label}</span></div>)}</div><section className="workspace">
    {step === 1 && <section className="welcome"><StepHeader eyebrow="STEP 1 · 시작하기" title={inputPhase === "topic" ? "어떤 주제를 깊이 파고들고 싶나요?" : "이 주제를 어떤 방향으로 풀어볼까요?"} description={inputPhase === "topic" ? "막연한 키워드라도 좋습니다. 질문으로 자라날 씨앗을 적어 주세요." : `‘${topic}’을(를) 어떤 렌즈로 탐구할지 선택해 주세요. 선택에 따라 이후 질문과 자료 탐색의 결이 달라집니다.`} />{inputPhase === "topic" ? <><label className="field-label">관심 주제 또는 개념<textarea value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="예: 기후 변화, 인공지능의 편향, 학교 일회용품 사용" rows={5} autoFocus /></label><button className="primary-button" onClick={startDirection}>다음 · 방향 고르기 <span>→</span></button></> : <><div className="topic-confirm">입력한 주제<strong>{topic}</strong></div><div className="direction-grid"><button className={direction === "science" ? "direction-card selected" : "direction-card"} onClick={() => setDirection("science")}><span>01</span><strong>과학 · 기술 · 수리</strong><p>실험, 관찰, 측정, 증명을 중심으로 현상을 확인합니다.</p><em>“무엇이 어떻게 달라지는지 직접 확인해 볼까?”</em></button><button className={direction === "humanities" ? "direction-card selected" : "direction-card"} onClick={() => setDirection("humanities")}><span>02</span><strong>인문 · 사회 · 예술</strong><p>해석, 맥락, 사람들의 경험과 서술을 중심으로 살펴봅니다.</p><em>“이 현상은 어떤 맥락에서 다르게 읽힐까?”</em></button></div><div className="inline-actions"><button className="secondary-button" onClick={() => setInputPhase("topic")}>← 주제 수정</button><button className="primary-button compact" onClick={chooseDirection} disabled={aiLoading}>{aiLoading ? "질문을 준비하는 중…" : "방향 선택 완료 →"}</button></div></>}{message && <p className="notice">{message}</p>}<div className="first-step-note"><span>TIP</span><p>정답을 고르는 과정이 아닙니다. 지금 가장 궁금하고 오래 들여다보고 싶은 방향을 골라 보세요.</p></div></section>}
    {step === 2 && <section><StepHeader eyebrow="STEP 2 · 사고 형식" title="이 주제를 어떤 관점으로 바라볼까요?" description="같은 주제도 어떤 질문을 던지느냐에 따라 전혀 다른 탐구가 됩니다. 가장 끌리는 관점 하나를 골라 보세요." /><div className="lens-grid">{lenses.slice(0, 5).map((item, index) => { const aiLens = generated?.perspectives?.find((value) => value.key === ["definition", "scope", "similarity", "hierarchy", "variable"][index]); return <button className={`lens-card ${lensIndex === index ? "selected" : ""}`} onClick={() => setLensIndex(index)} key={item.name}><span>관점 {index + 1}</span><strong>{item.name} · {item.label}</strong><p>{aiLens?.description || item.description}</p><em>{aiLens?.question || item.question}</em></button>; })}</div><StepActions onBack={previousStep} onNext={nextStep} next="이 관점으로 확장하기 →" /></section>}
    {step === 3 && <section><StepHeader eyebrow="STEP 3 · 세 갈래의 길" title={`${lens.name} 관점으로 어떻게 파고들까요?`} description={`선택한 ‘${lens.name}’ 관점을 ${topic}에 적용하는 세 가지 접근입니다. 난이도가 아니라 탐구의 초점이 서로 다릅니다.`} /><div className="selected-summary"><span>선택한 관점</span><strong>{lens.name} · {lens.label}</strong><p>{lens.question}</p></div><div className="path-grid">{paths.map((item, index) => <button className={`path-card-new ${pathIndex === index ? "selected" : ""}`} onClick={() => setPathIndex(index)} key={item.title}><span className="path-index">0{index + 1}</span><strong>{item.title}</strong><h3>{item.focus}</h3><p>{item.question}</p><em>예시 · {item.example}</em></button>)}</div><StepActions onBack={previousStep} onNext={nextStep} next="이 길로 설계하기 →" /></section>}
    {step === 4 && <section><StepHeader eyebrow="STEP 4 · 탐구 청사진" title="이 길을 실제 탐구로 바꿔 볼까요?" description="무엇을 묻고, 어떻게 알아보고, 무엇을 만나게 될지 한 장의 청사진으로 정리했습니다." /><div className="blueprint-grid"><article><span>무엇을 묻나</span><h2>{blueprint.what}</h2><p>선택한 길의 중심에 놓인 핵심 질문입니다.</p></article><article><span>어떻게 알아보나</span><h2>{blueprint.how}</h2><p>자료 조사와 관찰·비교 절차를 구체화해 보세요.</p></article><article><span>무엇을 만나게 되나</span><h2>{blueprint.discover}</h2><p>예상되는 발견뿐 아니라 자료의 한계도 기록합니다.</p></article></div><div className="deep-section"><span className="section-label">한 층 더 깊이 들어가기</span><h2>어떤 심화 질문이 가장 마음에 남나요?</h2><div className="deep-grid">{deepQuestions.map((question, index) => <button className={deepIndex === index ? "selected" : ""} onClick={() => setDeepIndex(index)} key={question}><b>0{index + 1}</b><span>{question}</span></button>)}</div></div><StepActions onBack={previousStep} onNext={nextStep} next="목차 만들기 →" /></section>}
    {step === 5 && <section><StepHeader eyebrow="STEP 5 · 탐구 보고서" title="탐구 보고서의 뼈대가 완성됐어요" description="지금까지 선택한 흐름을 실제 보고서에 옮길 수 있도록 I. 서론 · II. 본론 · III. 결론 구조로 정리했습니다." /><div className="report-title"><span>보고서 제목 제안</span><h2>{topic} — {lens.name} 관점에서 {path.title}</h2></div><ReportSection title="I. 서론" items={[["1.1", "탐구 동기와 배경", `${topic}에 관심을 갖게 된 계기와 일상에서 발견한 문제 상황을 구체적으로 씁니다.`], ["1.2", "탐구 질문과 목적", `${blueprint.what}을 중심 질문으로 제시하고, ${lens.name} 관점과 선택한 탐구 방향을 설명합니다.`], ["1.3", "탐구 범위와 순서", "조사 대상·기간·자료의 범위를 정하고 어떤 순서로 답을 찾아갈지 안내합니다."]]} /><ReportSection title="II. 본론" items={[["2.1", "개념과 선행 자료", `${topic}의 주요 개념을 정의하고 논문·학술지·전공 서적·뉴스 자료를 비교해 정리합니다.`], ["2.2", "탐구 방법과 분석", blueprint.how], ["2.3", "심화 질문 분석", `${deepQuestions[deepIndex]}에 답하기 위해 수집한 사례와 근거를 표·도식·문단으로 분석합니다.`]]} /><ReportSection title="III. 결론" items={[["3.1", "발견과 해석", "자료에서 확인한 패턴을 요약하되, 자료가 보여 주는 범위 안에서 신중하게 해석합니다."], ["3.2", "한계와 후속 질문", `${blueprint.discover}를 바탕으로 이번 탐구에서 남은 한계와 다음 탐구 질문을 씁니다.`]]} /><div className="final-actions"><button className="secondary-button" onClick={previousStep}>← 청사진으로 돌아가기</button><button className="primary-button compact" onClick={() => window.print()}>보고서 인쇄 / PDF 저장</button></div></section>}
  </section><footer><span>탐구는 답을 받는 일이 아니라, 더 좋은 질문을 만드는 일입니다.</span><button onClick={reset}>새 탐구 시작</button></footer></main>;
}

function StepActions({ onBack, onNext, next }: { onBack: () => void; onNext: () => void; next: string }) { return <div className="step-actions"><button className="secondary-button" onClick={onBack}>← 이전</button><button className="primary-button compact" onClick={onNext}>{next}</button></div>; }

function ReportSection({ title, items }: { title: string; items: string[][] }) { return <section className="report-section"><h2>{title}</h2>{items.map(([number, heading, body]) => <article key={number}><b>{number}</b><div><strong>{heading}</strong><p>{body}</p><small>• 핵심 개념과 근거 자료를 구체적으로 기록하기<br />• 자신의 관찰과 해석을 근거와 구분해 쓰기</small></div></article>)}</section>; }
