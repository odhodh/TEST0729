"use client";

import { useMemo, useState } from "react";

type Perspective = { key: string; name: string; question: string; description: string; color: string };
const perspectives: Perspective[] = [
  { key: "definition", name: "정의", question: "부분분수로 분해한다는 것은 정확히 무엇을 하나의 무엇으로 쪼개는 뜻인가?", description: "부분분수 일반화를 시도하기 전에, 무엇을 어떤 조건과 형태로 요구하는지 안전하게 정리해 보는 관점입니다.", color: "violet" },
  { key: "scope", name: "범위", question: "내가 만들려는 부분분수 일반화 공식은 어떤 형태의 분모까지 작동하고, 어디서부터 무너지는가?", description: "1/n, n(n+1), n(n+1)(n+2)처럼 분모가 확장될 때 어디까지 성립하는지 경계를 그려 봅니다.", color: "indigo" },
  { key: "similarity", name: "유사성", question: "부분분수 분해의 구조는 수열의 계차·망원합·미분의 부분적분과 같은 자리에서 같은 배열로 작동하고 있지 않은가?", description: "서로 달라 보이는 개념에서 같은 패턴이 반복되는지 찾아 연결하는 관점입니다.", color: "blue" },
  { key: "hierarchy", name: "위계", question: "부분분수 공식 안에서 무엇이 더 근본이고 무엇이 그 위에 얹혀 있는 파생 결과인가?", description: "항등식, 계수 결정, 급수합 도출이 서로 어떤 층을 이루는지 나누어 봅니다.", color: "teal" },
  { key: "variable", name: "변수", question: "부분분수 일반화 공식의 값을 결정짓는 파라미터는 무엇이고 서로 어떻게 얽히는가?", description: "분모의 차수·간격·개수 같은 변수의 결로 결과가 어떻게 달라지는지 살펴봅니다.", color: "amber" },
  { key: "condition", name: "조건", question: "이 일반화 공식이 성립하려면 분모의 인수들이 어떤 조건을 만족해야 하는가?", description: "서로 다른 근, 중근, 복소근 등 분모의 조건에 따라 공식 형태가 달라지는지 점검합니다.", color: "orange" },
  { key: "method", name: "수단", question: "이 일반화 공식에 도달하기 위해 나는 어떤 도구와 경로를 쓰고 있으며, 왜 그 도구인가?", description: "공식을 유도하는 방법과 다른 우회 경로가 있는지 함께 살펴보는 관점입니다.", color: "green" },
  { key: "exception", name: "예외", question: "내가 세운 부분분수 공식이 깨지는 자리(중근·특이점·발산 급수)는 어디인가?", description: "일반화가 어디서 예외를 만나 무너지는지 찾아 정확한 경계를 드러냅니다.", color: "rose" },
  { key: "case", name: "사례", question: "내가 만든 일반화 공식은 실제 수열·급수 문제에서 어떤 구체적 모습으로 나타나는가?", description: "추상적 공식이 실제 계산 상황에서 어떻게 살아 움직이는지 구체적 사례로 확인합니다.", color: "cyan" },
  { key: "model", name: "모형", question: "부분분수 분해를 어떤 기하적 그림(넓이·조개기·선분 분할·격자 위 면적)으로 단순하게 시각화할 수 있는가?", description: "학생이 함께 만든 그림과 대수식 뒤에 어떤 모형과 구조가 깔려 있는지 그려 보는 관점입니다.", color: "purple" },
];

const paths = [
  { title: "분모 형태의 경계", text: "내가 세운 부분분수 일반화 공식은 분모가 어떤 형태까지 버티고, 어디서부터 형태가 무너지는가?", detail: "분모의 생김새를 바꿔가며 공식이 어디까지 뻗는지 밀어보는 길입니다.", color: "green" },
  { title: "수렴의 경계", text: "부분분수로 분해한 항을 급수로 이었을 때, 수렴하는 범위와 발산으로 넘어가는 지점은 어디인가?", detail: "공식이 '식으로서' 성립하는 범위와 무한합으로 넘어갔을 때의 유효 범위를 깨닫는 길입니다.", color: "blue" },
  { title: "기하 모형의 사라짐", text: "부분분수를 도형·면적·길이 같은 기하 모형으로 옮겼을 때 그 모형은 언제까지 그려지고, 어디서부터 기하적 해석이 불가능해지는가?", detail: "대수 공식과 기하 표현이 나란히 가는 구간과 어긋나기 시작하는 구간을 비교합니다.", color: "purple" },
];

export default function Home() {
  const [step, setStep] = useState(1);
  const [student, setStudent] = useState({ number: "", name: "", topic: "" });
  const [selectedPerspective, setSelectedPerspective] = useState(1);
  const [selectedPath, setSelectedPath] = useState(0);
  const [saved, setSaved] = useState(false);
  const selected = perspectives[selectedPerspective];
  const topic = student.topic || "부분분수 일반화 공식의 분모 형태별 경계 탐구";
  const report = useMemo(() => ({ title: `${topic} - 대수와 기하로 함께 밀어보기`, intro: `${topic}에 관심을 갖고, ${selected.name} 관점에서 공식이 어디까지 작동하는지 직접 확인해 본다.`, method: `먼저 가장 단순한 서로 다른 인수의 곱에서 공식을 세우고, 분모의 생김새를 한 겹씩 바꿔가며 ${selected.name} 관점의 질문을 점검한다. 각 단계에서 공식이 흔들리는 지점을 표로 정리하고, 필요한 경우 기하적 모형과 계산 결과를 함께 비교한다.` }), [topic, selected.name]);

  function next() { setStep((value) => Math.min(6, value + 1)); }
  function back() { setStep((value) => Math.max(1, value - 1)); }
  function reset() { setStep(1); setStudent({ number: "", name: "", topic: "" }); setSaved(false); }

  return <main className="inquiry-app">
    <header className="app-header"><div className="mini-brand"><span>탐</span><div><strong>탐구 주제 찾기</strong><small>Inquiry Studio</small></div></div><div className="school-pill">고등학교 2학년 <span>⌄</span></div><button className="settings-button">⚙ Google API 설정</button></header>
    <nav className="progress-nav"><button onClick={() => setStep(1)}>← 처음</button><span>학생 분석</span><strong>탐구 주제 찾기</strong></nav>
    <div className="session-bar"><button>이전 세션 (2)⌄</button><button onClick={reset}>＋ 새 세션</button><button className="dark-button" onClick={() => setSaved(true)}>저장</button>{saved && <small>저장됨 · 오후 03:02</small>}</div>
    <section className="topic-strip"><span>주제&nbsp; {topic}</span><i>›</i><b>결&nbsp; {selected.name} 관점</b></section>
    <div className="step-content">
      {step === 1 && <Start student={student} setStudent={setStudent} onNext={next} />}
      {step === 2 && <PerspectiveStep selected={selectedPerspective} setSelected={setSelectedPerspective} onNext={next} onBack={back} />}
      {step === 3 && <PathStep selected={selectedPath} setSelected={setSelectedPath} onNext={next} onBack={back} />}
      {step === 4 && <BasicInquiry selected={selected} path={paths[selectedPath]} topic={topic} onNext={next} onBack={back} />}
      {step === 5 && <Deepen selected={selected} onNext={next} onBack={back} />}
      {step === 6 && <Report report={report} onReset={reset} />}
    </div>
  </main>;
}

function Start({ student, setStudent, onNext }: { student: { number: string; name: string; topic: string }; setStudent: (v: { number: string; name: string; topic: string }) => void; onNext: () => void }) { return <section className="start-card"><div className="kicker warm">시작하기</div><h1>학번 · 이름으로 시작</h1><p>학번과 이름을 입력하면 새 탐구 주제 세션이 시작됩니다.</p><label>학번<input value={student.number} onChange={(e) => setStudent({ ...student, number: e.target.value })} placeholder="예: 10312" /></label><label>이름<input value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} placeholder="홍길동" /></label><label>관심 주제 또는 개념<textarea value={student.topic} onChange={(e) => setStudent({ ...student, topic: e.target.value })} placeholder="예: 기후 변화, 인공지능의 편향, 학교 일회용품 사용" rows={3} /></label><button className="gradient-button" onClick={onNext}>✦ 시작하기 →</button></section>; }

function PerspectiveStep({ selected, setSelected, onNext, onBack }: { selected: number; setSelected: (v: number) => void; onNext: () => void; onBack: () => void }) { return <StepFrame number="관점 - 10가지 사고 형식" title="이 주제를 어떤 관점으로 파고들래요?" subtitle="같은 주제도 어떤 관점으로 보느냐에 따라 다른 탐구가 열립니다. 마음이 끌리는 관점 하나를 골라 보세요." onNext={onNext} onBack={onBack} color="violet"><div className="perspective-grid">{perspectives.map((item, index) => <button key={item.key} className={`perspective-card ${selected === index ? "chosen" : ""}`} onClick={() => setSelected(index)}><span className={`tag ${item.color}`}>관점 · {item.name}</span><strong>{item.question}</strong><p>{item.description}</p></button>)}</div><details className="more"><summary>＋ 한마디 더보기 (선택)</summary><p>정의, 범위, 유사성, 위계, 변수, 조건, 수단, 예외, 사례, 모형의 10가지 사고 형식은 익숙한 주제를 새로운 질문으로 바꾸는 렌즈입니다.</p></details></StepFrame>; }

function PathStep({ selected, setSelected, onNext, onBack }: { selected: number; setSelected: (v: number) => void; onNext: () => void; onBack: () => void }) { return <StepFrame number="관점 안에서" title="어디를 파볼래요?" subtitle="같은 관점이라도 파고들 길이 셋 있습니다. 닿은 난이도가 아니라 파고드는 결로 길을 고르세요." onNext={onNext} onBack={onBack} color="green"><div className="path-list">{paths.map((path, index) => <button key={path.title} className={`path-card ${selected === index ? "chosen" : ""}`} onClick={() => setSelected(index)}><span className="path-number">{index + 1}</span><div><strong>{path.title}</strong><h3>{path.text}</h3><p>{path.detail}</p></div></button>)}</div><details className="more"><summary>＋ 한마디 더보기 (선택)</summary><p>길을 고른 뒤에는 관찰할 대상을 좁히고, 직접 시험할 수 있는 작은 질문으로 바꿔 봅니다.</p></details></StepFrame>; }

function BasicInquiry({ selected, path, topic, onNext, onBack }: { selected: Perspective; path: typeof paths[number]; topic: string; onNext: () => void; onBack: () => void }) { return <StepFrame number="기본 탐구" title="이 길의 탐구를 한 번에" subtitle="고른 길의 탐구가 어떻게 펼쳐지는지 한 번에 보여 드립니다." onNext={onNext} onBack={onBack} color="cyan"><div className="inquiry-cards"><article><span>무엇을 묻나</span><strong>{selected.question}</strong></article><article><span>어떻게 알아보나</span><p>{path.detail} {topic}의 사례를 직접 만들고, 조건을 하나씩 바꾸어 결과를 비교합니다. 공식의 경계선과 모형의 변화를 표와 그림으로 기록합니다.</p></article><article><span>무엇을 만나게 되나</span><p>처음에는 익숙한 공식이 반복되지만, 분모의 형태와 수렴 조건을 바꾸는 순간 새로운 경계가 드러납니다. 그 경계에서 내가 세운 설명을 다시 점검하게 됩니다.</p></article></div></StepFrame>; }

function Deepen({ selected, onNext, onBack }: { selected: Perspective; onNext: () => void; onBack: () => void }) { const deepen = [{ title: "무너지는 방식의 지형도", text: "공식이 무너지는 방식 자체가 형태마다 어떻게 다른지 - 계수가 흔들리는지, 항의 개수가 늘어나는지, 표현 범주 자체가 바뀌는지 -를 정밀하게 갈라 볼 수 있습니다." }, { title: "확장 모형의 최소 조건", text: "경계에서 공식을 되살리려면 최소한 어떤 조각을 더 넣어야 하는가? 분모의 형태가 강제하는 조건을 찾아 새로운 모형의 원리를 세워 봅니다." }, { title: "기하가 먼저 어긋나는 순간", text: "대수 규칙이 무너지기 직전, 기하적 표현은 먼저 어긋나기 시작하는가? 수식과 그림을 나란히 놓고 빠르게 변화를 관찰합니다." }]; return <StepFrame number="더 깊이 - 1단" title="한 층 더 깊이" subtitle={`지금 관점에서 한 층 더 들어가는 세 갈래입니다.`} onNext={onNext} onBack={onBack} color="violet"><div className="deep-list">{deepen.map((item, index) => <article key={item.title}><span>{index + 1}</span><div><strong>{item.title}</strong><h3>{index === 0 ? selected.question : item.text}</h3><p>{item.text}</p></div></article>)}</div><button className="more-button" onClick={onNext}>＋ 2개 더 보기</button></StepFrame>; }

function Report({ report, onReset }: { report: { title: string; intro: string; method: string }; onReset: () => void }) { return <section className="report"><div className="kicker dark">마무리 - 탐구 보고서 목차</div><h1>탐구 목차 · 서론 · 본론 · 결론</h1><p>지금까지의 선택과 정교화가 한 꼭 고등학교 탐구 보고서 양식의 목차로 정리됩니다.</p><label>보고서 제목<textarea value={report.title} readOnly rows={2} /></label><h2>I. 서론</h2><article className="report-card"><b>1.1</b><strong>탐구 동기와 배경</strong><textarea defaultValue={report.intro} rows={3} /></article><article className="report-card"><b>1.2</b><strong>탐구 질문 및 목적</strong><textarea defaultValue={report.method} rows={4} /></article><h2>II. 본론</h2><article className="report-card"><b>2.1</b><strong>이론적 배경 - 부분분수 분해와 수열·급수</strong><textarea defaultValue="부분분수 분해의 기본 원리와 선택한 관점의 핵심 개념을 정리한다." rows={3} /></article><article className="report-card"><b>2.2</b><strong>탐구 방법 - 형태를 한 겹씩 바꿔 밀어보기</strong><textarea defaultValue="분모의 형태를 단계적으로 바꾸며 공식의 경계선과 예외를 표로 기록한다." rows={3} /></article><div className="report-actions"><button onClick={onReset}>↻ 기본 탐구 다시 보기</button><button className="gradient-button" onClick={() => alert("탐구 세션을 저장했습니다.")}>세션 저장</button></div></section>; }

function StepFrame({ number, title, subtitle, children, onNext, onBack, color }: { number: string; title: string; subtitle: string; children: React.ReactNode; onNext: () => void; onBack: () => void; color: string }) { return <section className={`step-frame ${color}`}><div className="kicker">{number}</div><h1>{title}</h1><p className="subtitle">{subtitle}</p>{children}<div className="bottom-actions"><button onClick={onBack}>← 이전</button><button onClick={() => window.location.reload()}>↻ 다시 뽑기</button><button className="next-button" onClick={onNext}>다음 →</button></div></section>; }
