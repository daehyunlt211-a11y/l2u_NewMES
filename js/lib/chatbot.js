// =====================================================================
// AI 데이터 비서 (규칙기반 / Rule-based)
// ---------------------------------------------------------------------
// 현장 데이터(생산·품질·재고·설비·RFID)를 질의응답으로 조회합니다.
// LLM 미사용 — 키워드 의도분류 + ai.js 분석엔진 + db 조회로 답변 생성.
// (향후 Cloudflare Function + Claude API 백엔드로 교체 가능한 구조)
// =====================================================================
import { db } from './db.js';
import { predictDelays, analyzeDefects, predictInventory, detectEquipmentAnomaly, RISK_LABEL } from './ai.js';
import { ragRetrieve, ragAnswer } from './rag.js';
import { num, todayStr, fmtDate, escapeHtml } from './format.js';

export const CHAT_SUGGESTIONS = ['오늘 생산량', '지연 위험 작업지시', '재고 부족 자재', '설비 이상 있어?', 'LOT-WIP-001 추적', '불량 현황'];

const fmtDT = (s) => (s ? String(s).slice(0, 16).replace('T', ' ') : '');
const ul = (items) => `<ul class="chat-ul">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

// 의도 분류 (키워드 가중치)
const INTENTS = [
  { id: 'help', kw: ['도움', '도움말', 'help', '뭐 할', '뭐할', '무엇', '기능', '사용법', '명령', '안녕', '하이', 'hi', 'hello', '반가'] },
  { id: 'rfid', kw: ['rfid', 'lot', '로트', '추적', '위치', '어디', '이동', '태그', '경로'] },
  { id: 'delay', kw: ['지연', '납기', '늦', '위험', '딜레이', 'delay', '못 맞', '못맞'] },
  { id: 'defect', kw: ['불량', '품질', '부적합', 'defect', '결함', '클레임'] },
  { id: 'inventory', kw: ['재고', '발주', '부족', '소진', 'stock', '자재 얼마', '재고량'] },
  { id: 'equipment', kw: ['설비', '고장', '점검', '예지', '장비', 'machine', '진동', '온도'] },
  { id: 'production', kw: ['생산량', '실적', '생산', '금일', '오늘', '수율', '만들', '몇 개', '몇개'] },
  { id: 'workorder', kw: ['작업지시', '작업 지시', '작지', '진행', '작업현황', '작업 현황'] },
  { id: 'sales', kw: ['수주', '주문', '영업', '매출'] },
];

function classify(lower) {
  let best = null, bestScore = 0;
  for (const it of INTENTS) {
    let s = 0;
    for (const k of it.kw) if (lower.includes(k)) s += k.length >= 3 ? 2 : 1;
    if (s > bestScore) { bestScore = s; best = it.id; }
  }
  // LOT 토큰이 있고 다른 의도가 약하면 RFID 추적 우선 (일반 코드는 RAG가 처리)
  if (/lot[-\w]*/i.test(lower) && bestScore <= 2) return 'rfid';
  return best || 'fallback';
}

export async function chatAnswer(qRaw) {
  const q = String(qRaw || '').trim();
  if (!q) return { html: '질문을 입력해 주세요.', suggestions: CHAT_SUGGESTIONS };
  const lower = q.toLowerCase();
  const intent = classify(lower);
  try {
    // 1) 도움말 / RFID 추적(전용 타임라인)은 그대로
    if (intent === 'help') return ansHelp();
    // 납품 지연/미납 — 계산 상태이므로 전용 처리 (RAG로는 못 찾음)
    if (/납품|출하|배송|미납/.test(q) && /지연|늦|밀|미납|안.?된|안.?나|못.?받/.test(lower)) return await ansDeliveryDelay();
    if (intent === 'rfid') return await ansRfid(q, lower);
    // 2) RAG 검색: 특정 개체(코드·거래처·품목 등) 질의는 검색 근거로 답변
    const rag = await ragRetrieve(q);
    const strong = rag.length && rag[0].score >= 4;
    const analytical = { production: ansProduction, delay: ansDelay, defect: ansDefect, inventory: ansInventory, equipment: ansEquipment, workorder: ansWorkOrder, sales: ansSales };
    if (strong) return ragAnswer(q, rag);
    // 3) 집계형 질문은 인텔리전스 분석으로
    if (analytical[intent]) return await analytical[intent]();
    // 4) 그 외 자유질의도 RAG로 답변
    if (rag.length) return ragAnswer(q, rag);
    return ansFallback();
  } catch (e) {
    return { html: `데이터를 불러오지 못했습니다.<br><span class="muted">${escapeHtml(e.message || e)}</span>`, suggestions: CHAT_SUGGESTIONS };
  }
}

// ---------- 의도별 응답 ----------
async function ansProduction() {
  const results = await db.all('production_results', {});
  const t = todayStr();
  const todayRes = results.filter(r => String(r.result_date).slice(0, 10) === t);
  const good = todayRes.reduce((s, r) => s + (+r.good_qty || 0), 0);
  const defect = todayRes.reduce((s, r) => s + (+r.defect_qty || 0), 0);
  const yieldRate = good + defect ? (good / (good + defect) * 100).toFixed(1) : '—';
  if (!todayRes.length) {
    const allGood = results.reduce((s, r) => s + (+r.good_qty || 0), 0);
    return { html: `오늘(${t}) 등록된 생산실적이 없습니다.<br>누적 생산실적은 <b>${num(results.length)}건 · 양품 ${num(allGood)}EA</b> 입니다.`, suggestions: ['지연 위험 작업지시', '작업지시 현황'] };
  }
  return {
    html: `📊 <b>오늘(${t}) 생산 현황</b>` + ul([
      `생산량 <b>${num(good + defect)} EA</b> (양품 ${num(good)} · 불량 ${num(defect)})`,
      `수율 <b>${yieldRate}%</b>`,
      `실적 건수 ${num(todayRes.length)}건`,
    ]), suggestions: ['불량 현황', '지연 위험 작업지시'],
  };
}

async function ansDelay() {
  const { items, summary } = await predictDelays();
  const top = items.filter(i => i.risk === 'critical' || i.risk === 'high' || i.risk === 'medium').slice(0, 4);
  if (!top.length) return { html: `진행중 작업지시 ${num(summary.total)}건 모두 <b style="color:var(--success)">정상 진행</b> 중입니다. 지연 위험 없음 ✅`, suggestions: ['오늘 생산량', '재고 부족 자재'] };
  return {
    html: `⚠️ <b>생산지연 위험</b> (납기초과 ${summary.critical} · 높음 ${summary.high} · 보통 ${summary.medium})` +
      ul(top.map(i => `${escapeHtml(i.wo.item_name || i.wo.wo_no)} — <b>${RISK_LABEL[i.risk]}</b> (진척 ${i.progress}%, 잔량 ${num(i.remaining)})<br><span class="muted">→ ${escapeHtml(i.rec)}</span>`)),
    suggestions: ['설비 이상 있어?', '재고 부족 자재'],
  };
}

// 납품 지연(미납·납기경과) — 생산완료 수주 중 납품완료 안 된 건이 납기 경과
async function ansDeliveryDelay() {
  const t = todayStr();
  const [orders, plans, wos, dels] = await Promise.all([
    db.all('sales_orders', {}), db.all('production_plans', {}), db.all('work_orders', {}), db.all('deliveries', {}),
  ]);
  const planByOrder = {}; for (const p of plans) (planByOrder[p.order_no] ??= []).push(p.plan_no);
  const allWoComplete = (pns) => { const ws = wos.filter(w => pns.includes(w.plan_no)); return ws.length > 0 && ws.every(w => w.status === '완료'); };
  const prodComplete = (o) => o.status === '완료' || allWoComplete(planByOrder[o.order_no] || []);
  const delivered = new Set(dels.filter(d => d.status === '납품완료').map(d => d.order_no));
  const delayed = orders.filter(prodComplete)
    .filter(o => !delivered.has(o.order_no))
    .map(o => ({ ...o, due: String(o.due_date || '').slice(0, 10) }))
    .filter(o => o.due && o.due < t)
    .sort((a, b) => a.due.localeCompare(b.due));
  if (!delayed.length) return { html: `🚚 납기 경과된 <b>미납(납품지연) 건이 없습니다</b> ✅<br><span class="muted">생산완료 후 납기를 넘긴 미납 수주가 없습니다.</span>`, suggestions: ['납품 대기 목록', '오늘 생산량'] };
  const day = (d) => Math.round((new Date(t) - new Date(d)) / 86400000);
  return {
    html: `🚚 <b>납품 지연</b> (납기 경과·미납) <b>${num(delayed.length)}건</b>` +
      ul(delayed.map(o => `${escapeHtml(o.partner)} · ${escapeHtml(o.item_name || o.item_code)} ${num(o.order_qty)}EA · 납기 ${fmtDate(o.due)} <b style="color:var(--danger)">(${day(o.due)}일 경과)</b>`)),
    suggestions: ['지연 위험 작업지시', '오늘 생산량'],
  };
}

async function ansDefect() {
  const a = await analyzeDefects();
  return {
    html: `🛡️ <b>품질/불량 현황</b>` + ul([
      `누적 불량 <b>${num(a.summary.qty)}EA</b> (${num(a.summary.count)}건)`,
      `주요 원인 <b>${escapeHtml(a.summary.topCause)}</b> · 취약 공정 <b>${escapeHtml(a.summary.topProcess)}</b>`,
      `최근 7일 추세 <b>${a.summary.trendPct >= 0 ? '+' : ''}${a.summary.trendPct}%</b>`,
    ]) + (a.recommendations[0] ? `<div class="chat-reco">💡 ${escapeHtml(a.recommendations[0].detail)}</div>` : ''),
    suggestions: ['오늘 생산량', '설비 이상 있어?'],
  };
}

async function ansInventory() {
  const { list, summary } = await predictInventory();
  const need = list.filter(i => i.reorderQty > 0).slice(0, 5);
  if (!need.length) return { html: `재고 부족/소진 임박 자재가 없습니다. 발주 필요 품목 없음 ✅`, suggestions: ['오늘 생산량', '지연 위험 작업지시'] };
  return {
    html: `📦 <b>재고 알림</b> (소진 ${summary.out} · 미달 ${summary.low} · 임박 ${summary.soon})` +
      ul(need.map(i => `${escapeHtml(i.item_name || i.item_code)} — 현재고 <b>${num(i.stock)}</b>${i.daysToOut != null ? ` (${i.daysToOut}일 후 소진)` : ''} · 추천발주 <b style="color:var(--brand)">+${num(i.reorderQty)}</b>`)),
    suggestions: ['설비 이상 있어?', '불량 현황'],
  };
}

async function ansEquipment() {
  const { list, summary } = await detectEquipmentAnomaly();
  const risk = list.filter(i => i.risk === 'critical' || i.risk === 'high').slice(0, 4);
  if (!risk.length) return { html: `설비 ${num(summary.total)}대 모두 정상 범위입니다. 평균 건강도 <b>${summary.avgHealth}점</b> ✅`, suggestions: ['오늘 생산량', '재고 부족 자재'] };
  return {
    html: `🔧 <b>설비 이상징후</b> (긴급 ${summary.critical} · 점검권장 ${summary.high})` +
      ul(risk.map(i => `${escapeHtml(i.equip.name)} — 건강도 <b>${i.health}</b> · ${escapeHtml(i.signals[0] || i.equip.status)}<br><span class="muted">→ ${escapeHtml(i.rec)}</span>`)),
    suggestions: ['지연 위험 작업지시', '불량 현황'],
  };
}

async function ansWorkOrder() {
  const wos = await db.all('work_orders', {});
  const cnt = (s) => wos.filter(w => w.status === s).length;
  return {
    html: `🏭 <b>작업지시 현황</b> (총 ${num(wos.length)}건)` + ul([
      `대기 ${cnt('대기')} · 작업중 <b>${cnt('작업중')}</b> · 완료 ${cnt('완료')} · 중단 ${cnt('중단')}`,
    ]), suggestions: ['지연 위험 작업지시', '오늘 생산량'],
  };
}

async function ansSales() {
  const orders = await db.all('sales_orders', {});
  const amount = orders.reduce((s, r) => s + (+r.amount || 0), 0);
  const cnt = (s) => orders.filter(o => o.status === s).length;
  return {
    html: `🛒 <b>수주 현황</b>` + ul([
      `총 <b>${num(orders.length)}건</b> · 누적금액 <b>₩${num(amount)}</b>`,
      `접수 ${cnt('접수')} · 생산중 ${cnt('생산중')} · 완료 ${cnt('완료')}`,
    ]), suggestions: ['지연 위험 작업지시', '작업지시 현황'],
  };
}

async function ansRfid(q, lower) {
  const [events, tags] = await Promise.all([db.all('rfid_events', {}), db.all('rfid_tags', {})]);
  // LOT 토큰 추출
  const m = q.match(/LOT[-\w]*/i) || lower.match(/[a-z]-?\d{3,}[-\w]*/i);
  const token = m ? m[0] : null;
  if (token) {
    const key = token.toUpperCase();
    const evs = events.filter(e => String(e.lot_no).toUpperCase() === key || String(e.ref_code).toUpperCase() === key)
      .sort((a, b) => String(a.event_time).localeCompare(String(b.event_time)));
    if (!evs.length) return { html: `"${escapeHtml(token)}" 의 RFID 이동 이력을 찾지 못했습니다.`, suggestions: ['LOT-WIP-001 추적', 'RFID 최근 이동'] };
    const last = evs[evs.length - 1];
    return {
      html: `📡 <b>${escapeHtml(evs[0].lot_no || token)} 이동 경로</b> (${evs.length}회 인식)` +
        ul(evs.map(e => `${fmtDT(e.event_time)} · <b>${escapeHtml(e.gate)}</b> (${escapeHtml(e.event_type)})`)) +
        `<div class="chat-reco">📍 현재 위치: <b>${escapeHtml(last.location || last.gate)}</b></div>`,
      suggestions: ['불량 현황', 'RFID 최근 이동'],
    };
  }
  // LOT 미지정 — 최근 이동
  const recent = [...events].sort((a, b) => String(b.event_time).localeCompare(String(a.event_time))).slice(0, 5);
  const active = tags.filter(t => t.status === '활성').length;
  return {
    html: `📡 <b>RFID 현황</b> — 태그 ${num(tags.length)}개 (활성 ${active})` +
      (recent.length ? ul(recent.map(e => `${escapeHtml(e.gate)} · ${escapeHtml(e.lot_no || e.tag_uid)} (${escapeHtml(e.event_type)})`)) : '<br>이동 이력이 없습니다.') +
      `<div class="muted" style="margin-top:6px">특정 LOT를 추적하려면 "LOT-WIP-001 추적"처럼 입력하세요.</div>`,
    suggestions: ['LOT-WIP-001 추적', '지연 위험 작업지시'],
  };
}

function ansHelp() {
  return {
    html: `안녕하세요! 저는 <b>AI 데이터 비서</b>입니다 🤖<br>집계 분석은 물론, <b>특정 항목 검색(RAG)</b>도 가능해요. 이런 걸 물어보세요:` +
      ul([
        '"오늘 생산량" · "지연 위험 작업지시" — 집계 분석',
        '"재고 부족 자재" · "설비 이상 있어?" · "불량 현황"',
        '<b>"SO-2406-001"</b> — 특정 수주 조회',
        '<b>"현대정밀 수주"</b> — 거래처별 검색',
        '<b>"브라켓 ASSY"</b> — 품목 관련 전체(재고·검사·불량…)',
        '<b>"CNC-01"</b> · <b>"LOT-WIP-001 추적"</b>',
      ]),
    suggestions: [...CHAT_SUGGESTIONS, '브라켓 ASSY'],
  };
}

function ansFallback() {
  return {
    html: `질문을 이해하지 못했어요 😅 생산·품질·재고·설비·RFID 관련해서 물어봐 주세요.<br><span class="muted">"도움말"이라고 입력하면 사용법을 안내합니다.</span>`,
    suggestions: CHAT_SUGGESTIONS,
  };
}
