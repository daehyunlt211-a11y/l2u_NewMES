// AI 수주예측 — 거래처×품목 주문주기 분석 + 월별 캘린더(예상/실제 수주)
import { forecastOrders } from '../lib/ai.js';
import { db } from '../lib/db.js';
import { num, won, fmtDate, todayStr, escapeHtml } from '../lib/format.js';
import { badge, openModal } from '../ui/components.js';
import { icon } from '../ui/icons.js';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const probTone = (p) => p >= 70 ? 'success' : p >= 45 ? 'warning' : 'neutral';
const ddLabel = (d) => d < 0 ? badge(`${Math.abs(d)}일 경과`, 'danger') : d === 0 ? badge('오늘', 'warning') : badge(`D-${d}`, d <= 7 ? 'warning' : 'neutral');
function confBar(p) { return `<div class="flex" style="gap:8px;align-items:center"><div class="progress" style="flex:1;max-width:110px"><span style="width:${p}%"></span></div><span class="mono" style="font-weight:700">${p}%</span></div>`; }

export async function salesForecast(root) {
  root.innerHTML = `<div class="spinner" style="margin:80px auto"></div>`;
  let data, orders;
  try { [data, orders] = await Promise.all([forecastOrders(), db.all('sales_orders', {})]); }
  catch (e) { root.innerHTML = `<div class="empty" style="padding:80px">${icon('alert', 48)}<h4>불러오기 실패</h4><p>${escapeHtml(e.message || e)}</p></div>`; return; }
  const { items, summary } = data;

  // 날짜별 인덱스: 예상(예측) / 실제(수주이력)
  const predByDay = {}, actualByDay = {};
  for (const i of items) { (predByDay[i.predDate] ??= []).push(i); }
  for (const o of orders) { const d = String(o.order_date || '').slice(0, 10); if (d) (actualByDay[d] ??= []).push(o); }

  const top = items.filter(i => i.daysToPred >= -3 && i.prob >= 40).slice(0, 6);
  const sentences = top.map(i => {
    const when = i.daysToPred < 0 ? `예정일(${i.predDate})이 지났고` : i.daysToPred === 0 ? '오늘' : `${i.daysToPred}일 후(${i.predDate})`;
    return `<b>${escapeHtml(i.partner)}</b> 가(이) <b>${escapeHtml(i.item_name || i.item_code)}</b> 약 ${num(i.avgQty)}EA 를 <b>${when}</b> 수주 등록할 확률 <b style="color:var(--brand)">${i.prob}%</b>`;
  });

  // 캘린더 초기 월: 가장 임박한 예측이 있는 달, 없으면 이번 달
  const base = (top[0]?.predDate) ? new Date(top[0].predDate) : new Date(todayStr());
  const cal = { y: base.getFullYear(), m: base.getMonth() };

  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text"><h1>AI 수주예측</h1><p>주문주기를 분석해 향후 수주를 예측하고, 달력에서 날짜별 예상·실제 수주를 확인합니다.</p></div>
      <div class="page-head__actions"><span class="badge badge--violet">${icon('brain', 14)} AI 예측</span><span class="muted">${new Date().toLocaleString('ko-KR')}</span></div>
    </div>
    <div class="ai-note">${icon('alert', 16)} 예측은 과거 패턴 기반 <b>추정치</b>입니다. 실제 영업 상황(시즌·프로모션·재고)과 함께 참고하세요.</div>
    <div class="stat-grid">
      ${stat('예측 조합', num(summary.total), '건', 'target', 'brand', '거래처×품목')}
      ${stat('7일내 예상수주', num(summary.within7), '건', 'clock', 'amber')}
      ${stat('높은 확률(70%+)', num(summary.high), '건', 'trendUp', 'green')}
      ${stat('평균 확률', num(summary.avgProb), '%', 'activity', 'violet')}
    </div>
    ${sentences.length ? `<div class="card"><div class="card__head">${icon('zap', 18)}<h3>임박 수주 예측 요약</h3></div><div class="card__body">
      <ul class="ai-highlights">${sentences.map(s => `<li>${icon('chevronRight', 14)} <span>${s}</span></li>`).join('')}</ul></div></div>` : ''}
    <div class="card" style="margin-bottom:18px">
      <div class="card__head">${icon('calendar', 18)}<h3>수주 캘린더</h3><div class="spacer"></div>
        <button class="btn btn--sm btn--icon" id="cal-prev">${icon('chevronLeft', 16)}</button>
        <span id="cal-title" style="font-weight:700;min-width:120px;text-align:center"></span>
        <button class="btn btn--sm btn--icon" id="cal-next">${icon('chevronRight', 16)}</button>
        <button class="btn btn--sm" id="cal-today">오늘</button>
      </div>
      <div class="card__body">
        <div class="cal-legend"><span><span class="cal-dot" style="background:var(--brand-50);border:1px solid var(--brand)"></span>예상 수주</span><span><span class="cal-dot" style="background:rgba(22,163,74,.18);border:1px solid #16a34a"></span>실제 수주</span></div>
        <div class="cal-grid" id="cal-grid"></div>
      </div>
    </div>
    <div class="card"><div class="card__head">${icon('cart', 18)}<h3>거래처·품목별 수주 예측 (확률순)</h3><div class="spacer"></div><span class="muted">총 ${num(items.length)}건</span></div>
      <div class="table-wrap"><table class="grid">
        <thead><tr><th>거래처</th><th>품목</th><th class="num">예상수량</th><th class="center">최근수주</th><th class="center">예상수주일</th><th class="center">D-day</th><th style="width:170px">확률</th><th>분석근거</th></tr></thead>
        <tbody>${items.length ? items.map(i => `<tr>
          <td class="cell-strong">${escapeHtml(i.partner)}</td>
          <td>${escapeHtml(i.item_name || '')}<div class="muted cell-code">${escapeHtml(i.item_code)}</div></td>
          <td class="num mono">${num(i.avgQty)}</td>
          <td class="center">${fmtDate(i.lastDate)}</td>
          <td class="center">${fmtDate(i.predDate)}</td>
          <td class="center">${ddLabel(i.daysToPred)}</td>
          <td>${confBar(i.prob)}</td>
          <td class="muted">${escapeHtml(i.reason)}</td>
        </tr>`).join('') : `<tr><td colspan="8"><div class="empty" style="padding:40px">${icon('inbox', 44)}<h4>예측할 수주 이력이 없습니다</h4></div></td></tr>`}</tbody>
      </table></div></div>`;

  const t0 = todayStr();
  function renderCalendar() {
    root.querySelector('#cal-title').textContent = `${cal.y}년 ${cal.m + 1}월`;
    const first = new Date(cal.y, cal.m, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(cal.y, cal.m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const head = DOW.map((w, i) => `<div class="cal-dow" style="${i === 0 ? 'color:#dc2626' : i === 6 ? 'color:#2563eb' : ''}">${w}</div>`).join('');
    const body = cells.map(d => {
      if (!d) return `<div class="cal-cell cal-cell--empty"></div>`;
      const ds = ymd(cal.y, cal.m, d);
      const preds = predByDay[ds] || [], acts = actualByDay[ds] || [];
      const evs = [
        ...preds.map(p => ({ cls: 'pred', label: `${p.partner} · ${p.item_name || p.item_code}`, sub: `${p.prob}%` })),
        ...acts.map(o => ({ cls: 'actual', label: `${o.partner} · ${o.item_name || o.item_code}`, sub: '' })),
      ];
      const shown = evs.slice(0, 3).map(e => `<div class="cal-ev cal-ev--${e.cls}" title="${escapeHtml(e.label)}">${escapeHtml(e.label)}${e.sub ? ` <b>${e.sub}</b>` : ''}</div>`).join('');
      const more = evs.length > 3 ? `<div class="cal-more">+${evs.length - 3}건</div>` : '';
      return `<div class="cal-cell ${ds === t0 ? 'is-today' : ''}" data-date="${ds}">
        <div class="cal-cell__day">${d}</div><div class="cal-cell__events">${shown}${more}</div></div>`;
    }).join('');

    const grid = root.querySelector('#cal-grid');
    grid.innerHTML = head + body;
    grid.querySelectorAll('[data-date]').forEach(el => el.onclick = () => openDay(el.dataset.date));
  }

  function openDay(ds) {
    const preds = predByDay[ds] || [], acts = actualByDay[ds] || [];
    if (!preds.length && !acts.length) return;
    const body = document.createElement('div');
    body.innerHTML = `
      ${preds.length ? `<h4 style="margin:0 0 8px;display:flex;align-items:center;gap:7px">${icon('brain', 16)} 예상 수주 <span class="muted">${preds.length}건</span></h4>
        <div class="table-wrap" style="margin-bottom:16px"><table class="grid"><thead><tr><th>거래처</th><th>품목</th><th class="num">예상수량</th><th class="center">확률</th></tr></thead>
        <tbody>${preds.map(p => `<tr><td class="cell-strong">${escapeHtml(p.partner)}</td><td>${escapeHtml(p.item_name || p.item_code)}</td><td class="num mono">${num(p.avgQty)}</td><td class="center">${badge(p.prob + '%', probTone(p.prob))}</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${acts.length ? `<h4 style="margin:0 0 8px;display:flex;align-items:center;gap:7px">${icon('checkCircle', 16)} 실제 수주 <span class="muted">${acts.length}건</span></h4>
        <div class="table-wrap"><table class="grid"><thead><tr><th>수주번호</th><th>거래처</th><th>품목</th><th class="num">수량</th><th class="num">금액</th><th class="center">상태</th></tr></thead>
        <tbody>${acts.map(o => `<tr><td class="cell-code">${escapeHtml(o.order_no || '')}</td><td>${escapeHtml(o.partner || '')}</td><td>${escapeHtml(o.item_name || '')}</td><td class="num mono">${num(o.order_qty)}</td><td class="num mono">${won(o.amount)}</td><td class="center">${badge(o.status || '')}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
    openModal({ title: `${ds} 수주 현황`, body, wide: true, footer: `<button class="btn" data-cancel>닫기</button>`, onMount: ({ footEl, close }) => { footEl.querySelector('[data-cancel]').onclick = close; } });
  }

  root.querySelector('#cal-prev').onclick = () => { cal.m--; if (cal.m < 0) { cal.m = 11; cal.y--; } renderCalendar(); };
  root.querySelector('#cal-next').onclick = () => { cal.m++; if (cal.m > 11) { cal.m = 0; cal.y++; } renderCalendar(); };
  root.querySelector('#cal-today').onclick = () => { const n = new Date(t0); cal.y = n.getFullYear(); cal.m = n.getMonth(); renderCalendar(); };
  renderCalendar();
}

function stat(label, value, unit, ic, tint, sub) {
  return `<div class="stat"><div class="stat__top"><span class="stat__label">${escapeHtml(label)}</span><span class="stat__ico ico-tint-${tint}">${icon(ic, 21)}</span></div>
    <div class="stat__value">${value}${unit ? `<small>${escapeHtml(unit)}</small>` : ''}</div>${sub ? `<div class="muted" style="margin-top:6px">${escapeHtml(sub)}</div>` : ''}</div>`;
}
