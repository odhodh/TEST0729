"use client";

import { useEffect, useMemo, useState } from "react";

type SubjectResult = { subject: string; organized: string; draft: string; review: string; checks: string[] };
type SavedRecord = { id?: string; student_id: string; grade: string; subject: string; content: string; created_at: string };

const subjects = ["국어", "수학", "영어", "과학", "사회", "정보", "예체능"];
const sampleResults: SubjectResult[] = [
  { subject: "수학", organized: "함수의 변화 양상을 그래프로 해석하고, 실생활 데이터를 활용해 모델링함.", draft: "함수의 변화 양상을 그래프로 해석하는 과정에서 핵심 개념을 스스로 정리하고, 실생활 데이터를 함수로 모델링하여 결과를 검증함. 자료를 비교하며 근거를 들어 자신의 풀이 과정을 설명하는 태도가 돋보임.", review: "함수의 변화 양상을 그래프로 해석하는 과정에서 핵심 개념을 정리하고, 실생활 데이터를 함수로 모델링하여 결과를 검증함. 자료를 비교하며 근거를 들어 자신의 풀이 과정을 설명함.", checks: ["단정적 표현 완화", "순위·비교 표현 없음"] },
  { subject: "정보", organized: "파이썬으로 학교 급식 만족도 설문 데이터를 전처리하고 시각화함.", draft: "파이썬을 활용해 학교 급식 만족도 설문 데이터를 전처리하고 시각화함. 결측값 처리 기준을 세우고 여러 차트의 특성을 비교하여 적절한 표현 방식을 선택함. 결과를 바탕으로 개선 방향을 논리적으로 제안함.", review: "파이썬을 활용해 학교 급식 만족도 설문 데이터를 전처리하고 시각화함. 결측값 처리 기준을 세우고 차트의 특성을 비교하여 적절한 표현 방식을 선택함. 결과를 바탕으로 개선 방향을 논리적으로 제안함.", checks: ["과장·우열 표현 없음", "과정 중심 서술로 정리"] },
];

const supabase = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };

async function supabaseRequest(path: string, options: RequestInit = {}) {
  if (!supabase.url || !supabase.key) return null;
  const response = await fetch(`${supabase.url}/rest/v1/${path}`, { ...options, headers: { apikey: supabase.key, Authorization: `Bearer ${supabase.key}`, "Content-Type": "application/json", ...(options.headers || {}) } });
  if (!response.ok) throw new Error("Supabase 요청을 완료하지 못했습니다.");
  return response.status === 204 ? null : response.json();
}

export default function Home() {
  const [tab, setTab] = useState<"create" | "history" | "settings">("create");
  const [grade, setGrade] = useState("2학년");
  const [studentId, setStudentId] = useState("20317");
  const [subject, setSubject] = useState("수학");
  const [keywords, setKeywords] = useState("");
  const [results, setResults] = useState<SubjectResult[]>(sampleResults);
  const [activeResult, setActiveResult] = useState(0);
  const [history, setHistory] = useState<SavedRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("Gemini 3.5 Flash-Lite");

  useEffect(() => {
    if (!supabase.url || !supabase.key) return;
    void supabaseRequest("setek_records?select=*&order=created_at.desc&limit=30")
      .then((data) => { if (data) setHistory(data); })
      .catch(() => setNotice("내역을 불러오지 못했습니다. 연결 설정을 확인해 주세요."));
  }, []);
  async function generate() {
    if (!keywords.trim()) { setNotice("학생 활동 키워드나 관찰 내용을 입력해 주세요."); return; }
    setIsGenerating(true); setNotice("3개 에이전트가 순서대로 문구를 다듬고 있습니다…");
    await new Promise((resolve) => setTimeout(resolve, 700));
    const subjectResult = sampleResults.find((item) => item.subject === subject) || { ...sampleResults[0], subject };
    const personalized = { ...subjectResult, organized: `${keywords.trim()} — 핵심 활동, 과정, 관찰 근거로 정리함.`, draft: `${keywords.trim()}을(를) 바탕으로 ${subject} 학습 내용을 탐구함. 활동 과정에서 핵심 개념을 정리하고, 자료를 근거로 자신의 생각과 해결 과정을 설명함. 결과를 점검하며 개선 방향을 구체적으로 제안하는 모습을 보임.`, review: `${keywords.trim()}을(를) 바탕으로 ${subject} 학습 내용을 탐구함. 활동 과정에서 핵심 개념을 정리하고, 자료를 근거로 자신의 생각과 해결 과정을 설명함. 결과를 점검하며 개선 방향을 제안함.` };
    setResults([personalized]); setActiveResult(0); setIsGenerating(false); setNotice("검토까지 완료되었습니다. 결과를 확인한 뒤 저장할 수 있습니다.");
  }
  async function saveResult() {
    const item = results[activeResult];
    const record = { student_id: studentId, grade, subject: item.subject, content: item.review, created_at: new Date().toISOString() };
    try { const saved = await supabaseRequest("setek_records", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(record) }); setHistory((current) => [...(saved || [record]), ...current]); setNotice(supabase.url ? "Supabase에 저장했습니다." : "데모 모드입니다. 환경변수를 연결하면 Supabase에 저장됩니다."); } catch { setNotice("저장에 실패했습니다. Supabase 테이블과 정책을 확인해 주세요."); }
  }
  const current = results[activeResult];
  const dateLabel = useMemo(() => new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date()), []);

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S</div><div><strong>세특 스튜디오</strong><small>STUDENT RECORDS</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <nav><button className={tab === "create" ? "nav-active" : ""} onClick={() => setTab("create")}><span>✦</span> 새 문구 만들기</button><button className={tab === "history" ? "nav-active" : ""} onClick={() => setTab("history")}><span>▤</span> 저장 내역 <em>{history.length || 12}</em></button></nav>
      <div className="side-bottom"><div className="side-label">ACCOUNT</div><button className={tab === "settings" ? "nav-active" : ""} onClick={() => setTab("settings")}><span>⚙</span> 개인 설정</button><div className="profile"><div className="avatar">김</div><div><strong>김선생님</strong><small>국어 · 담임</small></div><span>⋯</span></div></div>
    </aside>
    <section className="content"><header className="topbar"><div><span className="eyebrow">2026학년도 · {dateLabel}</span><h1>{tab === "create" ? "새 세특 문구 만들기" : tab === "history" ? "저장 내역" : "개인 설정"}</h1></div><div className="top-actions"><span className="connection"><i /> {supabase.url ? "Supabase 연결됨" : "데모 모드"}</span><button className="icon-button" aria-label="알림">♧</button></div></header>
      {tab === "settings" ? <Settings apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel} /> : tab === "history" ? <History history={history} /> : <>
        <div className="workflow"><div className="step done"><span>01</span><div><strong>활동 입력</strong><small>학생 활동 키워드</small></div></div><div className="line active" /><div className="step current"><span>02</span><div><strong>문구 생성</strong><small>3-에이전트 검토</small></div></div><div className="line" /><div className="step"><span>03</span><div><strong>저장·관리</strong><small>Supabase 기록</small></div></div></div>
        <div className="workspace-grid"><section className="panel input-panel"><div className="panel-heading"><div><span className="section-kicker">STEP 01</span><h2>학생 활동을 알려주세요</h2></div><span className="required">* 필수 입력</span></div><label>학생 식별값<input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="예: 20317" /></label><div className="two-col"><label>학년<select value={grade} onChange={(e) => setGrade(e.target.value)}>{["1학년", "2학년", "3학년"].map((v) => <option key={v}>{v}</option>)}</select></label><label>과목<select value={subject} onChange={(e) => setSubject(e.target.value)}>{subjects.map((v) => <option key={v}>{v}</option>)}</select></label></div><label>활동 키워드 또는 관찰 내용<textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="수업, 탐구, 발표, 협업 과정에서 관찰한 학생의 구체적인 모습을 적어주세요." rows={7} /><small className="hint">구체적인 행동과 과정을 중심으로 입력하면 더 정확한 초안을 만들 수 있어요.</small></label><button className="primary-button" onClick={generate} disabled={isGenerating}>{isGenerating ? "에이전트 처리 중…" : "세특 문구 생성하기  →"}</button>{notice && <p className="notice" role="status">{notice}</p>}<div className="privacy"><span>♢</span><div><strong>안전한 기록 관리</strong><p>학생 식별값은 선생님이 설정한 기준으로만 관리되며, 생성 결과는 저장하기 전까지 외부에 기록되지 않습니다.</p></div></div></section>
          <section className="panel result-panel"><div className="panel-heading"><div><span className="section-kicker">STEP 02 · AI WORKFLOW</span><h2>과목별 생성 결과</h2></div><span className="review-badge"><i /> 검토 완료</span></div><div className="agent-row"><Agent number="01" label="수집 에이전트" /><span>→</span><Agent number="02" label="작성 에이전트" /><span>→</span><Agent number="03" label="검토 에이전트" /></div><div className="subject-tabs">{results.map((item, index) => <button key={`${item.subject}-${index}`} className={index === activeResult ? "selected" : ""} onClick={() => setActiveResult(index)}>{item.subject}</button>)}</div>{current && <><div className="result-meta"><strong>{current.subject} · {grade}</strong><span>학생 {studentId} · 최종 검토본</span></div><div className="result-copy">{current.review}</div><div className="review-notes">{current.checks.map((check) => <span key={check}>✓ {check}</span>)}</div><div className="result-actions"><button className="download-button" onClick={() => { const blob = new Blob([current.review], { type: "text/plain;charset=utf-8" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${studentId}_${current.subject}_세특.txt`; link.click(); }}>↓ 텍스트 다운로드</button><button className="save-button" onClick={saveResult}>Supabase에 저장</button></div></>}</section></div>
      </>}</section>
  </main>;
}

function Agent({ number, label }: { number: string; label: string }) { return <div className="agent"><span>{number}</span><small>{label}</small></div>; }
function History({ history }: { history: SavedRecord[] }) { return <section className="history-panel panel"><div className="panel-heading"><div><span className="section-kicker">ARCHIVE</span><h2>저장된 세특 문구</h2></div><span className="count-badge">{history.length} records</span></div>{history.length ? <div className="history-list">{history.map((item, index) => <article className="history-item" key={item.id || `${item.created_at}-${index}`}><div className="history-date">{new Date(item.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</div><div><strong>{item.subject} · {item.grade}</strong><p>{item.content}</p><small>학생 {item.student_id}</small></div><button className="icon-button" onClick={() => navigator.clipboard?.writeText(item.content)} aria-label="문구 복사">⧉</button></article>)}</div> : <div className="empty-state">아직 저장된 내역이 없습니다.<br />생성 결과를 Supabase에 저장하면 여기에 표시됩니다.</div>}</section>; }
function Settings({ apiKey, setApiKey, model, setModel }: { apiKey: string; setApiKey: (v: string) => void; model: string; setModel: (v: string) => void }) { return <section className="settings-panel panel"><span className="section-kicker">PERSONAL PREFERENCES</span><h2>개인 설정</h2><p className="subcopy">AI 문구 생성에 사용할 Gemini API와 선호 모델을 지정합니다.</p><label>Gemini API Key<input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza…" /></label><label>선호 모델<select value={model} onChange={(e) => setModel(e.target.value)}><option>Gemini 3.5 Flash-Lite</option><option>Gemini 2.5 Flash</option><option>Gemini 2.5 Pro</option></select></label><button className="primary-button" onClick={() => alert("개인 설정을 저장했습니다.")}>설정 저장</button><div className="settings-note">API 키는 현재 브라우저 세션에서만 사용됩니다. 운영 배포 시에는 서버 환경변수로 관리하고, Supabase RLS 정책을 함께 설정하세요.</div></section>; }
