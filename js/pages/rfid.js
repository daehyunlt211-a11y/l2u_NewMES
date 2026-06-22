// =====================================================================
// RFID 추적 — 태그관리 / 이동 이력 / LOT 추적(타임라인)
// RFID는 팔레트·대차·박스·금형·공구·검사구 등 반복/추적효과가 큰 대상에 적용.
// 게이트(공정입구·검사장·포장장·출하장·창고)의 리더 인식으로 이동 이력을 자동 수집.
// =====================================================================
import { createCrudPage } from '../lib/crud.js';
import { db } from '../lib/db.js';
import { num, escapeHtml } from '../lib/format.js';
import { badge } from '../ui/components.js';
import { icon } from '../ui/icons.js';

const TAG_TYPES = ['팔레트', '대차', '박스', '금형', '지그', '공구', '검사구', '자재'];
const TAG_STATUS = ['활성', '비활성', '분실'];
const GATES = ['창고입구', '적치랙', '공정입구', '검사장', '포장장', '출하장', '출고장'];
const EVENT_TYPES = ['입고', '적치', '공정이동', '검사이동', '포장이동', '출하이동', '피킹', '출고'];

const fmtDT = (s) => (s ? String(s).slice(0, 16).replace('T', ' ') : '');

// ---------------------------------------------------------------------
// 3.1 RFID 태그관리
// ---------------------------------------------------------------------
export const rfidTags = createCrudPage({
  table: 'rfid_tags', title: 'RFID 태그관리', subtitle: '팔레트·대차·금형·공구 등 추적 대상의 RFID 태그를 등록·관리합니다.',
  searchFields: ['tag_uid', 'label', 'ref_code', 'lot_no', 'location'], searchPlaceholder: 'UID·라벨·매칭코드·LOT 검색',
  defaultSort: { key: 'tag_uid', dir: 'asc' },
  filters: [
    { key: 'tag_type', label: '태그유형', options: TAG_TYPES },
    { key: 'status', label: '상태', options: TAG_STATUS },
  ],
  statusChips: { key: 'tag_type', options: TAG_TYPES },
  stats: async (rows) => {
    const c = (s) => rows.filter(r => r.status === s).length;
    return [
      { label: '전체 태그', value: num(rows.length), unit: '개', icon: 'radio', tint: 'brand' },
      { label: '활성', value: num(c('활성')), unit: '개', icon: 'checkCircle', tint: 'green' },
      { label: '비활성', value: num(c('비활성')), unit: '개', icon: 'archive', tint: 'amber' },
      { label: '분실', value: num(c('분실')), unit: '개', icon: 'alert', tint: 'red' },
    ];
  },
  columns: [
    { key: 'tag_uid', label: 'RFID UID', cls: 'cell-code', sortable: true },
    { key: 'tag_type', label: '유형', type: 'badge', tone: 'brand', align: 'center' },
    { key: 'label', label: '라벨/설명', cls: 'cell-strong' },
    { key: 'ref_code', label: '매칭코드' },
    { key: 'lot_no', label: 'LOT' },
    { key: 'location', label: '현재위치' },
    { key: 'use_count', label: '사용횟수', type: 'num' },
    { key: 'status', label: '상태', type: 'badge', align: 'center' },
    { key: 'last_seen', label: '최근인식', type: 'date', sortable: true },
  ],
  fields: [
    { key: 'tag_uid', label: 'RFID UID', required: true, placeholder: '예: E280-1170-0001' },
    { key: 'tag_type', label: '태그유형', type: 'select', options: TAG_TYPES, default: '팔레트', required: true },
    { key: 'label', label: '라벨/설명', placeholder: '예: 출하용 팔레트 #1' },
    { key: 'ref_code', label: '매칭코드', placeholder: '품목·설비·작업지시 코드' },
    { key: 'lot_no', label: 'LOT 번호', placeholder: '적재된 LOT' },
    { key: 'location', label: '현재위치', placeholder: '예: 출하장' },
    { key: 'use_count', label: '사용횟수(금형/공구)', type: 'number', default: 0 },
    { key: 'life_count', label: '수명한도(횟수)', type: 'number', default: 0 },
    { key: 'status', label: '상태', type: 'select', options: TAG_STATUS, default: '활성' },
    { key: 'assigned_to', label: '담당/배정' },
    { key: 'last_seen', label: '최근 인식일', type: 'date' },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});

// ---------------------------------------------------------------------
// 3.2 RFID 이동 이력 (게이트 리더 자동 인식 로그)
// ---------------------------------------------------------------------
export const rfidEvents = createCrudPage({
  table: 'rfid_events', title: 'RFID 이동 이력', subtitle: '게이트(공정입구·검사장·포장장·출하장) 리더가 인식한 이동 이력입니다.',
  searchFields: ['event_no', 'tag_uid', 'lot_no', 'ref_code', 'gate', 'reader'], searchPlaceholder: '이력번호·UID·LOT·게이트 검색',
  defaultSort: { key: 'event_time', dir: 'desc' },
  docNoField: { key: 'event_no', prefix: 'RF' },
  filters: [
    { key: 'event_type', label: '이벤트', options: EVENT_TYPES },
    { key: 'gate', label: '게이트', options: GATES },
  ],
  statusChips: { key: 'event_type', options: EVENT_TYPES },
  columns: [
    { key: 'event_no', label: '이력번호', cls: 'cell-code', sortable: true },
    { key: 'event_time', label: '인식시각', sortable: true, render: (r) => fmtDT(r.event_time), csv: (r) => fmtDT(r.event_time) },
    { key: 'tag_uid', label: 'RFID UID', cls: 'cell-code' },
    { key: 'tag_type', label: '유형', type: 'badge', tone: 'brand', align: 'center' },
    { key: 'gate', label: '게이트' },
    { key: 'event_type', label: '이벤트', type: 'badge', align: 'center' },
    { key: 'lot_no', label: 'LOT' },
    { key: 'ref_code', label: '매칭코드' },
    { key: 'reader', label: '리더기' },
  ],
  fields: [
    { key: 'event_no', label: '이력번호', placeholder: '자동 채번(RF-YYMM-001)' },
    { key: 'event_time', label: '인식시각', type: 'date', required: true },
    { key: 'tag_uid', label: 'RFID 태그', ref: { table: 'rfid_tags', value: 'tag_uid', label: (r) => `${r.tag_uid} · ${r.label || r.tag_type}`, fill: { tag_type: 'tag_type', lot_no: 'lot_no', ref_code: 'ref_code' } }, placeholder: '태그 선택', required: true },
    { key: 'tag_type', label: '태그유형', type: 'select', options: TAG_TYPES },
    { key: 'gate', label: '게이트', type: 'select', options: GATES, default: '공정입구', required: true },
    { key: 'event_type', label: '이벤트유형', type: 'select', options: EVENT_TYPES, default: '공정이동', required: true },
    { key: 'lot_no', label: 'LOT 번호' },
    { key: 'ref_code', label: '매칭코드' },
    { key: 'reader', label: '리더기', placeholder: '예: RDR-OP10' },
    { key: 'location', label: '위치' },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});

// ---------------------------------------------------------------------
// 3.3 LOT 추적 (이동 경로 타임라인)
// ---------------------------------------------------------------------
export async function rfidTrace(root) {
  root.innerHTML = `
    <div class="page-head"><div class="page-head__text"><h1>RFID LOT 추적</h1><p>LOT의 RFID 이동 경로(공정→검사→포장→출하)를 역추적합니다. 불량 발생 시 영향범위 분석에 활용하세요.</p></div>
      <div class="page-head__actions"><span class="badge badge--brand">${icon('route', 14)} 추적성</span></div></div>
    <div class="card"><div class="toolbar">
      <div class="search-box grow">${icon('search', 16)}<input id="lot-input" placeholder="LOT 번호 입력 또는 아래에서 선택" autocomplete="off"/></div>
      <select class="select" id="lot-select" style="width:auto;min-width:200px"><option value="">최근 LOT 선택</option></select>
      <button class="btn btn--primary" id="trace-btn">${icon('route', 16)} 추적</button>
    </div><div id="trace-result" class="card__body"></div></div>`;

  const [events, tags] = await Promise.all([db.all('rfid_events', {}), db.all('rfid_tags', {})]);
  const lots = [...new Set(events.map(e => e.lot_no).filter(Boolean))].sort();
  const sel = root.querySelector('#lot-select');
  sel.innerHTML += lots.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('');
  const input = root.querySelector('#lot-input');
  const result = root.querySelector('#trace-result');

  function render(lot) {
    if (!lot) { result.innerHTML = `<div class="empty" style="padding:50px">${icon('route', 48)}<h4>LOT를 입력/선택하세요</h4><p>해당 LOT의 RFID 이동 경로를 시간순으로 표시합니다.</p></div>`; return; }
    const evs = events.filter(e => e.lot_no === lot).sort((a, b) => String(a.event_time).localeCompare(String(b.event_time)));
    if (!evs.length) { result.innerHTML = `<div class="empty" style="padding:50px">${icon('inbox', 48)}<h4>이동 이력이 없습니다</h4><p>LOT "${escapeHtml(lot)}"에 대한 RFID 인식 기록이 없습니다.</p></div>`; return; }
    const usedTags = [...new Set(evs.map(e => e.tag_uid))].map(u => tags.find(t => t.tag_uid === u)).filter(Boolean);
    const first = evs[0], last = evs[evs.length - 1];
    result.innerHTML = `
      <div class="trace-summary">
        ${kv('LOT', lot)} ${kv('인식 횟수', evs.length + '회')} ${kv('최초 인식', fmtDT(first.event_time))} ${kv('현재 위치', last.location || last.gate)}
        ${kv('연계 태그', usedTags.map(t => `${t.tag_uid}(${t.tag_type})`).join(', ') || '-')}
      </div>
      <div class="timeline">${evs.map((e, i) => `
        <div class="timeline__item ${i === evs.length - 1 ? 'is-last' : ''}">
          <div class="timeline__dot">${icon(eventIcon(e.event_type), 14)}</div>
          <div class="timeline__card">
            <div class="flex between"><b>${escapeHtml(e.gate)}</b><span class="muted mono">${fmtDT(e.event_time)}</span></div>
            <div class="flex" style="gap:8px;margin-top:5px;flex-wrap:wrap">${badge(e.event_type)} <span class="muted">${escapeHtml(e.tag_uid)} · ${escapeHtml(e.tag_type || '')}</span></div>
            ${e.reader || e.ref_code ? `<div class="muted" style="margin-top:5px">${e.reader ? '리더기 ' + escapeHtml(e.reader) : ''}${e.ref_code ? ' · ' + escapeHtml(e.ref_code) : ''}</div>` : ''}
          </div>
        </div>`).join('')}</div>`;
  }
  function kv(label, value) { return `<div class="trace-kv"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`; }
  function eventIcon(t) { return { '입고': 'download', '적치': 'archive', '공정이동': 'factory', '검사이동': 'shield', '포장이동': 'package', '출하이동': 'truck', '피킹': 'box', '출고': 'upload' }[t] || 'route'; }

  const go = () => render((input.value.trim() || sel.value).trim());
  root.querySelector('#trace-btn').onclick = go;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  sel.addEventListener('change', () => { input.value = ''; render(sel.value); });
  render('');
}
