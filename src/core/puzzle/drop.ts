/* ---------- drop: 드래그를 놓을 자리 결정 ---------- */
import { absCells, canPlace, inBoard, occMap, placedList, slotDef, type Placement } from './geometry'
import type { Placed } from '../math/parse2d'
import { inForm, type PieceDef, type PieceKind, type Slot } from './pieces'

/** 위첨자를 받을 수 있는 조각 (파서가 sup을 허용하는 종류) */
const SUP_BASE = new Set<PieceKind>(['num', 'const', 'negsq', 'rp', 'sqrt', 'frac', 'int'])

/** 지수 단계는 2까지 (지수의 지수). 2단계 지수도 크기는 같다. */
export const MAX_SCRIPT_DEPTH = 2

/** 바로 왼쪽 조각 L에 대한 관계: 아랫줄 b인 첨자가 L의 위첨자 자리인지, L의 첨자 줄을 잇는지 */
const supOf = (L: Placed, b: number) => SUP_BASE.has(L.def.kind) && (b === L.top || b === L.top - 1)
const chainOf = (L: Placed, b: number, place: Placement) => place[L.def.id][2] === 'script' && b === L.bottom

/** 판 위 조각의 지수 단계: 본문 크기 0, 위첨자 자리면 밑 + 1, 첨자 줄을 이으면 앞 조각과 같음 */
function depthOf(list: Placed[], place: Placement, p: Placed, seen = new Set<string>()): number {
  if (place[p.def.id][2] !== 'script') return 0
  if (seen.has(p.def.id)) return MAX_SCRIPT_DEPTH
  seen.add(p.def.id)
  for (const L of list) {
    if (L.right !== p.left - 1) continue
    if (chainOf(L, p.bottom, place)) return depthOf(list, place, L, seen)
    if (supOf(L, p.bottom)) return depthOf(list, place, L, seen) + 1
  }
  return 1
}

/**
 * 첨자 자리 규칙. 본문 크기 기준 스냅 (x, y)에서 조각의 아랫줄을 b라 할 때, 바로 왼쪽 조각 L에 대해
 * - 위첨자 자리: L이 위첨자를 받는 조각이고 b가 L의 윗줄이거나 한 줄 위 (L이 첨자면 지수의 지수, 2단계까지)
 * - 첨자 줄 잇기: L이 첨자 크기이고 b가 L의 아랫줄
 * 이면 아랫줄 b를 유지한 첨자 크기 자리. 크기는 놓을 때만 정해진다.
 */
export function scriptSlot(pieces: PieceDef[], place: Placement, d: PieceDef, x: number, y: number): Slot | null {
  if (!d.script) return null
  const b = y + d.h - 1
  const top = b - d.script.h + 1
  if (top < 0) return null
  const others = { ...place }
  delete others[d.id]
  const list = placedList(pieces, others)
  for (const L of list) {
    if (L.right !== x - 1) continue
    if (chainOf(L, b, others) || (supOf(L, b) && depthOf(list, others, L) < MAX_SCRIPT_DEPTH)) return [x, top, 'script']
  }
  return null
}

/** 자리를 맞바꿀 수 있는 모양 (본문 크기 기준) */
const shapeKey = (d: PieceDef) => `${d.w}x${d.h}|${JSON.stringify(d.cells ?? null)}`

export type DropPlan = {
  /** 놓인 조각의 새 자리 */
  slot: Slot
  /** 자리 맞바꾸기: 밀려난 조각과 그 새 자리(null이면 트레이) */
  swap?: { id: string; slot: Slot | null }
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

/** 그 조각이 그 크기를 가질 수 있고, 판 안에서 다른 조각과 겹치지 않는지 */
const fits = (pieces: PieceDef[], place: Placement, d: PieceDef) => {
  const s = place[d.id]
  return (s[2] !== 'script' || !!d.script) && canPlace(pieces, place, slotDef(d, s), s[0], s[1], d.id)
}

/**
 * 본문 크기 기준 스냅 위치 (x, y)에 조각 id를 놓을 때의 결과. 놓을 수 없으면 null.
 * 자리 맞바꾸기 규칙: 같은 모양의 조각 하나와만 겹치면, 서로의 자리(크기 포함)에 들어갈 수 있을 때 맞바꾼다.
 * 트레이도 하나의 자리다.
 */
export function resolveDrop(pieces: PieceDef[], place: Placement, id: string, x: number, y: number): DropPlan | null {
  const d = pieces.find(q => q.id === id)!
  const slot: Slot = scriptSlot(pieces, place, d, x, y) ?? [x, y]
  const sd = inForm(d, slot[2])
  if (canPlace(pieces, place, sd, slot[0], slot[1], id)) return { slot }

  const cells = absCells(sd, slot[0], slot[1])
  if (!inBoard(cells)) return null
  const occ = occMap(pieces, place, id)
  const hit = new Set(cells.map(([a, b]) => occ.get(a + ',' + b)).filter(k => k !== undefined))
  if (hit.size !== 1) return null
  const other = pieces.find(q => hit.has(q.id))!
  if (shapeKey(other) !== shapeKey(d)) return null
  const plan: DropPlan = { slot: place[other.id], swap: { id: other.id, slot: place[id] ?? null } }
  const next = applyDrop(place, id, plan)
  if (!fits(pieces, next, d) || (next[other.id] && !fits(pieces, next, other))) return null
  return plan
}
