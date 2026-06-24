// 메뉴 구조 + 라우트 → 페이지 매핑
import { dashboard } from './pages/dashboard.js';
import * as base from './pages/base.js';
import * as sales from './pages/sales.js';
import * as prod from './pages/production.js';
import * as mat from './pages/material.js';
import * as tool from './pages/tool.js';
import * as qa from './pages/quality.js';
import { popList, popDetail } from './pages/pop.js';
import { itemRouting } from './pages/routing.js';
import { processMaster } from './pages/processMaster.js';
import { incomingInspection, shippingInspection } from './pages/inspection.js';
import { departmentManager } from './pages/department.js';
import { inspectionStandards } from './pages/inspectionStandard.js';
import { ncrStatus } from './pages/ncrStatus.js';
import { bomManager } from './pages/bom.js';
import { toolStock } from './pages/toolStock.js';
import * as ai from './pages/ai.js';
import { rfidTags, rfidEvents, rfidTrace } from './pages/rfid.js';
import { incomingStatus, shippingStatus, salesStatus, deliveryStatus } from './pages/statusView.js';
import { salesForecast } from './pages/salesForecast.js';

// 사이드바 메뉴 트리 (group icon + 하위 항목)
export const MENU = [
  { id: 'dashboard', label: '대시보드', icon: 'dashboard', path: '/dashboard' },
  { id: 'pop', label: '작업 POP', icon: 'monitor', path: '/pop' },
  {
    id: 'base', label: '기준정보관리', icon: 'database', children: [
      { label: '사용자관리', path: '/base/users' },
      { label: '부서관리', path: '/base/departments' },
      { label: '거래처관리', path: '/base/partners' },
      { label: '품목관리', path: '/base/items' },
      { label: '표준공정관리', path: '/base/processes' },
      { label: '제품별표준공정관리', path: '/base/item-processes' },
      { label: 'BOM관리', path: '/base/bom' },
      { label: '공구관리', path: '/base/tools' },
      { label: '설비관리', path: '/base/equipments' },
    ],
  },
  {
    id: 'sales', label: '영업관리', icon: 'cart', children: [
      { label: 'AI 수주예측', path: '/sales/forecast' },
      { label: '수주관리', path: '/sales/orders' },
      { label: '수주현황', path: '/sales/order-status' },
      { label: '납품관리', path: '/sales/deliveries' },
      { label: '납품현황', path: '/sales/delivery-status' },
    ],
  },
  {
    id: 'production', label: '생산관리', icon: 'factory', children: [
      { label: '생산계획관리', path: '/production/plans' },
      { label: '작업지시관리', path: '/production/work-orders' },
      { label: '생산실적', path: '/production/results' },
      { label: '생산현황판', path: '/production/board' },
    ],
  },
  {
    id: 'material', label: '자재관리', icon: 'box', children: [
      { label: '자재입고관리', path: '/material/inbounds' },
      { label: '자재반출관리', path: '/material/outbounds' },
      { label: '자재현황', path: '/material/stocks' },
    ],
  },
  {
    id: 'tool', label: '공구관리', icon: 'tool', children: [
      { label: '재고관리', path: '/tool/stocks' },
      { label: '입·출고관리', path: '/tool/movements' },
      { label: '폐기관리', path: '/tool/disposals' },
    ],
  },
  {
    id: 'quality', label: '품질관리', icon: 'shield', children: [
      { label: '검사기준관리', path: '/quality/standards' },
      { label: '수입검사', path: '/quality/incoming' },
      { label: '수입검사현황', path: '/quality/incoming-status' },
      { label: '부적합관리', path: '/quality/nonconformance' },
      { label: '부적합현황', path: '/quality/ncr-status' },
      { label: '출하검사', path: '/quality/shipping' },
      { label: '출하검사현황', path: '/quality/shipping-status' },
    ],
  },
  {
    id: 'ai', label: 'AI 인텔리전스', icon: 'brain', children: [
      { label: '생산지연 예측', path: '/ai/delay' },
      { label: '불량원인 분석', path: '/ai/defect' },
      { label: '재고 예측', path: '/ai/inventory' },
      { label: '설비 예지보전', path: '/ai/equipment' },
      { label: 'AI 일일리포트', path: '/ai/report' },
    ],
  },
  {
    id: 'rfid', label: 'RFID 추적', icon: 'radio', children: [
      { label: 'RFID 태그관리', path: '/rfid/tags' },
      { label: 'RFID 이동이력', path: '/rfid/events' },
      { label: 'LOT 추적', path: '/rfid/trace' },
    ],
  },
];

// 라우트 → { render, title, group }
export const ROUTES = {
  '/dashboard': { render: dashboard, title: '대시보드', group: '대시보드' },

  '/pop': { render: popList, title: '작업 POP', group: 'POP' },
  '/pop/detail': { render: popDetail, title: '작업 진행', group: 'POP' },

  '/base/users': { render: base.users, title: '사용자관리', group: '기준정보관리' },
  '/base/departments': { render: departmentManager, title: '부서관리', group: '기준정보관리' },
  '/base/partners': { render: base.partners, title: '거래처관리', group: '기준정보관리' },
  '/base/items': { render: base.items, title: '품목관리', group: '기준정보관리' },
  '/base/processes': { render: processMaster, title: '표준공정관리', group: '기준정보관리' },
  '/base/item-processes': { render: itemRouting, title: '제품별표준공정관리', group: '기준정보관리' },
  '/base/bom': { render: bomManager, title: 'BOM관리', group: '기준정보관리' },
  '/base/tools': { render: base.tools, title: '공구관리', group: '기준정보관리' },
  '/base/equipments': { render: base.equipments, title: '설비관리', group: '기준정보관리' },

  '/sales/forecast': { render: salesForecast, title: 'AI 수주예측', group: '영업관리' },
  '/sales/orders': { render: sales.salesOrders, title: '수주관리', group: '영업관리' },
  '/sales/order-status': { render: salesStatus, title: '수주현황', group: '영업관리' },
  '/sales/deliveries': { render: sales.deliveries, title: '납품관리', group: '영업관리' },
  '/sales/delivery-status': { render: deliveryStatus, title: '납품현황', group: '영업관리' },

  '/production/plans': { render: prod.productionPlans, title: '생산계획관리', group: '생산관리' },
  '/production/work-orders': { render: prod.workOrders, title: '작업지시관리', group: '생산관리' },
  '/production/results': { render: prod.productionResults, title: '생산실적', group: '생산관리' },
  '/production/board': { render: prod.productionBoard, title: '생산현황판', group: '생산관리' },

  '/material/inbounds': { render: mat.materialInbounds, title: '자재입고관리', group: '자재관리' },
  '/material/outbounds': { render: mat.materialOutbounds, title: '자재반출관리', group: '자재관리' },
  '/material/stocks': { render: mat.materialStocks, title: '자재현황', group: '자재관리' },

  '/tool/stocks': { render: toolStock, title: '재고관리', group: '공구관리' },
  '/tool/movements': { render: tool.toolMovements, title: '입·출고관리', group: '공구관리' },
  '/tool/disposals': { render: tool.toolDisposals, title: '폐기관리', group: '공구관리' },

  '/quality/standards': { render: inspectionStandards, title: '검사기준관리', group: '품질관리' },
  '/quality/incoming': { render: incomingInspection, title: '수입검사', group: '품질관리' },
  '/quality/incoming-status': { render: incomingStatus, title: '수입검사현황', group: '품질관리' },
  '/quality/nonconformance': { render: qa.nonconformances, title: '부적합관리', group: '품질관리' },
  '/quality/ncr-status': { render: ncrStatus, title: '부적합현황', group: '품질관리' },
  '/quality/shipping': { render: shippingInspection, title: '출하검사', group: '품질관리' },
  '/quality/shipping-status': { render: shippingStatus, title: '출하검사현황', group: '품질관리' },

  '/ai/delay': { render: ai.aiDelay, title: '생산지연 예측', group: 'AI 인텔리전스' },
  '/ai/defect': { render: ai.aiDefect, title: '불량원인 분석', group: 'AI 인텔리전스' },
  '/ai/inventory': { render: ai.aiInventory, title: '재고 예측', group: 'AI 인텔리전스' },
  '/ai/equipment': { render: ai.aiEquipment, title: '설비 예지보전', group: 'AI 인텔리전스' },
  '/ai/report': { render: ai.aiReport, title: 'AI 일일리포트', group: 'AI 인텔리전스' },

  '/rfid/tags': { render: rfidTags, title: 'RFID 태그관리', group: 'RFID 추적' },
  '/rfid/events': { render: rfidEvents, title: 'RFID 이동이력', group: 'RFID 추적' },
  '/rfid/trace': { render: rfidTrace, title: 'LOT 추적', group: 'RFID 추적' },
};

export const DEFAULT_ROUTE = '/dashboard';
