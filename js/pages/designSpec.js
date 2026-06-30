// =====================================================================
// 화면설계서 — 전체 시스템 프로세스 + 화면별 명세
//  (프로세스 도식 / 데이터 연관성 / 드롭리스트 / 조회조건·컬럼)
// =====================================================================
import { escapeHtml } from '../lib/format.js';
import { icon } from '../ui/icons.js';

// ---------- 전체 시스템 프로세스 ----------
const SYSTEM_FLOWS = [
  { label: '영업 · 생산 메인 흐름', tone: 'brand', steps: ['수주관리', '생산계획관리', '작업지시관리', '작업 POP', '생산실적', '출하검사', '납품관리'] },
  { label: '자재 흐름', tone: 'green', steps: ['자재입고관리', '수입검사', '자재현황', '자재반출관리(POP 투입)'] },
  { label: '공구 흐름', tone: 'amber', steps: ['공구 입·출고관리', '공구 재고관리(LOT 수명)', 'POP 공구투입'] },
  { label: '품질 흐름', tone: 'violet', steps: ['검사기준관리', '수입/출하검사', '부적합관리', '검사·부적합 현황'] },
  { label: 'AI · RFID', tone: 'brand', steps: ['현장 데이터 수집', 'AI 예측·분석·챗봇 / RFID 이동이력', 'LOT 추적·의사결정 지원'] },
];

// ---------- 화면별 설계 명세 ----------
const SCREENS = [
  {
    id: 'item', title: '품목관리', group: '기준정보관리', path: '/base/items',
    purpose: '완제품·반제품·원자재·부자재 품목 마스터를 관리한다. 모든 거래·생산의 기준 데이터.',
    process: ['품목코드 입력', '유형·규격·단위·단가 입력', '주거래처 선택', '저장 → 타 화면 드롭리스트로 사용'],
    relations: [{ field: '주거래처', from: '거래처관리', desc: '거래처 드롭다운에서 선택' }],
    dropdowns: [
      { field: '품목유형', source: '고정값', values: '완제품 / 반제품 / 원자재 / 부자재' },
      { field: '단위', source: '고정값', values: 'EA / SET / BOX / KG / M / L' },
      { field: '주거래처', source: 'partners(거래처관리)', values: '등록된 거래처' },
    ],
    search: ['검색: 품목코드·품명·규격', '필터: 품목유형', '상태칩: 유형별'],
    columns: ['품목코드', '품명', '유형', '규격', '단위', '안전재고', '단가', '사용여부'],
  },
  {
    id: 'routing', title: '제품별표준공정관리', group: '기준정보관리', path: '/base/item-processes',
    purpose: '완제품·반제품별 표준공정 순서(라우팅)를 정의한다. POP의 공정 전개 기준.',
    process: ['좌측 품목 선택', '표준공정 추가(순서·표준시간)', '저장', 'POP에서 작업지시 선택 시 이 순서로 전개'],
    relations: [
      { field: '품목', from: '품목관리', desc: '완제품·반제품만 표시' },
      { field: '공정', from: '표준공정관리', desc: '등록된 공정에서 선택' },
    ],
    dropdowns: [{ field: '표준공정', source: 'processes(표준공정관리)', values: '등록된 공정 전체' }],
    search: ['좌측 검색: 품목코드·품명'],
    columns: ['순서(seq)', '공정', '표준시간(분)', '비고'],
  },
  {
    id: 'sales-order', title: '수주관리', group: '영업관리', path: '/sales/orders',
    purpose: '고객 수주를 등록한다. 생산 파이프라인(수주→계획→지시→POP)의 출발점.',
    process: ['거래처·품목 선택', '수량·단가·납기 입력(금액 자동)', '수주 등록(상태: 접수)', '생산계획관리로 전개'],
    relations: [
      { field: '거래처', from: '거래처관리', desc: '드롭다운 선택' },
      { field: '품명·규격·단위·단가', from: '품목관리', desc: '품목 선택 시 자동 채움' },
      { field: '금액', from: '계산값', desc: '수주수량 × 단가 자동' },
    ],
    dropdowns: [
      { field: '거래처', source: 'partners(거래처관리)', values: '등록 거래처' },
      { field: '품목', source: 'items(품목관리)', values: '등록 품목' },
      { field: '상태', source: '고정값', values: '접수 / 생산중 / 완료 / 취소' },
    ],
    search: ['수주일 기간 조회', '필터: 상태', '검색: 수주번호·거래처·품목'],
    columns: ['수주번호', '수주일', '거래처', '품목코드', '품명', '수주수량', '단가', '금액', '납기일', '상태'],
  },
  {
    id: 'sales-forecast', title: 'AI 수주예측', group: '영업관리', path: '/sales/forecast',
    purpose: '수주 이력의 거래처×품목 주문주기를 분석해 향후 수주를 예측하고 캘린더로 표시.',
    process: ['수주이력 분석(주기·일관성)', '거래처×품목별 예상수주일·확률 산출', '캘린더/표 표시', '영업 계획에 참고'],
    relations: [{ field: '예측 입력', from: '수주관리(sales_orders)', desc: '과거 수주 데이터 전체를 분석' }],
    dropdowns: [],
    search: ['캘린더 월 이동(이전/다음/오늘)'],
    columns: ['거래처', '품목', '예상수량', '최근수주', '예상수주일', 'D-day', '확률', '분석근거'],
  },
  {
    id: 'delivery', title: '납품관리', group: '영업관리', path: '/sales/deliveries',
    purpose: '생산이 완료된 수주를 납품 처리한다. 행 선택 → 버튼으로 납품완료.',
    process: ['생산완료 수주 자동 표시(납품대기)', '행 선택', '선택 납품완료 버튼', '완료일 기록 → 납품완료'],
    relations: [
      { field: '대상 리스트', from: '수주/생산계획/작업지시', desc: '작업지시 전부 완료(또는 수주 완료)된 건만' },
      { field: '납기예정일', from: '수주관리', desc: '수주의 납기일' },
    ],
    dropdowns: [{ field: '기준 날짜', source: '고정값', values: '납기예정일 / 납품완료일' }],
    search: ['기준 날짜(납기/완료) 기간 조회', '상태칩: 납품대기 / 납품완료', '검색: 수주번호·거래처·품명'],
    columns: ['수주번호', '거래처', '품명', '수량', '납기예정일', '납품완료일', '납기상태(지연)', '상태'],
  },
  {
    id: 'plan', title: '생산계획관리', group: '생산관리', path: '/production/plans',
    purpose: '수주를 생산계획으로 전개하고 일정·라인을 배정한다.',
    process: ['수주 선택', '계획수량·일정·라인 입력', '계획 등록', '작업지시관리로 전개'],
    relations: [
      { field: '수주번호·품목·수량', from: '수주관리', desc: '수주 선택 시 자동 채움' },
    ],
    dropdowns: [
      { field: '수주', source: 'sales_orders(수주관리)', values: '등록 수주' },
      { field: '상태', source: '고정값', values: '계획 / 진행 / 완료 / 보류' },
    ],
    search: ['계획일 기간 조회', '필터·상태칩: 상태', '검색: 계획번호·수주·품목'],
    columns: ['계획번호', '계획일', '수주번호', '품목코드', '품명', '계획수량', '시작일', '종료일', '라인', '상태'],
  },
  {
    id: 'wo', title: '작업지시관리', group: '생산관리', path: '/production/work-orders',
    purpose: '생산계획을 작업지시로 전개한다. [작업시작] 시 POP에 노출.',
    process: ['생산계획 선택', '지시수량·완료예정일 입력', '작업지시 등록(대기)', '[작업시작] → POP 표시'],
    relations: [{ field: '계획번호·품목·수량', from: '생산계획관리', desc: '계획 선택 시 자동' }],
    dropdowns: [
      { field: '생산계획', source: 'production_plans(생산계획관리)', values: '등록 계획' },
      { field: '상태', source: '고정값', values: '대기 / 작업중 / 완료 / 중단' },
    ],
    search: ['지시일 기간 조회', '상태칩: 상태', '검색: 작업지시·품목·공정'],
    columns: ['작업지시번호', '지시일', '계획번호', '품명', '지시수량', '공정', '설비', '완료예정일', '상태'],
  },
  {
    id: 'pop', title: '작업 POP', group: '작업 POP', path: '/pop',
    purpose: '현장 단말. 작업지시별 공정을 시작/종료하고 실적·자재·공구 투입을 기록.',
    process: ['작업지시 카드 선택', '공정 시작(작업자·설비호기 선택)', '자재/공구 투입(선택)', '공정 종료(양품·불량) → 실적 자동등록'],
    relations: [
      { field: '공정 전개', from: '제품별표준공정관리', desc: '품목 라우팅 순서대로 공정 생성' },
      { field: '설비호기 후보', from: '표준공정관리(공정별 설비)', desc: '해당 공정 지정 설비만' },
      { field: '투입 자재', from: 'BOM관리', desc: '품목 BOM 구성품' },
      { field: '투입 공구 LOT', from: '공구 재고관리', desc: '공정 지정 공구의 단위 LOT' },
    ],
    dropdowns: [
      { field: '작업자', source: 'users(사용자관리)', values: '등록 사용자' },
      { field: '설비호기', source: 'process_equipments', values: '공정에 지정된 설비' },
      { field: '투입 공구 LOT', source: '입고 단위 LOT', values: '잔여수명 있는 LOT' },
    ],
    search: ['상단: 작업자 선택', '상태 필터(대기/작업중/완료)'],
    columns: ['(카드) 작업지시', '품명', '공정 진행상태', '시작/종료 시각', '양품/불량'],
  },
  {
    id: 'result', title: '생산실적', group: '생산관리', path: '/production/results',
    purpose: 'POP 공정 종료 시 자동 등록되는 생산 실적(양품·불량·작업시간).',
    process: ['POP 공정 종료 → 자동 생성', '실적 조회·집계', 'AI 분석·현황에 반영'],
    relations: [{ field: '실적 원천', from: '작업 POP', desc: '공정 종료 시 자동 기록' }],
    dropdowns: [],
    search: ['실적일 기간 조회', '검색: 실적번호·작업지시·품목·작업자'],
    columns: ['실적번호', '실적일', '작업지시', '품명', '공정', '설비', '작업자', '양품', '불량', '작업시간'],
  },
  {
    id: 'mat-in', title: '자재입고관리', group: '자재관리', path: '/material/inbounds',
    purpose: '구매·외주 자재 입고를 등록(입고대기)하고 선택→버튼으로 입고완료(실 입고수량).',
    process: ['거래처·품목·수량 입력(입고대기)', '행 선택', '입고완료 버튼 → 실 입고수량 확인/수정', '입고완료 → 재고 반영'],
    relations: [
      { field: '거래처', from: '거래처관리', desc: '드롭다운' },
      { field: '품명·규격·단가', from: '품목관리', desc: '품목 선택 시 자동' },
    ],
    dropdowns: [
      { field: '거래처', source: 'partners', values: '등록 거래처' },
      { field: '품목', source: 'items', values: '원자재·부자재 등' },
      { field: '창고', source: '고정값', values: '자재창고1 / 자재창고2 / 외주창고' },
      { field: '상태', source: '고정값', values: '입고대기 / 입고완료' },
    ],
    search: ['입고일 기간 조회', '필터: 상태·창고', '검색: 입고번호·거래처·품목·LOT'],
    columns: ['입고번호', '입고일', '거래처', '품명', '규격', '입고수량', '실 입고수량', '단가', '금액', '창고', 'LOT', '상태'],
  },
  {
    id: 'mat-stock', title: '자재현황', group: '자재관리', path: '/material/stocks',
    purpose: '좌(품목)/우(입고번호별 재고) 레이아웃. 입고번호 단위 반품 처리.',
    process: ['좌측 품목 선택', '우측 입고번호별 재고 확인', '반품할 1건 선택', '반품 버튼 → 반품수량 입력 → 반출(반품) 생성'],
    relations: [
      { field: '재고 계산', from: '자재입고(입고완료)−자재반출', desc: '실 입고수량 − 반출/반품' },
      { field: '반품 결과', from: '자재반출관리(반품 탭)', desc: '반품 시 outbound(purpose 반품) 생성' },
    ],
    dropdowns: [],
    search: ['좌측 검색: 품목코드·품명'],
    columns: ['(좌) 품목·현재고', '(우) 입고번호', '입고일', 'LOT', '실입고', '반품', '반품가능', '창고'],
  },
  {
    id: 'mat-out', title: '자재반출관리', group: '자재관리', path: '/material/outbounds',
    purpose: '생산투입·외주·반품 등 자재 출고를 관리. 자재현황의 반품도 여기 반품 탭에 표시.',
    process: ['품목·수량·용도 선택', '반출 등록', '(반품은 자재현황에서 자동 생성)'],
    relations: [
      { field: '품명·단위', from: '품목관리', desc: '품목 선택 시 자동' },
      { field: '작업지시', from: '작업지시관리', desc: '생산투입 시 연결' },
      { field: '원입고(반품)', from: '자재입고관리', desc: '반품 건의 원 입고번호' },
    ],
    dropdowns: [
      { field: '품목', source: 'items', values: '등록 품목' },
      { field: '작업지시', source: 'work_orders', values: '등록 작업지시' },
      { field: '용도', source: '고정값', values: '생산투입 / 외주 / 반품' },
      { field: '담당자', source: 'users', values: '등록 사용자' },
    ],
    search: ['반출일 기간 조회', '상태칩(용도): 생산투입 / 외주 / 반품', '검색: 반출번호·품목·작업지시'],
    columns: ['반출번호', '반출일', '품명', '반출수량', '단위', '작업지시', '원입고(반품)', '창고', '용도', '담당자'],
  },
  {
    id: 'tool-stock', title: '공구 재고관리', group: '공구관리', path: '/tool/stocks',
    purpose: '입고 1개마다 LOT 부여(입고번호-01,02…). 단위 LOT별 수명(횟수)·남은수명 관리.',
    process: ['좌측 공구 선택', '우측 단위 LOT별 수명/잔여 확인', 'POP 공구투입 시 LOT별 차감'],
    relations: [
      { field: '단위 LOT', from: '공구 입·출고(입고)', desc: '입고수량을 1개씩 분해해 LOT 부여' },
      { field: '사용횟수 차감', from: '작업 POP(공구투입)', desc: 'LOT별 사용횟수 기록' },
    ],
    dropdowns: [],
    search: ['좌측 검색: 공구코드·공구명'],
    columns: ['(좌) 공구·남은수명', '(우) LOT 번호', '입고일', '입고건', '수명(횟수)', '사용', '남은수명', '상태'],
  },
  {
    id: 'insp-std', title: '검사기준관리', group: '품질관리', path: '/quality/standards',
    purpose: '상단 큰 탭(수입검사/출하검사) + 좌(품목)/우(검사기준). 정량(숫자)·정성(OK/NG).',
    process: ['상단 탭(수입/출하) 선택', '좌측 품목 선택', '검사기준 등록(평가방법·규격/판정)', '검사 화면에서 자동 로드'],
    relations: [
      { field: '품목', from: '품목관리', desc: '좌측 품목 목록' },
      { field: '측정장비', from: '공구관리(측정구)', desc: '드롭다운 선택' },
    ],
    dropdowns: [
      { field: '평가방법', source: '고정값', values: '정량적(숫자 측정) / 정성적(OK·NG)' },
      { field: '측정장비', source: 'tools(공구관리)', values: '등록 공구/측정구' },
    ],
    search: ['상단 탭: 수입검사 / 출하검사', '좌측 검색: 품목코드·품명'],
    columns: ['기준번호', '검사항목', '평가방법', '기준/판정', '검사방법', '측정장비', '사용'],
  },
  {
    id: 'insp-in', title: '수입검사', group: '품질관리', path: '/quality/incoming',
    purpose: '입고 자재를 검사기준에 따라 검사. 항목별 측정/판정 → 종합판정 자동.',
    process: ['신규 검사', '품목 선택(검사기준 자동 로드)', '항목별 측정값/판정 입력', '종합판정 저장'],
    relations: [
      { field: '검사기준 항목', from: '검사기준관리(수입검사)', desc: '품목 선택 시 자동 로드' },
      { field: '입고정보', from: '자재입고관리', desc: '입고 선택 시 거래처·LOT 자동' },
    ],
    dropdowns: [
      { field: '품목', source: 'items', values: '등록 품목' },
      { field: '입고 선택', source: 'material_inbounds', values: '입고 건' },
      { field: '검사자', source: 'users', values: '등록 사용자' },
    ],
    search: ['검사일 기간 조회', '판정칩: 합격/불합격/조건부합격', '검색: 검사번호·품목·거래처'],
    columns: ['검사번호', '검사일', 'LOT', '거래처', '품명', '검사', '양품', '불량', '검사자', '판정'],
  },
  {
    id: 'insp-out', title: '출하검사', group: '품질관리', path: '/quality/shipping',
    purpose: '생산완료 수주 리스트 + 행별 [출하검사] 버튼. 검사기준 기반 평가. 납품상태 표시.',
    process: ['생산완료 수주 표시(미검사)', '[출하검사] 버튼', '검사기준 항목 평가', '합격/불합격 저장'],
    relations: [
      { field: '대상 리스트', from: '수주/작업지시', desc: '생산완료된 수주만' },
      { field: '검사기준', from: '검사기준관리(출하검사)', desc: '품목 기준 자동 로드' },
      { field: '납품상태', from: '납품관리', desc: '납품완료 여부 표시' },
    ],
    dropdowns: [{ field: '검사자', source: 'users', values: '등록 사용자' }],
    search: ['검사일 기간 조회', '상태칩: 전체/미검사/검사완료', '검색: 수주번호·거래처·품명'],
    columns: ['수주번호', '거래처', '품명', '수량', '검사상태', '납품상태', '검사일', '검사(버튼)'],
  },
  {
    id: 'ncr', title: '부적합관리', group: '품질관리', path: '/quality/nonconformance',
    purpose: '공정·검사 중 발생한 부적합(불량)을 등록하고 조치(폐기/재작업/특채/반품).',
    process: ['부적합 발생 등록', '원인·조치유형 입력', '처리중 → 완료', '부적합현황/ AI 불량분석에 반영'],
    relations: [{ field: '품명', from: '품목관리', desc: '품목 선택' }],
    dropdowns: [
      { field: '조치유형', source: '고정값', values: '폐기 / 재작업 / 특채 / 반품' },
      { field: '상태', source: '고정값', values: '처리중 / 완료' },
    ],
    search: ['발생일 기간 조회', '필터: 조치·상태', '검색: 부적합번호·공정·품목'],
    columns: ['부적합번호', '발생일', '공정', '품명', '불량유형', '불량수량', '원인', '조치유형', '작업자', '상태'],
  },
  {
    id: 'status', title: '현황(그래프) 화면', group: '영업/품질', path: '/sales/order-status',
    purpose: '수주/납품/수입검사/출하검사 현황을 기간·조건별 그래프(추이 막대 + 분류 도넛)로 분석.',
    process: ['기간 설정', '조건(거래처·상태·판정) 필터', '추이/분류 그래프 확인', '그래프 클릭 → 해당 목록'],
    relations: [{ field: '데이터 원천', from: '각 업무 데이터', desc: '수주/납품/검사 테이블 집계' }],
    dropdowns: [{ field: '조건 필터', source: '데이터 자동 추출', values: '상태·거래처·판정 등' }],
    search: ['기간(시작~종료) 조회', '조건별 드롭다운 필터'],
    columns: ['(통계 4종)', '일자별 추이(막대)', '분류별(도넛 3종)'],
  },
];

const SCREEN_BY_TITLE = {}; SCREENS.forEach(s => { SCREEN_BY_TITLE[s.title] = s.id; });

// ---------- 렌더 헬퍼 ----------
function flowRow(steps, tone) {
  return `<div class="spec-flow">${steps.map((s, i) => {
    const id = SCREEN_BY_TITLE[s];
    const box = `<span class="spec-flow__step spec-flow__step--${tone} ${id ? 'is-link' : ''}" ${id ? `data-goto="${id}"` : ''}>${escapeHtml(s)}</span>`;
    return box + (i < steps.length - 1 ? `<span class="spec-flow__arrow">${icon('chevronRight', 16)}</span>` : '');
  }).join('')}</div>`;
}
function specTable(headers, rows) {
  if (!rows.length) return `<div class="muted" style="padding:8px 2px">해당 없음</div>`;
  return `<div class="table-wrap"><table class="grid"><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

// ---------- 화면설계서 홈 (전체 프로세스 + 화면 목록) ----------
export async function designSpecHome(root) {
  const groups = {};
  for (const s of SCREENS) (groups[s.group] ??= []).push(s);
  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text"><h1>화면설계서</h1><p>전체 시스템 프로세스와 화면별 설계 명세(데이터 연관성·프로세스·드롭리스트·조회조건·컬럼)를 제공합니다.</p></div>
      <div class="page-head__actions"><a class="btn btn--primary" href="#/dashboard">${icon('logout', 16)} 시스템으로</a></div>
    </div>
    <div class="card" style="margin-bottom:18px"><div class="card__head">${icon('route', 18)}<h3>전체 시스템 프로세스</h3></div>
      <div class="card__body flex-col" style="gap:16px">
        ${SYSTEM_FLOWS.map(f => `<div><div class="spec-flow-label">${escapeHtml(f.label)}</div>${flowRow(f.steps, f.tone)}</div>`).join('')}
        <div class="muted" style="font-size:12px">※ 박스를 클릭하면 해당 화면 설계서로 이동합니다.</div>
      </div></div>
    ${Object.entries(groups).map(([g, list]) => `
      <div class="card" style="margin-bottom:16px"><div class="card__head">${icon('database', 18)}<h3>${escapeHtml(g)}</h3></div>
        <div class="card__body"><div class="spec-grid">
          ${list.map(s => `<button class="spec-card" data-goto="${s.id}">
            <div class="spec-card__title">${escapeHtml(s.title)}</div>
            <div class="spec-card__desc">${escapeHtml(s.purpose)}</div>
            <div class="spec-card__more">${icon('fileText', 13)} 설계서 보기</div></button>`).join('')}
        </div></div></div>`).join('')}`;

  root.querySelectorAll('[data-goto]').forEach(el => el.onclick = () => { location.hash = `#/spec/view?id=${el.dataset.goto}`; });
}

// ---------- 화면별 설계서 ----------
export async function designSpecDetail(root, params) {
  const s = SCREENS.find(x => x.id === params.id) || SCREENS[0];
  const idx = SCREENS.findIndex(x => x.id === s.id);
  const prev = SCREENS[idx - 1], next = SCREENS[idx + 1];

  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text">
        <div class="muted" style="font-size:12.5px;margin-bottom:2px">${escapeHtml(s.group)}</div>
        <h1>${escapeHtml(s.title)} <span class="muted" style="font-size:14px;font-weight:600">설계서</span></h1>
        <p>${escapeHtml(s.purpose)}</p>
      </div>
      <div class="page-head__actions">
        <a class="btn" href="#/spec">${icon('grid', 16)} 목록</a>
        <a class="btn btn--primary" href="#${s.path}">${icon('monitor', 16)} 실제 화면 열기</a>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px"><div class="card__head">${icon('activity', 18)}<h3>화면 프로세스</h3></div>
      <div class="card__body">${flowRow(s.process, 'brand')}</div></div>

    <div class="grid-2">
      <div class="card"><div class="card__head">${icon('layers', 18)}<h3>데이터 연관성 (타 화면 연동)</h3></div>
        <div class="card__body">${specTable(['항목', '가져오는 곳', '설명'], s.relations.map(r => [`<b>${escapeHtml(r.field)}</b>`, `<span class="badge badge--info">${escapeHtml(r.from)}</span>`, escapeHtml(r.desc)]))}</div></div>
      <div class="card"><div class="card__head">${icon('sliders', 18)}<h3>드롭리스트 구성</h3></div>
        <div class="card__body">${specTable(['항목', '데이터 출처', '값/구성'], s.dropdowns.map(d => [`<b>${escapeHtml(d.field)}</b>`, `<span class="cell-code">${escapeHtml(d.source)}</span>`, escapeHtml(d.values)]))}</div></div>
    </div>

    <div class="grid-2">
      <div class="card"><div class="card__head">${icon('search', 18)}<h3>조회조건</h3></div>
        <div class="card__body"><ul class="spec-list">${s.search.map(x => `<li>${icon('chevronRight', 13)} ${escapeHtml(x)}</li>`).join('')}</ul></div></div>
      <div class="card"><div class="card__head">${icon('grid', 18)}<h3>컬럼 구성</h3></div>
        <div class="card__body"><div class="spec-cols">${s.columns.map(c => `<span class="spec-col">${escapeHtml(c)}</span>`).join('')}</div></div></div>
    </div>

    <div class="flex between" style="margin-top:6px">
      ${prev ? `<button class="btn" data-goto="${prev.id}">${icon('chevronLeft', 16)} ${escapeHtml(prev.title)}</button>` : '<span></span>'}
      ${next ? `<button class="btn" data-goto="${next.id}">${escapeHtml(next.title)} ${icon('chevronRight', 16)}</button>` : '<span></span>'}
    </div>`;

  root.querySelectorAll('[data-goto]').forEach(el => el.onclick = () => { location.hash = `#/spec/view?id=${el.dataset.goto}`; });
}
