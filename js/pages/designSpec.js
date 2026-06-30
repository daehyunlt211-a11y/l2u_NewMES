// =====================================================================
// 화면설계서 — 전체 프로세스 + 화면별 명세
//  · 화면 미리보기(번호 주석) + 기능설명
//  · 데이터 연관성 / 드롭리스트 / 조회조건(+기본조건) / 컬럼 / 예외처리(Alert)
// =====================================================================
import { escapeHtml } from '../lib/format.js';
import { icon } from '../ui/icons.js';

// ---------- 전체 시스템 프로세스 ----------
const SYSTEM_FLOWS = [
  { label: '영업 · 생산 메인 흐름', tone: 'brand', steps: ['수주관리', '생산계획관리', '작업지시관리', '작업 POP', '생산실적', '출하검사', '납품관리'] },
  { label: '자재 흐름', tone: 'green', steps: ['자재입고관리', '수입검사', '자재현황', '자재반출관리'] },
  { label: '공구 흐름', tone: 'amber', steps: ['공구 입·출고관리', '재고관리', '작업 POP'] },
  { label: '품질 흐름', tone: 'violet', steps: ['검사기준관리', '수입검사', '출하검사', '부적합관리'] },
  { label: 'AI · RFID', tone: 'brand', steps: ['대시보드', 'AI 수주예측', 'RFID 태그관리', 'LOT 추적'] },
];

// ---------- 화면 유형별 템플릿 (미리보기·기능·예외·기본조건 공통) ----------
const TYPE = {
  list: {
    feats: [
      ['등록/내보내기', '우상단 [신규등록]으로 입력 폼(모달) 오픈, 엑셀(CSV)·새로고침 제공'],
      ['검색', '검색창 입력 시 지정 필드(코드·명칭 등)에서 실시간 검색'],
      ['필터', '드롭다운 조건으로 목록 필터 (해당 화면)'],
      ['기간 조회', '기준 날짜 기간(프리셋/직접)으로 조회 (해당 화면)'],
      ['상태칩', '상태·구분별 빠른 필터 + 건수 표시 (해당 화면)'],
      ['정렬', '정렬 가능 컬럼 헤더 클릭 시 오름/내림 전환'],
      ['행 관리', '행별 수정/삭제, 행 선택(체크/클릭) 시 일괄 처리'],
      ['페이징', '총 건수·페이지 이동·표시 개수(10/20/50/100)'],
    ],
    alerts: [
      '필수 항목 미입력 → "필수 항목을 확인하세요" 오류 토스트(해당 필드 빨강)',
      '삭제 시 → "삭제된 데이터는 복구할 수 없습니다" 확인 대화 후 진행',
      '저장/삭제 실패 → 사유 오류 토스트',
      '데이터 로드 실패 → "데이터를 불러오지 못했습니다" 빈 상태 표시',
    ],
    defs: ['기간 기본: 전체', '상태/구분 칩 기본: 전체', '표시 개수 기본: 10건'],
    wf: () => `
      <div class="wf-bar wf-bar--head">${b(1)}<b>화면 제목</b><span class="wf-r">신규등록 · CSV · 새로고침</span></div>
      <div class="wf-bar">${b(2)}<span class="wf-pill">🔍 검색</span>${b(3)}<span class="wf-pill">필터 ▾</span>${b(4)}<span class="wf-pill">📅 기간</span></div>
      <div class="wf-bar wf-bar--soft">${b(5)}<span class="wf-chip">전체</span><span class="wf-chip">상태…</span></div>
      <div class="wf-grid"><div class="wf-gh">${b(6)} 컬럼(정렬) ▲</div><div class="wf-gr">데이터 행<span class="wf-r">${b(7)} 수정/삭제</span></div><div class="wf-gr">데이터 행</div></div>
      <div class="wf-bar wf-bar--foot">${b(8)} 총 N건 · ◀ 1 2 3 ▶ · 표시 10 ▾</div>`,
  },
  masterDetail: {
    feats: [
      ['좌측 검색', '좌측 목록 검색(코드·명칭)'],
      ['항목 목록', '좌측 항목 클릭 시 우측 상세 로드 (건수 배지)'],
      ['액션 버튼', '우상단 동작 버튼(등록/반품/저장 등)'],
      ['상세 영역', '선택 항목의 상세 목록/입력 표시'],
    ],
    alerts: ['항목 미선택 상태에서 동작 시 "선택하세요" 안내', '저장/처리 실패 토스트', '필요 컬럼 미생성 시 마이그레이션 안내'],
    defs: ['초기: 미선택(좌측에서 선택)', '좌측 정렬 기본: 코드 오름차순'],
    wf: () => `
      <div class="wf-md">
        <div class="wf-side"><div class="wf-bar">${b(1)} 🔍 검색</div><div class="wf-li">${b(2)} 항목 ▸ <span class="wf-chip">배지</span></div><div class="wf-li">항목</div><div class="wf-li">항목</div></div>
        <div class="wf-main"><div class="wf-bar wf-bar--head"><b>선택 항목</b><span class="wf-r">${b(3)} 액션</span></div><div class="wf-grid"><div class="wf-gh">${b(4)} 상세 목록/입력</div><div class="wf-gr">행</div><div class="wf-gr">행</div></div></div>
      </div>`,
  },
  chart: {
    feats: [
      ['기간 조회', '시작~종료일(기본 최근 90일)로 조회'],
      ['조건 필터', '거래처·상태·판정 등 조건 드롭다운(데이터 기반 자동)'],
      ['통계 카드', '핵심 지표 4종 요약(기간·조건 반영)'],
      ['일자별 추이', '기간 내 일자별 막대 그래프(호버 요약)'],
      ['분류별 도넛', '거래처/품목/상태 등 분류 비중'],
      ['드릴다운', '그래프 클릭 시 해당 건 목록 팝업'],
    ],
    alerts: ['해당 기간 데이터 없음 → "데이터가 없습니다" 안내', '불러오기 실패 토스트'],
    defs: ['기간 기본: 최근 90일', '조건 필터 기본: 전체', '추이 단위: 일자별'],
    wf: () => `
      <div class="wf-bar wf-bar--head">${b(1)}<b>현황 제목</b><span class="wf-r">📅 시작 ~ 종료 · 조회</span></div>
      <div class="wf-bar">${b(2)}<span class="wf-pill">조건 ▾</span><span class="wf-pill">조건 ▾</span></div>
      <div class="wf-stats">${b(3)}<span class="wf-st"></span><span class="wf-st"></span><span class="wf-st"></span><span class="wf-st"></span></div>
      <div class="wf-chart">${b(4)} 일자별 추이 ▆▃▅▂▇</div>
      <div class="wf-bar wf-bar--soft">${b(5)} ◐ 도넛 · ◑ 도넛 · ◓ 도넛 <span class="wf-r">${b(6)} 클릭→목록</span></div>`,
  },
  analysis: {
    feats: [
      ['분석 정보', '분석 기준 시각 표시(실시간 전체 데이터)'],
      ['AI 보조 안내', '결과는 의사결정 보조 — 담당자 승인 안내 배너'],
      ['요약 통계', '위험/예측 요약 카드'],
      ['분석 결과', '위험도·확률·근거·추천 조치 리스트'],
    ],
    alerts: ['분석 대상 데이터 부족 시 결과 없음 표시', 'AI 결과는 추정치 — 최종 조치는 담당자 승인'],
    defs: ['실시간 전체 데이터 분석', '위험도/확률 내림차순 정렬'],
    wf: () => `
      <div class="wf-bar wf-bar--head">${b(1)}<b>AI 분석</b><span class="wf-r">분석 시각</span></div>
      <div class="wf-bar wf-bar--soft">${b(2)} ⚠ AI 보조 — 담당자 승인 필요</div>
      <div class="wf-stats">${b(3)}<span class="wf-st"></span><span class="wf-st"></span><span class="wf-st"></span><span class="wf-st"></span></div>
      <div class="wf-grid"><div class="wf-gh">${b(4)} 분석 결과 · 추천</div><div class="wf-gr">위험도 · 근거 · 조치</div><div class="wf-gr">행</div></div>`,
  },
  pop: {
    feats: [
      ['작업자/상태', '상단에서 작업자 선택, 상태(대기/작업중/완료) 필터'],
      ['작업지시 카드', '카드 선택 시 라우팅(공정) 자동 전개'],
      ['공정 시작/종료', '시작 시 작업자·설비호기 선택, 종료 시 양품·불량 입력'],
      ['자재·공구 투입', '진행 공정에 BOM 자재·지정 공구(LOT) 투입 기록'],
    ],
    alerts: ['작업자 미선택 시 시작 안내', '공정 미지정 공구/자재 없음 안내', '종료 수량 미입력 검증', '잔여수명 0 LOT 선택 불가'],
    defs: ['상태 기본: 전체(작업중 우선 노출)', '작업자 먼저 선택'],
    wf: () => `
      <div class="wf-bar wf-bar--head">${b(1)}<b>작업 POP</b><span class="wf-r">작업자 ▾ · 상태</span></div>
      <div class="wf-cards">${b(2)}<span class="wf-card"></span><span class="wf-card"></span><span class="wf-card"></span></div>
      <div class="wf-bar">${b(3)} ▶ 시작 / ■ 종료</div>
      <div class="wf-bar wf-bar--soft">${b(4)} 자재투입 · 공구투입</div>`,
  },
  dashboard: {
    feats: [
      ['KPI 카드', '금일 생산·진행 작업지시·수주금액·품질 합격률'],
      ['수주/작업 현황', '최근 수주, 작업지시 상태 분포'],
      ['품질/재고/설비', '품질 요약·재고 부족·설비 가동 현황'],
      ['AI·RFID', 'AI 인사이트(지연/발주)·RFID 최근 이동'],
    ],
    alerts: ['항목별 데이터 없을 때 빈 상태 표시'],
    defs: ['기준일: 오늘', '자동 집계(저장 시 갱신)'],
    wf: () => `
      <div class="wf-stats">${b(1)}<span class="wf-st"></span><span class="wf-st"></span><span class="wf-st"></span><span class="wf-st"></span></div>
      <div class="wf-bar wf-bar--soft">${b(2)} 최근 수주 · 작업지시 진행</div>
      <div class="wf-bar wf-bar--soft">${b(3)} 품질 · 재고 · 설비</div>
      <div class="wf-bar wf-bar--soft">${b(4)} AI 인사이트 · RFID 최근 이동</div>`,
  },
  trace: {
    feats: [
      ['LOT 입력/선택', 'LOT 직접 입력 또는 최근 LOT 선택 후 추적'],
      ['요약', 'LOT·인식횟수·최초인식·현재위치·연계 태그'],
      ['이동 타임라인', '공정→검사→포장→출하 인식 이력 시간순'],
    ],
    alerts: ['이력 없는 LOT → "이동 이력이 없습니다" 안내'],
    defs: ['초기: 미선택(LOT 입력/선택 필요)'],
    wf: () => `
      <div class="wf-bar wf-bar--head">${b(1)}<b>LOT 추적</b><span class="wf-r">🔍 LOT 입력 · 선택 ▾ · 추적</span></div>
      <div class="wf-bar wf-bar--soft">${b(2)} LOT · 인식 N회 · 현재위치</div>
      <div class="wf-grid"><div class="wf-gh">${b(3)} 이동 타임라인</div><div class="wf-gr">● 공정입구</div><div class="wf-gr">● 검사장 → 출하장</div></div>`,
  },
};

// ---------- 화면별 명세 (전 화면) ----------
const S = (o) => o;
const SCREENS = [
  // ===== 대시보드 =====
  S({ id: 'dashboard', title: '대시보드', group: '대시보드', path: '/dashboard', type: 'dashboard',
    purpose: '생산·영업·품질·재고·설비 현황과 AI 인사이트를 한 화면에 요약.',
    relations: [{ field: '전 지표', from: '각 업무 데이터', desc: '수주·실적·검사·재고·설비 집계' }],
    dropdowns: [], search: ['조회조건 없음(자동 집계)'], sort: '최신순',
    columns: ['KPI 4종', '최근 수주', '작업지시 분포', '품질/재고/설비', 'AI·RFID'] }),

  // ===== 기준정보관리 =====
  S({ id: 'user', title: '사용자관리', group: '기준정보관리', path: '/base/users', type: 'list',
    purpose: '시스템 사용자 계정·비밀번호·권한을 관리.',
    relations: [{ field: '부서', from: '부서관리', desc: '부서 드롭다운 선택' }],
    dropdowns: [{ field: '부서', source: 'departments', values: '등록 부서' }, { field: '권한', source: '고정값', values: '관리자/매니저/일반' }],
    search: ['검색: 아이디·이름·부서', '필터: 권한·부서'], sort: '아이디 오름차순',
    columns: ['아이디', '이름', '부서', '직급', '권한', '비밀번호(설정여부)', '이메일', '연락처', '사용'],
    alerts: ['비밀번호 미입력 시 전송 안 함(수정 시 기존 유지)', '비밀번호 변경 컬럼 없으면 migration_user_password.sql 안내'] }),
  S({ id: 'dept', title: '부서관리', group: '기준정보관리', path: '/base/departments', type: 'list',
    purpose: '조직 부서 정보를 관리.', relations: [], dropdowns: [],
    search: ['검색: 부서코드·부서명·부서장'], sort: '부서코드 오름차순',
    columns: ['부서코드', '부서명', '부서장', '연락처', '사용', '비고'] }),
  S({ id: 'partner', title: '거래처관리', group: '기준정보관리', path: '/base/partners', type: 'list',
    purpose: '매출처·매입처·외주처 정보를 관리.', relations: [],
    dropdowns: [{ field: '거래구분', source: '고정값', values: '매출처/매입처/외주처' }],
    search: ['검색: 코드·명·사업자번호', '필터·칩: 거래구분'], sort: '거래처코드 오름차순',
    columns: ['거래처코드', '거래처명', '구분', '사업자번호', '대표자', '담당자', '연락처', '사용'] }),
  S({ id: 'item', title: '품목관리', group: '기준정보관리', path: '/base/items', type: 'list',
    purpose: '완제품·반제품·원자재·부자재 마스터. 모든 거래·생산의 기준 데이터.',
    relations: [{ field: '주거래처', from: '거래처관리', desc: '거래처 드롭다운' }],
    dropdowns: [{ field: '품목유형', source: '고정값', values: '완제품/반제품/원자재/부자재' }, { field: '단위', source: '고정값', values: 'EA/SET/BOX/KG/M/L' }, { field: '주거래처', source: 'partners', values: '등록 거래처' }],
    search: ['검색: 품목코드·품명·규격', '필터·칩: 품목유형'], sort: '품목코드 오름차순',
    columns: ['품목코드', '품명', '유형', '규격', '단위', '안전재고', '단가', '사용'] }),
  S({ id: 'process', title: '표준공정관리', group: '기준정보관리', path: '/base/processes', type: 'list',
    purpose: '표준공정과 공정별 사용설비를 관리. POP 설비호기 후보의 기준.',
    relations: [{ field: '사용설비', from: '설비관리', desc: '공정별 설비 지정' }],
    dropdowns: [{ field: '공정유형', source: '고정값', values: '가공/조립/검사/포장 등' }, { field: '사용설비', source: 'equipments', values: '등록 설비' }],
    search: ['검색: 공정코드·공정명'], sort: '공정코드 오름차순',
    columns: ['공정코드', '공정명', '유형', '작업장', '표준시간', '준비시간', '사용설비', '사용'] }),
  S({ id: 'routing', title: '제품별표준공정관리', group: '기준정보관리', path: '/base/item-processes', type: 'masterDetail',
    purpose: '완제품·반제품별 표준공정 순서(라우팅) 정의. POP 공정 전개 기준.',
    relations: [{ field: '품목', from: '품목관리', desc: '완제품·반제품만' }, { field: '공정', from: '표준공정관리', desc: '등록 공정 선택' }],
    dropdowns: [{ field: '표준공정', source: 'processes', values: '등록 공정 전체' }],
    search: ['좌측 검색: 품목코드·품명'], sort: '순서(seq) 오름차순',
    columns: ['순서', '공정', '표준시간(분)', '비고'],
    feats: [['공정 추가/순서', '표준공정 선택해 추가, 순서·표준시간 편집 후 저장']] }),
  S({ id: 'bom', title: 'BOM관리', group: '기준정보관리', path: '/base/bom', type: 'masterDetail',
    purpose: '제품 구성(자재 소요) 정의. 다단계(완제품→반제품→원자재). POP 자재투입 기준.',
    relations: [{ field: '모품목/구성품', from: '품목관리', desc: '품목에서 선택' }],
    dropdowns: [{ field: '구성품', source: 'items', values: '등록 품목' }],
    search: ['좌측 검색: 품목코드·품명'], sort: '구성 순서',
    columns: ['구성품코드', '구성품명', '소요량', '단위'] }),
  S({ id: 'tool-master', title: '공구관리(기준)', group: '기준정보관리', path: '/base/tools', type: 'list',
    purpose: '공구 마스터(절삭·측정·지그). 사용공정 지정 시 POP 공구투입 대상.',
    relations: [{ field: '사용공정', from: '표준공정관리', desc: '공정 드롭다운' }],
    dropdowns: [{ field: '공구유형', source: '고정값', values: '절삭/측정/지그/기타' }, { field: '사용공정', source: 'processes', values: '등록 공정' }],
    search: ['검색: 공구코드·공구명', '필터·칩: 공구유형'], sort: '공구코드 오름차순',
    columns: ['공구코드', '공구명', '유형', '규격', '사용공정', '수명(횟수)', '안전재고', '보관위치', '사용'] }),
  S({ id: 'equip', title: '설비관리', group: '기준정보관리', path: '/base/equipments', type: 'list',
    purpose: '생산 설비 정보와 가동상태를 관리.', relations: [],
    dropdowns: [{ field: '설비유형', source: '고정값', values: '가공기/조립기/검사기/기타' }, { field: '상태', source: '고정값', values: '정상/점검/고장/비가동' }],
    search: ['검색: 설비코드·설비명·모델', '필터·칩: 유형·상태'], sort: '설비코드 오름차순',
    columns: ['설비코드', '설비명', '유형', '모델', '제조사', '작업장', '설치일', '상태'] }),

  // ===== 작업 POP =====
  S({ id: 'pop', title: '작업 POP', group: '작업 POP', path: '/pop', type: 'pop',
    purpose: '현장 단말. 작업지시별 공정 시작/종료, 실적·자재·공구 투입 기록.',
    relations: [{ field: '공정 전개', from: '제품별표준공정관리', desc: '라우팅 순서대로' }, { field: '설비호기 후보', from: '표준공정관리', desc: '공정 지정 설비' }, { field: '투입 자재', from: 'BOM관리', desc: '구성품' }, { field: '투입 공구 LOT', from: '재고관리', desc: '공정 지정 공구 단위 LOT' }],
    dropdowns: [{ field: '작업자', source: 'users', values: '등록 사용자' }, { field: '설비호기', source: 'process_equipments', values: '공정 지정 설비' }, { field: '공구 LOT', source: '입고 단위 LOT', values: '잔여수명 있는 LOT' }],
    search: ['작업자 선택', '상태 필터(대기/작업중/완료)'], sort: '작업지시일 순',
    columns: ['(카드) 작업지시·품명', '공정 진행', '시작/종료 시각', '양품/불량'] }),

  // ===== 영업관리 =====
  S({ id: 'sales-forecast', title: 'AI 수주예측', group: '영업관리', path: '/sales/forecast', type: 'analysis',
    purpose: '거래처×품목 주문주기 분석으로 향후 수주 예측 + 월별 캘린더(예상/실제).',
    relations: [{ field: '예측 입력', from: '수주관리', desc: '과거 수주 이력 분석' }],
    dropdowns: [{ field: '캘린더 월', source: '이동 버튼', values: '이전/다음/오늘' }],
    search: ['캘린더 월 이동'], sort: '확률 내림차순',
    columns: ['거래처', '품목', '예상수량', '최근수주', '예상수주일', 'D-day', '확률', '근거'],
    feats: [['수주 캘린더', '날짜별 예상(파랑)·실제(초록) 수주 표시, 날짜 클릭 시 상세']] }),
  S({ id: 'sales-order', title: '수주관리', group: '영업관리', path: '/sales/orders', type: 'list',
    purpose: '고객 수주 등록. 생산 파이프라인 출발점.',
    relations: [{ field: '거래처', from: '거래처관리', desc: '드롭다운' }, { field: '품명·규격·단가', from: '품목관리', desc: '품목 선택 시 자동' }, { field: '금액', from: '계산값', desc: '수량×단가' }],
    dropdowns: [{ field: '거래처', source: 'partners', values: '등록 거래처' }, { field: '품목', source: 'items', values: '등록 품목' }, { field: '상태', source: '고정값', values: '접수/생산중/완료/취소' }],
    search: ['수주일 기간 조회', '필터·칩: 상태', '검색: 수주번호·거래처·품목'], sort: '수주일 내림차순',
    columns: ['수주번호', '수주일', '거래처', '품목코드', '품명', '수주수량', '단가', '금액', '납기일', '상태'] }),
  S({ id: 'sales-status', title: '수주현황', group: '영업관리', path: '/sales/order-status', type: 'chart',
    purpose: '수주를 기간·조건별 그래프(추이·도넛)로 분석. 지표=수주금액.',
    relations: [{ field: '데이터', from: '수주관리', desc: 'sales_orders 집계' }],
    dropdowns: [{ field: '상태', source: '데이터', values: '접수/생산중/완료/취소' }, { field: '거래처', source: '데이터', values: '수주 거래처' }],
    search: ['기간(수주일) 조회', '조건: 상태·거래처'], sort: '-',
    columns: ['통계(건수/수량/금액/진행중)', '일자별 추이', '거래처·품목·상태 도넛'] }),
  S({ id: 'delivery', title: '납품관리', group: '영업관리', path: '/sales/deliveries', type: 'list',
    purpose: '생산완료 수주를 납품 처리(행 선택→버튼). 수정/상태변경 불가.',
    relations: [{ field: '대상', from: '수주/작업지시', desc: '생산완료 건만' }, { field: '납기예정일', from: '수주관리', desc: '수주 납기' }],
    dropdowns: [{ field: '기준 날짜', source: '고정값', values: '납기예정일/납품완료일' }],
    search: ['기준 날짜 기간 조회', '칩: 납품대기/납품완료', '검색: 수주번호·거래처·품명'], sort: '대기 우선·납기순',
    columns: ['수주번호', '거래처', '품명', '수량', '납기예정일', '납품완료일', '납기상태(지연)', '상태'],
    feats: [['선택 납품완료', '행 선택 → [선택 납품완료] → 완료일 기록']],
    alerts: ['미선택 시 버튼 비활성', '완료 처리 확인 대화 후 진행'] }),
  S({ id: 'delivery-status', title: '납품현황', group: '영업관리', path: '/sales/delivery-status', type: 'chart',
    purpose: '생산완료 수주 기준 납품 현황(납품대기 포함) 그래프. 지표=납품금액.',
    relations: [{ field: '데이터', from: '수주/납품', desc: '생산완료 수주 + 납품완료 여부' }],
    dropdowns: [{ field: '상태', source: '데이터', values: '납품대기/납품완료' }, { field: '거래처', source: '데이터', values: '거래처' }],
    search: ['기간(납품완료일/납기) 조회', '조건: 상태·거래처'], sort: '-',
    columns: ['통계(대상/완료/대기/금액)', '추이', '상태·거래처·품목 도넛'] }),

  // ===== 생산관리 =====
  S({ id: 'plan', title: '생산계획관리', group: '생산관리', path: '/production/plans', type: 'list',
    purpose: '수주를 생산계획으로 전개, 일정·라인 배정.',
    relations: [{ field: '수주번호·품목·수량', from: '수주관리', desc: '수주 선택 시 자동' }],
    dropdowns: [{ field: '수주', source: 'sales_orders', values: '등록 수주' }, { field: '상태', source: '고정값', values: '계획/진행/완료/보류' }],
    search: ['계획일 기간 조회', '필터·칩: 상태', '검색: 계획번호·수주·품목'], sort: '계획일 내림차순',
    columns: ['계획번호', '계획일', '수주번호', '품명', '계획수량', '시작일', '종료일', '라인', '상태'] }),
  S({ id: 'wo', title: '작업지시관리', group: '생산관리', path: '/production/work-orders', type: 'list',
    purpose: '생산계획을 작업지시로 전개. [작업시작] 시 POP 노출.',
    relations: [{ field: '계획번호·품목·수량', from: '생산계획관리', desc: '계획 선택 시 자동' }],
    dropdowns: [{ field: '생산계획', source: 'production_plans', values: '등록 계획' }, { field: '상태', source: '고정값', values: '대기/작업중/완료/중단' }],
    search: ['지시일 기간 조회', '칩: 상태', '검색: 작업지시·품목·공정'], sort: '지시일 내림차순',
    columns: ['작업지시번호', '지시일', '계획번호', '품명', '지시수량', '공정', '설비', '완료예정일', '상태'],
    feats: [['작업시작', '[작업시작] 버튼 → 상태 작업중 → POP 표시']] }),
  S({ id: 'result', title: '생산실적', group: '생산관리', path: '/production/results', type: 'list',
    purpose: 'POP 공정 종료 시 자동 등록되는 실적(양품·불량·작업시간).',
    relations: [{ field: '실적 원천', from: '작업 POP', desc: '공정 종료 시 자동 기록' }],
    dropdowns: [], search: ['실적일 기간 조회', '검색: 실적번호·작업지시·품목·작업자'], sort: '실적일 내림차순',
    columns: ['실적번호', '실적일', '작업지시', '품명', '공정', '설비', '작업자', '양품', '불량', '작업시간'] }),
  S({ id: 'board', title: '생산현황판', group: '생산관리', path: '/production/board', type: 'dashboard',
    purpose: '작업지시 상태를 칸반(대기/작업중/완료/중단)으로 시각화.',
    relations: [{ field: '카드', from: '작업지시관리', desc: '작업지시 상태별 배치' }],
    dropdowns: [], search: ['상태 열별 자동 분류'], sort: '상태별',
    columns: ['(칸반) 대기', '작업중', '완료', '중단'],
    feats: [['상태 칸반', '작업지시를 상태 열로 표시']] }),

  // ===== 자재관리 =====
  S({ id: 'mat-in', title: '자재입고관리', group: '자재관리', path: '/material/inbounds', type: 'list',
    purpose: '자재 입고 등록(입고대기) → 선택·버튼으로 입고완료(실 입고수량).',
    relations: [{ field: '거래처', from: '거래처관리', desc: '드롭다운' }, { field: '품명·규격·단가', from: '품목관리', desc: '품목 선택 시 자동' }],
    dropdowns: [{ field: '거래처', source: 'partners', values: '거래처' }, { field: '품목', source: 'items', values: '품목' }, { field: '창고', source: '고정값', values: '자재창고1/2/외주창고' }, { field: '상태', source: '고정값', values: '입고대기/입고완료' }],
    search: ['입고일 기간 조회', '필터·칩: 상태·창고', '검색: 입고번호·거래처·품목·LOT'], sort: '입고일 내림차순',
    columns: ['입고번호', '입고일', '거래처', '품명', '규격', '입고수량', '실 입고수량', '단가', '금액', '창고', 'LOT', '상태'],
    feats: [['입고완료', '행 선택 → [입고완료] → 실 입고수량(기본=입고수량) 확인/수정']],
    alerts: ['입고완료만 재고 반영', '미선택 시 버튼 비활성'] }),
  S({ id: 'mat-out', title: '자재반출관리', group: '자재관리', path: '/material/outbounds', type: 'list',
    purpose: '생산투입·외주·반품 출고 관리. 자재현황 반품도 반품 탭에 표시.',
    relations: [{ field: '품명·단위', from: '품목관리', desc: '품목 선택 시 자동' }, { field: '작업지시', from: '작업지시관리', desc: '생산투입 연결' }, { field: '원입고', from: '자재입고관리', desc: '반품 건 원 입고번호' }],
    dropdowns: [{ field: '품목', source: 'items', values: '품목' }, { field: '작업지시', source: 'work_orders', values: '작업지시' }, { field: '용도', source: '고정값', values: '생산투입/외주/반품' }, { field: '담당자', source: 'users', values: '사용자' }],
    search: ['반출일 기간 조회', '칩(용도): 생산투입/외주/반품', '검색: 반출번호·품목·작업지시'], sort: '반출일 내림차순',
    columns: ['반출번호', '반출일', '품명', '반출수량', '단위', '작업지시', '원입고(반품)', '창고', '용도', '담당자'] }),
  S({ id: 'mat-stock', title: '자재현황', group: '자재관리', path: '/material/stocks', type: 'masterDetail',
    purpose: '좌(품목)/우(입고번호별 재고). 입고번호 단위 단일선택 반품.',
    relations: [{ field: '재고', from: '입고(완료)−반출', desc: '실 입고수량 − 반출/반품' }, { field: '반품 결과', from: '자재반출관리', desc: 'purpose 반품 outbound 생성' }],
    dropdowns: [], search: ['좌측 검색: 품목코드·품명'], sort: '품목코드 오름차순',
    columns: ['(좌) 품목·현재고', '(우) 입고번호', '입고일', 'LOT', '실입고', '반품', '반품가능', '창고'],
    feats: [['단일선택 반품', '입고번호 1건 선택(다중 불가) → [반품] → 반품수량 입력']],
    alerts: ['반품수량 0/초과 시 오류', '미선택 시 반품 버튼 비활성'] }),

  // ===== 공구관리 =====
  S({ id: 'tool-stock', title: '재고관리', group: '공구관리', path: '/tool/stocks', type: 'masterDetail',
    purpose: '입고 1개마다 LOT 부여(입고번호-01,02…). 단위 LOT 수명·잔여 관리.',
    relations: [{ field: '단위 LOT', from: '입·출고관리(입고)', desc: '입고수량 1개씩 분해' }, { field: '사용 차감', from: '작업 POP', desc: 'LOT별 사용횟수' }],
    dropdowns: [], search: ['좌측 검색: 공구코드·공구명'], sort: '공구코드 오름차순',
    columns: ['(좌) 공구·남은수명', '(우) LOT 번호', '입고일', '입고건', '수명(횟수)', '사용', '남은수명', '상태'] }),
  S({ id: 'tool-move', title: '입·출고관리', group: '공구관리', path: '/tool/movements', type: 'list',
    purpose: '공구 입고·출고 이력 관리.',
    relations: [{ field: '공구', from: '공구관리(기준)', desc: '공구 선택' }, { field: '담당자', from: '사용자관리', desc: '드롭다운' }],
    dropdowns: [{ field: '구분', source: '고정값', values: '입고/출고' }, { field: '공구', source: 'tools', values: '등록 공구' }],
    search: ['입·출고일 기간 조회', '검색: 관리번호·공구·작업자'], sort: '입출고일 내림차순',
    columns: ['관리번호', '일자', '구분', '공구', '수량', '담당자', '설비/위치'] }),
  S({ id: 'tool-disposal', title: '폐기관리', group: '공구관리', path: '/tool/disposals', type: 'list',
    purpose: '수명초과·파손 공구 폐기 이력 관리.',
    relations: [{ field: '공구', from: '공구관리(기준)', desc: '공구 선택' }],
    dropdowns: [{ field: '공구', source: 'tools', values: '등록 공구' }, { field: '사유', source: '고정값', values: '수명초과/파손 등' }],
    search: ['폐기일 기간 조회', '검색: 폐기번호·공구'], sort: '폐기일 내림차순',
    columns: ['폐기번호', '폐기일', '공구', '수량', '사유', '담당자'] }),

  // ===== 품질관리 =====
  S({ id: 'insp-std', title: '검사기준관리', group: '품질관리', path: '/quality/standards', type: 'masterDetail',
    purpose: '상단 큰 탭(수입/출하) + 좌(품목)/우(검사기준). 정량(숫자)·정성(OK/NG).',
    relations: [{ field: '품목', from: '품목관리', desc: '좌측 목록' }, { field: '측정장비', from: '공구관리', desc: '드롭다운' }],
    dropdowns: [{ field: '평가방법', source: '고정값', values: '정량적/정성적' }, { field: '측정장비', source: 'tools', values: '등록 공구' }],
    search: ['상단 탭: 수입검사/출하검사', '좌측 검색: 품목코드·품명'], sort: '기준번호순',
    columns: ['기준번호', '검사항목', '평가방법', '기준/판정', '검사방법', '측정장비', '사용'],
    feats: [['검사유형 탭', '상단 큰 탭으로 수입/출하 전환(좌·우 전체 필터)']],
    alerts: ['eval_method 컬럼 없으면 migration_inspection.sql 안내'] }),
  S({ id: 'insp-in', title: '수입검사', group: '품질관리', path: '/quality/incoming', type: 'list',
    purpose: '입고 자재를 검사기준에 따라 검사. 항목 측정/판정 → 종합판정 자동.',
    relations: [{ field: '검사기준', from: '검사기준관리(수입)', desc: '품목 선택 시 자동' }, { field: '입고정보', from: '자재입고관리', desc: '입고 선택 시 자동' }],
    dropdowns: [{ field: '품목', source: 'items', values: '품목' }, { field: '입고', source: 'material_inbounds', values: '입고 건' }, { field: '검사자', source: 'users', values: '사용자' }],
    search: ['검사일 기간 조회', '판정칩: 합격/불합격/조건부합격', '검색: 검사번호·품목·거래처'], sort: '검사일 내림차순',
    columns: ['검사번호', '검사일', 'LOT', '거래처', '품명', '검사', '양품', '불량', '검사자', '판정'],
    feats: [['신규 검사', '품목 선택 시 검사기준 자동 로드, 항목 평가 → 종합판정']],
    alerts: ['검사기준 없으면 수동 판정 선택 안내', '항목 미평가 시 저장 불가'] }),
  S({ id: 'insp-in-status', title: '수입검사현황', group: '품질관리', path: '/quality/incoming-status', type: 'chart',
    purpose: '수입검사를 기간·조건별 그래프로. 지표=검사건수.',
    relations: [{ field: '데이터', from: '수입검사', desc: 'incoming_inspections 집계' }],
    dropdowns: [{ field: '판정', source: '데이터', values: '합격/불합격/조건부' }, { field: '거래처', source: '데이터', values: '거래처' }],
    search: ['기간(검사일) 조회', '조건: 판정·거래처'], sort: '-',
    columns: ['통계(검사/합격/불합격/합격률)', '추이', '판정·거래처·품목 도넛'] }),
  S({ id: 'ncr', title: '부적합관리', group: '품질관리', path: '/quality/nonconformance', type: 'list',
    purpose: '공정·검사 부적합(불량) 등록·조치(폐기/재작업/특채/반품).',
    relations: [{ field: '품명', from: '품목관리', desc: '품목 선택' }],
    dropdowns: [{ field: '조치유형', source: '고정값', values: '폐기/재작업/특채/반품' }, { field: '상태', source: '고정값', values: '처리중/완료' }],
    search: ['발생일 기간 조회', '필터: 조치·상태', '검색: 부적합번호·공정·품목'], sort: '발생일 내림차순',
    columns: ['부적합번호', '발생일', '공정', '품명', '불량유형', '불량수량', '원인', '조치유형', '작업자', '상태'] }),
  S({ id: 'ncr-status', title: '부적합현황', group: '품질관리', path: '/quality/ncr-status', type: 'chart',
    purpose: '부적합을 발생일·공정·작업자·조치·유형별 그래프로. 지표=부적합수량.',
    relations: [{ field: '데이터', from: '부적합관리', desc: 'nonconformances 집계' }],
    dropdowns: [], search: ['기간(발생일) 조회'], sort: '-',
    columns: ['통계(건수/수량/처리중/완료)', '발생일 추이', '공정·작업자·조치·유형 도넛'] }),
  S({ id: 'insp-out', title: '출하검사', group: '품질관리', path: '/quality/shipping', type: 'list',
    purpose: '생산완료 수주 리스트 + 행별 [출하검사] 버튼. 검사기준 기반 평가. 납품상태 표시.',
    relations: [{ field: '대상', from: '수주/작업지시', desc: '생산완료 건만' }, { field: '검사기준', from: '검사기준관리(출하)', desc: '품목 기준 자동' }, { field: '납품상태', from: '납품관리', desc: '납품완료 여부' }],
    dropdowns: [{ field: '검사자', source: 'users', values: '사용자' }],
    search: ['검사일 기간 조회', '칩: 전체/미검사/검사완료', '검색: 수주번호·거래처·품명'], sort: '미검사 우선',
    columns: ['수주번호', '거래처', '품명', '수량', '검사상태', '납품상태', '검사일', '검사(버튼)'],
    feats: [['출하검사 버튼', '행별 [출하검사] → 검사기준 평가 → 합격/불합격, 완료 시 [결과]']],
    alerts: ['기간 지정 시 해당 기간 검사완료 건만 표시', '검사기준 없으면 수동 판정'] }),
  S({ id: 'insp-out-status', title: '출하검사현황', group: '품질관리', path: '/quality/shipping-status', type: 'chart',
    purpose: '출하검사를 기간·조건별 그래프로. 지표=검사건수.',
    relations: [{ field: '데이터', from: '출하검사', desc: 'shipping_inspections 집계' }],
    dropdowns: [{ field: '판정', source: '데이터', values: '합격/불합격/조건부' }, { field: '거래처', source: '데이터', values: '거래처' }],
    search: ['기간(검사일) 조회', '조건: 판정·거래처'], sort: '-',
    columns: ['통계(검사/합격/불합격/합격률)', '추이', '판정·거래처·품목 도넛'] }),

  // ===== AI 인텔리전스 =====
  S({ id: 'ai-delay', title: '생산지연 예측', group: 'AI 인텔리전스', path: '/ai/delay', type: 'analysis',
    purpose: '작업지시 실적·납기·생산속도로 지연 위험을 예측·추천.',
    relations: [{ field: '분석 입력', from: '작업지시/생산실적/생산계획', desc: '실적·납기 종합' }],
    dropdowns: [], search: ['실시간 전체 분석'], sort: '위험도 내림차순',
    columns: ['위험도', '작업지시', '품명', '진척률', '잔량', '납기(D-day)', 'AI 분석', '추천 조치'] }),
  S({ id: 'ai-defect', title: '불량원인 분석', group: 'AI 인텔리전스', path: '/ai/defect', type: 'analysis',
    purpose: '부적합 이력으로 주요 원인·취약공정·추세 분석, 시정/예방 추천.',
    relations: [{ field: '분석 입력', from: '부적합관리', desc: 'nonconformances' }],
    dropdowns: [], search: ['실시간 전체 분석'], sort: '수량 내림차순',
    columns: ['통계(누적/원인/공정/추세)', '추천 조치', '원인·공정·품목·유형별 막대'] }),
  S({ id: 'ai-inventory', title: '재고 예측', group: 'AI 인텔리전스', path: '/ai/inventory', type: 'analysis',
    purpose: '소비추이로 부족·소진임박·장기정체 예측, 발주량 추천.',
    relations: [{ field: '분석 입력', from: '자재현황/품목/자재반출', desc: '재고·소비' }],
    dropdowns: [], search: ['실시간 전체 분석'], sort: '위험 우선',
    columns: ['상태', '품목', '현재고', '안전재고', '일평균소비', '소진예상', '추천 발주량'] }),
  S({ id: 'ai-equip', title: '설비 예지보전', group: 'AI 인텔리전스', path: '/ai/equipment', type: 'analysis',
    purpose: '설비 센서(진동·온도·전류)·불량률로 이상 감지, 점검 추천.',
    relations: [{ field: '분석 입력', from: '설비/생산실적/부적합', desc: '상태·불량률(센서값은 데모 합성)' }],
    dropdowns: [], search: ['실시간 전체 분석'], sort: '위험도 내림차순',
    columns: ['위험도', '설비', '건강도', '진동', '온도', '전류', '불량률', '이상신호', '추천 조치'],
    alerts: ['진동·온도·전류는 데모 합성값(센서 미연동) — 그 외 실데이터'] }),
  S({ id: 'ai-report', title: 'AI 일일리포트', group: 'AI 인텔리전스', path: '/ai/report', type: 'analysis',
    purpose: '생산·품질·물류·설비 자동 요약 + 핵심 인사이트·권장 조치.',
    relations: [{ field: '분석 입력', from: '전 업무 데이터', desc: '종합 요약' }],
    dropdowns: [], search: ['실시간 전체 분석'], sort: '-',
    columns: ['금일 생산/수율', '핵심 인사이트', '생산/품질/자재/설비 요약', '권장 조치'] }),

  // ===== RFID 추적 =====
  S({ id: 'rfid-tag', title: 'RFID 태그관리', group: 'RFID 추적', path: '/rfid/tags', type: 'list',
    purpose: '팔레트·대차·금형·공구·검사구 등 추적 대상 RFID 태그 관리.',
    relations: [{ field: '매칭코드', from: '품목/설비/작업지시', desc: '추적 대상 코드' }],
    dropdowns: [{ field: '태그유형', source: '고정값', values: '팔레트/대차/박스/금형/지그/공구/검사구/자재' }, { field: '상태', source: '고정값', values: '활성/비활성/분실' }],
    search: ['검색: UID·라벨·매칭코드·LOT', '필터·칩: 태그유형·상태'], sort: 'UID 오름차순',
    columns: ['RFID UID', '유형', '라벨', '매칭코드', 'LOT', '현재위치', '사용횟수', '상태', '최근인식'] }),
  S({ id: 'rfid-event', title: 'RFID 이동이력', group: 'RFID 추적', path: '/rfid/events', type: 'list',
    purpose: '게이트(공정입구·검사장·포장장·출하장) 리더 인식 이동 이력.',
    relations: [{ field: 'RFID 태그', from: 'RFID 태그관리', desc: '태그 선택 시 유형·LOT 자동' }],
    dropdowns: [{ field: '태그', source: 'rfid_tags', values: '등록 태그' }, { field: '게이트', source: '고정값', values: '창고입구/적치랙/공정입구/검사장/포장장/출하장/출고장' }, { field: '이벤트', source: '고정값', values: '입고/적치/공정이동/검사이동/포장이동/출하이동/피킹/출고' }],
    search: ['필터·칩: 이벤트·게이트', '검색: 이력번호·UID·LOT'], sort: '인식시각 내림차순',
    columns: ['이력번호', '인식시각', 'RFID UID', '유형', '게이트', '이벤트', 'LOT', '매칭코드', '리더기'] }),
  S({ id: 'rfid-trace', title: 'LOT 추적', group: 'RFID 추적', path: '/rfid/trace', type: 'trace',
    purpose: 'LOT의 RFID 이동 경로(공정→검사→포장→출하)를 역추적. 불량 영향범위 분석.',
    relations: [{ field: '이동 이력', from: 'RFID 이동이력', desc: 'LOT별 인식 기록' }, { field: '연계 태그', from: 'RFID 태그관리', desc: '운반 태그' }],
    dropdowns: [{ field: '최근 LOT', source: 'rfid_events', values: '이력 있는 LOT' }],
    search: ['LOT 입력 또는 선택 → 추적'], sort: '시간순',
    columns: ['요약(LOT/인식횟수/현재위치)', '이동 타임라인(게이트·이벤트·시각)'] }),
];

const SCREEN_BY_TITLE = {}; SCREENS.forEach(s => { SCREEN_BY_TITLE[s.title] = s.id; });
function b(n) { return `<span class="wf-badge">${n}</span>`; }

// 유형별 기본 프로세스 (screen.process 없으면 사용)
const TYPE_PROC = {
  list: ['목록 조회/검색', '신규등록 또는 행 선택', '입력·처리', '저장 → 목록 갱신'],
  masterDetail: ['좌측 항목 선택', '우측 상세 확인', '등록/처리', '저장 → 갱신'],
  chart: ['기간·조건 설정', '조회', '추이·분류 그래프 분석', '그래프 클릭 → 목록 확인'],
  analysis: ['전체 데이터 자동 분석', '요약·위험도 산출', '결과·추천 검토', '담당자 조치'],
  pop: ['작업지시 카드 선택', '공정 시작(작업자·설비)', '자재·공구 투입', '공정 종료 → 실적 자동등록'],
  dashboard: ['로그인', '현황 자동 집계', '상세 메뉴로 이동'],
  trace: ['LOT 입력/선택', '이동 이력 검색', '경로 타임라인 확인', '영향범위 분석'],
};

// ---------- 렌더 헬퍼 ----------
function flowRow(steps, tone) {
  return `<div class="spec-flow">${steps.map((s, i) => {
    const id = SCREEN_BY_TITLE[s];
    return `<span class="spec-flow__step spec-flow__step--${tone} ${id ? 'is-link' : ''}" ${id ? `data-goto="${id}"` : ''}>${escapeHtml(s)}</span>` + (i < steps.length - 1 ? `<span class="spec-flow__arrow">${icon('chevronRight', 16)}</span>` : '');
  }).join('')}</div>`;
}
function specTable(headers, rows) {
  if (!rows.length) return `<div class="muted" style="padding:8px 2px">해당 없음</div>`;
  return `<div class="table-wrap"><table class="grid"><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

// ---------- 화면설계서 홈 ----------
export async function designSpecHome(root) {
  const groups = {};
  for (const s of SCREENS) (groups[s.group] ??= []).push(s);
  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text"><h1>화면설계서</h1><p>전체 시스템 프로세스와 <b>${SCREENS.length}개 전 화면</b>의 설계 명세(미리보기·기능·데이터연관성·드롭리스트·조회조건·예외처리)를 제공합니다.</p></div>
      <div class="page-head__actions"><a class="btn btn--primary" href="#/dashboard">${icon('logout', 16)} 시스템으로</a></div>
    </div>
    <div class="card" style="margin-bottom:18px"><div class="card__head">${icon('route', 18)}<h3>전체 시스템 프로세스</h3></div>
      <div class="card__body flex-col" style="gap:16px">
        ${SYSTEM_FLOWS.map(f => `<div><div class="spec-flow-label">${escapeHtml(f.label)}</div>${flowRow(f.steps, f.tone)}</div>`).join('')}
        <div class="muted" style="font-size:12px">※ 박스를 클릭하면 해당 화면 설계서로 이동합니다.</div>
      </div></div>
    ${Object.entries(groups).map(([g, list]) => `
      <div class="card" style="margin-bottom:16px"><div class="card__head">${icon('database', 18)}<h3>${escapeHtml(g)} <span class="muted" style="font-weight:600">${list.length}</span></h3></div>
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
  const tpl = TYPE[s.type] || TYPE.list;

  // 기능설명 = 유형 기본기능(번호) + 화면 추가기능
  const baseFeats = tpl.feats.map(([t, d], i) => ({ n: i + 1, t, d }));
  const extraFeats = (s.feats || []).map(([t, d], i) => ({ n: baseFeats.length + i + 1, t, d, extra: true }));
  const feats = [...baseFeats, ...extraFeats];
  // 예외처리 = 유형 + 화면
  const alerts = [...(tpl.alerts || []), ...(s.alerts || [])];
  // 기본조건 = 정렬 + 유형 기본
  const defs = [s.sort ? `정렬 기본: ${s.sort}` : null, ...(tpl.defs || []), ...(s.defs || [])].filter(Boolean);

  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text">
        <div class="muted" style="font-size:12.5px;margin-bottom:2px">${escapeHtml(s.group)} · ${escapeHtml(s.type)}형</div>
        <h1>${escapeHtml(s.title)} <span class="muted" style="font-size:14px;font-weight:600">설계서</span></h1>
        <p>${escapeHtml(s.purpose)}</p>
      </div>
      <div class="page-head__actions">
        <a class="btn" href="#/spec">${icon('grid', 16)} 목록</a>
        <a class="btn btn--primary" href="#${s.path}">${icon('monitor', 16)} 실제 화면 열기</a>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px"><div class="card__head">${icon('monitor', 18)}<h3>화면 미리보기 · 기능 설명</h3></div>
      <div class="card__body">
        <div class="grid-2" style="align-items:start">
          <div class="wf wf--${escapeHtml(s.type)}">${tpl.wf()}</div>
          <div>${specTable(['№', '기능', '설명'], feats.map(f => [`<span class="spec-num">${f.n}</span>`, `<b>${escapeHtml(f.t)}</b>${f.extra ? ' <span class="badge badge--info" style="height:18px">화면 고유</span>' : ''}`, escapeHtml(f.d)]))}</div>
        </div>
      </div></div>

    <div class="card" style="margin-bottom:16px"><div class="card__head">${icon('activity', 18)}<h3>화면 프로세스</h3></div>
      <div class="card__body">${flowRow(s.process || TYPE_PROC[s.type] || [], 'brand')}</div></div>

    <div class="grid-2">
      <div class="card"><div class="card__head">${icon('layers', 18)}<h3>데이터 연관성 (타 화면 연동)</h3></div>
        <div class="card__body">${specTable(['항목', '가져오는 곳', '설명'], (s.relations || []).map(r => [`<b>${escapeHtml(r.field)}</b>`, `<span class="badge badge--info">${escapeHtml(r.from)}</span>`, escapeHtml(r.desc)]))}</div></div>
      <div class="card"><div class="card__head">${icon('sliders', 18)}<h3>드롭리스트 구성</h3></div>
        <div class="card__body">${specTable(['항목', '데이터 출처', '값/구성'], (s.dropdowns || []).map(d => [`<b>${escapeHtml(d.field)}</b>`, `<span class="cell-code">${escapeHtml(d.source)}</span>`, escapeHtml(d.values)]))}</div></div>
    </div>

    <div class="grid-2">
      <div class="card"><div class="card__head">${icon('search', 18)}<h3>조회조건 · 기본조건</h3></div>
        <div class="card__body">
          <div class="muted" style="font-weight:700;font-size:12px;margin-bottom:5px">조회조건</div>
          <ul class="spec-list">${(s.search || []).map(x => `<li>${icon('chevronRight', 13)} ${escapeHtml(x)}</li>`).join('')}</ul>
          <div class="muted" style="font-weight:700;font-size:12px;margin:12px 0 5px">기본(디폴트) 조건</div>
          <ul class="spec-list">${defs.map(x => `<li>${icon('check', 13)} ${escapeHtml(x)}</li>`).join('')}</ul>
        </div></div>
      <div class="card"><div class="card__head">${icon('grid', 18)}<h3>컬럼 구성</h3></div>
        <div class="card__body"><div class="spec-cols">${(s.columns || []).map(c => `<span class="spec-col">${escapeHtml(c)}</span>`).join('')}</div></div></div>
    </div>

    <div class="card" style="margin-bottom:16px"><div class="card__head">${icon('alert', 18)}<h3>예외처리 (Alert · 검증)</h3></div>
      <div class="card__body"><ul class="spec-list spec-list--alert">${alerts.map(a => `<li>${icon('alert', 13)} ${escapeHtml(a)}</li>`).join('')}</ul></div></div>

    <div class="flex between" style="margin-top:6px">
      ${prev ? `<button class="btn" data-goto="${prev.id}">${icon('chevronLeft', 16)} ${escapeHtml(prev.title)}</button>` : '<span></span>'}
      ${next ? `<button class="btn" data-goto="${next.id}">${escapeHtml(next.title)} ${icon('chevronRight', 16)}</button>` : '<span></span>'}
    </div>`;
  root.querySelectorAll('[data-goto]').forEach(el => el.onclick = () => { location.hash = `#/spec/view?id=${el.dataset.goto}`; });
}
