-- =====================================================================
-- RFID 추적 모듈 마이그레이션
-- ---------------------------------------------------------------------
-- AI 인텔리전스(생산지연 예측·불량원인 분석·재고 예측·설비 예지보전·일일리포트)는
-- 기존 테이블(work_orders/production_results/nonconformances/material_stocks/equipments)을
-- 종합 분석하므로 별도 테이블이 필요 없습니다.
-- 본 스크립트는 RFID 추적에 필요한 신규 테이블만 생성합니다.
-- 실행: Supabase 대시보드 > SQL Editor 에 붙여넣고 실행
-- =====================================================================

-- 3.1 RFID 태그 (팔레트·대차·박스·금형·지그·공구·검사구·자재)
create table if not exists rfid_tags (
  id           uuid primary key default uuid_generate_v4(),
  tag_uid      text unique not null,            -- RFID UID
  tag_type     text,                            -- 팔레트/대차/박스/금형/지그/공구/검사구/자재
  label        text,                            -- 라벨/설명
  ref_code     text,                            -- 매칭된 품목/설비/작업지시 코드
  lot_no       text,                            -- 적재된 LOT
  location     text,                            -- 현재 위치
  use_count    integer default 0,               -- 사용횟수(금형/공구 수명관리)
  life_count   integer default 0,               -- 수명 한도(횟수)
  status       text default '활성',             -- 활성/비활성/분실
  assigned_to  text,                            -- 담당/배정
  last_seen    date,                            -- 최근 인식일
  remark       text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 3.2 RFID 이동 이력 (게이트 리더 자동 인식 로그)
create table if not exists rfid_events (
  id           uuid primary key default uuid_generate_v4(),
  event_no     text,                            -- 이력번호 (RF-YYMM-001)
  event_time   timestamptz,                     -- 인식 시각
  tag_uid      text,                            -- RFID UID
  tag_type     text,
  gate         text,                            -- 창고입구/적치랙/공정입구/검사장/포장장/출하장/출고장
  event_type   text,                            -- 입고/적치/공정이동/검사이동/포장이동/출하이동/피킹/출고
  lot_no       text,
  ref_code     text,
  reader       text,                            -- 리더기 ID
  location     text,
  remark       text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_rfid_events_lot on rfid_events(lot_no);
create index if not exists idx_rfid_events_tag on rfid_events(tag_uid);
create index if not exists idx_rfid_events_time on rfid_events(event_time);

-- updated_at 트리거
do $$
declare t text;
begin
  for t in select unnest(array['rfid_tags','rfid_events'])
  loop
    execute format('drop trigger if exists trg_%I_updated on %I;', t, t);
    execute format('create trigger trg_%I_updated before update on %I for each row execute function set_updated_at();', t, t);
  end loop;
end $$;

-- RLS (개발 단계: anon 전체 허용. 운영 전 정책 강화 필요)
do $$
declare t text;
begin
  for t in select unnest(array['rfid_tags','rfid_events'])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "allow_all" on %I;', t);
    execute format('create policy "allow_all" on %I for all using (true) with check (true);', t);
  end loop;
end $$;
