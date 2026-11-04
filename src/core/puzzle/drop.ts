/* ---------- drop: 드래그를 놓을 자리 결정 ---------- */
import { absCells, canPlace, inBoard, occMap, placedList, slotDef, type Placement } from './geometry'
import type { PieceDef, PieceKind, Slot } from './pieces'

/** 위첨자를 받을 수 있는 조각 (파서가 sup을 허용하는 종류) */
const SUP_BASE = new Set<PieceKind>(['num', 'const', 'negsq', 'rp', 'sqrt', 'frac', 'int'])

/**
 * 첨자 자리 규칙: 첨자 크기가 있는 조각을 위첨자를 받는 조각의 바로 오른쪽에,
 * 아랫줄이 그 조각의 윗줄이거나 한 줄 위가 되게 놓으면 아랫줄을 유지한 채 첨자 크기가 된다.
 * 첨자 크기 조각 뒤에 이어 붙여도 같다. 첨자 크기는 놓을 때만 정해진다.
 * @returns 첨자 크기로 놓일 행, 아니면 null
 */
export function scriptRow(pieces: PieceDef[], place: Placement, d: PieceDef, x: number, y: number): number | null {
  if (!d.script) return null
  const b = y + d.h - 1
  if (b < 0) return null
  for (const p of placedList(pieces, place)) {
    if (p.def.id === d.id || p.right !== x - 1 || !SUP_BASE.has(p.def.kind)) continue
    if (b === p.top || b === p.top - 1) return b
  }
  return null
}

/** 자리를 맞바꿀 수 있는 모양 */
const shapeKey = (d: PieceDef) => `${d.w}x${d.h}|${!!d.script}|${JSON.stringify(d.cells ?? null)}`

export type DropPlan = {
  /** 놓인 조각의 새 자리 */
  slot: Slot
  /** 자리 맞바꾸기: 밀려난 조각과 그 새 자리(null이면 트레이) */
  swap?: { id: string; slot: Slot | null }
}

/**
 * 본문 크기 기준 스냅 위치 (x, y)에 조각 id를 놓을 때의 결과. 놓을 수 없으면 null.
 * 자리 맞바꾸기 규칙: 같은 모양의 조각 하나와만 겹치면 서로 자리(크기 포함)를 바꾼다. 트레이도 하나의 자리다.
 */
export function resolveDrop(pieces: PieceDef[], place: Placement, id: string, x: number, y: number): DropPlan | null {
  const d = pieces.find(q => q.id === id)!
  const r = scriptRow(pieces, place, d, x, y)
  const slot: Slot = r === null ? [x, y] : [x, r, 'script']
  const sd = slotDef(d, slot)
  if (canPlace(pieces, place, sd, slot[0], slot[1], id)) return { slot }

  const cells = absCells(sd, slot[0], slot[1])
  if (!inBoard(cells)) return null
  const occ = occMap(pieces, place, id)
  const hit = new Set(cells.map(([a, b]) => occ.get(a + ',' + b)).filter(k => k !== undefined))
  if (hit.size !== 1) return null
  const other = pieces.find(q => hit.has(q.id))!
  if (shapeKey(other) !== shapeKey(d)) return null
  return { slot: place[other.id], swap: { id: other.id, slot: place[id] ?? null } }
}

/** 배치에 적용 */
export function applyDrop(place: Placement, id: string, plan: DropPlan): Placement {
  const next = { ...place, [id]: plan.slot }
  if (plan.swap) {
    if (plan.swap.slot) next[plan.swap.id] = plan.swap.slot
    else delete next[plan.swap.id]
  }
  return next
}
