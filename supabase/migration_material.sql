-- =====================================================================
-- 자재관리 개선 마이그레이션 (기존 DB 업그레이드용)
-- ---------------------------------------------------------------------
-- 1) 자재입고: 실 입고수량(actual_qty) 컬럼 추가, 상태 기본값 '입고대기'
-- 2) 자재반출: 반품 시 원 입고번호(inbound_no) 참조 컬럼 추가
-- 3) 자재현황(material_stocks) 뷰: 입고완료·실입고수량 기준으로 재계산
-- 실행: Supabase 대시보드 > SQL Editor 에 붙여넣고 실행
-- (신규로 schema.sql 을 실행했다면 모두 이미 포함되어 있습니다.)
-- =====================================================================

alter table material_inbounds  add column if not exists actual_qty numeric;
alter table material_inbounds  alter column status set default '입고대기';
alter table material_outbounds add column if not exists inbound_no text;

-- 기존 '입고예정' 데이터를 '입고대기'로 통일(선택)
update material_inbounds set status = '입고대기' where status = '입고예정';

-- 재고 뷰: 입고완료 + 실입고수량(없으면 입고수량) 기준
create or replace view material_stocks as
with ins as (
  select item_code, max(item_name) as item_name,
    sum(case when status = '입고완료' then coalesce(nullif(actual_qty, 0), inbound_qty) else 0 end) as in_qty
  from material_inbounds group by item_code
), outs as (
  select item_code, max(item_name) as item_name, sum(outbound_qty) as out_qty
  from material_outbounds group by item_code
)
select
  coalesce(i.item_code, o.item_code)             as item_code,
  coalesce(i.item_name, o.item_name)             as item_name,
  coalesce(i.in_qty, 0)                          as in_qty,
  coalesce(o.out_qty, 0)                         as out_qty,
  coalesce(i.in_qty, 0) - coalesce(o.out_qty, 0) as stock_qty
from ins i full outer join outs o on i.item_code = o.item_code;
