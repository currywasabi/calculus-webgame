/* ---------- hint (원본 hint의 순수 함수 버전) ---------- */
import { absCells, sameSlot, slotDef, type Placement } from './geometry'
import type { Level, PieceDef, Slot } from './pieces'

/** 같은 키의 조각은 서로 바꿔 쓸 수 있는 것으로 취급한다. (본문 크기 기준) */
export const pieceKey = (d: PieceDef) => d.kind + '|' + (d.tex || '') + '|' + d.w + 'x' + d.h

/**
 * 조각 하나를 정답 위치에 놓는다. 그 자리를 막고 있던 조각은 트레이로 돌아간다.
 * 이미 모두 맞게 놓여 있으면 null.
 */
export function hintStep(L: Level, current: Placement): { place: Placement; id: string } | null {
  const place = { ...current }
  const key = pieceKey
  const at = (id: string, pos: Slot) => sameSlot(place[id], pos)
  const satisfied = (q: PieceDef) => L.pieces.some(s => key(s) === key(q) && at(q.id, L.sol[s.id]))
  for (const slot of L.pieces) {
    const pos = L.sol[slot.id]
    if (L.pieces.some(q => key(q) === key(slot) && at(q.id, pos))) continue
    const cands = L.pieces.filter(q => key(q) === key(slot) && !satisfied(q))
    const q = cands.find(c => !place[c.id]) || cands[0]
    if (!q) continue
    const target = new Set(absCells(slotDef(q, pos), pos[0], pos[1]).map(c => c + ''))
    for (const r of L.pieces) {
      if (r.id === q.id || !place[r.id]) continue
      const s = place[r.id]
      if (absCells(slotDef(r, s), s[0], s[1]).some(c => target.has(c + ''))) delete place[r.id]
    }
    place[q.id] = [...pos]
    return { place, id: q.id }
  }
  return null
}
