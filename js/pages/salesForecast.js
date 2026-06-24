// AI 수주예측 — 수주 이력 기반 거래처×품목 주문주기 분석으로 향후 수주를 예측
import { forecastOrders } from '../lib/ai.js';
import { num, won, fmtDate, escapeHtml } from '../lib/format.js';
import { badge } from '../ui/components.js';
import { icon } from '../ui/icons.js';

const probTone = (p) => p >= 70 ? 'success' : p >= 45 ? 'warning' : 'neutral';
const ddLabel = (d) => d < 0 ? badge(`${Math.abs(d)}일 경과`, 'danger') : d === 0 ? badge('오늘', 'warning') : badge(`D-${d}`, d <= 7 ? 'warning' : 'neutral');
function confBar(p) { return `<div class="flex" style="gap:8px;align-items:center"><div class="progress" style="flex:1;max-width:110px"><span style="width:${p}%"></span></div><span class="mono" style="font-weight:700">${p}%</span></div>`; }

export async function salesForecast(root) {
  root.innerHTML = `<div class="spinner" style="margin:80px auto"></div>`;
  let data;
  try { data = await forecastOrders(); }
  catch (e) { root.innerHTML = `<div class="empty" style="padding:80px">${icon('alert', 48)}<h4>불러오기 실패</h4><p>${escapeHtml(e.message || e)}</p></div>`; return; }
  const { items, summary } = data;

  // 임박/높은확률 우선 요약 문장
  const top = items.filter(i => i.daysToPred >= -3 && i.prob >= 40).slice(0, 6);
  const sentences = top.map(i => {
    const when = i.daysToPred < 0 ? `예정일(${i.predDate})이 지났고` : i.daysToPred === 0 ? '오늘' : `${i.daysToPred}일 후(${i.predDate})`;
    return `<b>${escapeHtml(i.partner)}</b> 가(이) <b>${escapeHtml(i.item_name || i.item_code)}</b> 약 ${num(i.avgQty)}EA 를 <b>${when}</b> 수주 등록할 확률 <b style="color:var(--brand)">${i.prob}%</b>`;
  });

  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text"><h1>AI 수주예측</h1><p>수주 이력의 거래처×품목 주문주기를 분석해 향후 수주 가능성을 예측합니다.</p></div>
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
        </tr>`).join('') : `<tr><td colspan="8"><div class="empty" style="padding:40px">${icon('inbox', 44)}<h4>예측할 수주 이력이 없습니다</h4><p>수주관리에 데이터가 쌓이면 예측이 표시됩니다.</p></div></td></tr>`}</tbody>
      </table></div></div>`;
}

function stat(label, value, unit, ic, tint, sub) {
  return `<div class="stat"><div class="stat__top"><span class="stat__label">${escapeHtml(label)}</span><span class="stat__ico ico-tint-${tint}">${icon(ic, 21)}</span></div>
    <div class="stat__value">${value}${unit ? `<small>${escapeHtml(unit)}</small>` : ''}</div>${sub ? `<div class="muted" style="margin-top:6px">${escapeHtml(sub)}</div>` : ''}</div>`;
}
