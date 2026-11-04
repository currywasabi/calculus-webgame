/* ---------- geometry ---------- */
import type { Placed } from '../math/parse2d'
import type { Cell, PieceDef, Slot } from './pieces'
import { inForm, rect } from './pieces'

export const COLS = 12, ROWS = 8

/** 판 위 배치 {조각id: 자리} */
export type Placement = Record<string, Slot>

export const cellsOf = (d: PieceDef) => d.cells || rect(d.w, d.h)
export const absCells = (d: PieceDef, x: number, y: number): Cell[] => cellsOf(d).map(([a, b]) => [a + x, b + y])
/** 자리의 크기를 반영한 조각 정의 */
export const slotDef = (d: PieceDef, s: Slot) => inForm(d, s[2])
export const sameSlot = (a: Slot | undefined, b: Slot) => !!a && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
export function occMap(pieces: PieceDef[], place: Placement, except?: string) {
  const m = new Map<string, string>()
  for (const d of pieces) {
    if (d.id === except || !place[d.id]) continue
    const [x, y] = place[d.id]
    for (const [a, b] of absCells(slotDef(d, place[d.id]), x, y)) m.set(a + ',' + b, d.id)
  }
  return m
}
export const inBoard = (cells: Cell[]) => cells.every(([a, b]) => a >= 0 && b >= 0 && a < COLS && b < ROWS)
/** d는 놓을 크기의 정의 */
export function canPlace(pieces: PieceDef[], place: Placement, d: PieceDef, x: number, y: number, except?: string) {
  const m = occMap(pieces, place, except)
  const cells = absCells(d, x, y)
  return inBoard(cells) && cells.every(([a, b]) => !m.has(a + ',' + b))
}
/** 칸 목록 → SVG 경로: o = 외곽선, f = 칸 채우기 rect들 */
export function edges(cells: Cell[], c: number) {
  const set = new Set(cells.map(p => p[0] + ',' + p[1]))
  let o = '', f = ''
  for (const [x, y] of cells) {
    const X = x * c, Y = y * c
    f += `<rect x="${X}" y="${Y}" width="${c}" height="${c}"/>`
    if (!set.has(x + ',' + (y - 1))) o += `M${X} ${Y + .5}H${X + c}`
    if (!set.has(x + ',' + (y + 1))) o += `M${X} ${Y + c - .5}H${X + c}`
    if (!set.has((x - 1) + ',' + y)) o += `M${X + .5} ${Y}V${Y + c}`
    if (!set.has((x + 1) + ',' + y)) o += `M${X + c - .5} ${Y}V${Y + c}`
  }
  return { o, f }
}
/** 트레이 조각을 탭했을 때 놓을 자리(본문 크기): 기준선 행(4)에서 기존 조각 오른쪽의 빈자리, 없으면 아무 빈자리 */
export function autoPlace(pieces: PieceDef[], place: Placement, d: PieceDef): Slot | null {
  const y0 = Math.max(0, Math.min(ROWS - d.h, 4 - d.axis))
  let start = 1
  for (const q of pieces) if (place[q.id]) start = Math.max(start, place[q.id][0] + q.w)
  for (let x = start; x + d.w <= COLS; x++) if (canPlace(pieces, place, d, x, y0, d.id)) return [x, y0]
  for (let y = 0; y + d.h <= ROWS; y++) for (let x = 0; x + d.w <= COLS; x++) if (canPlace(pieces, place, d, x, y, d.id)) return [x, y]
  return null
}
/** 판 위 조각 → 파서 입력 (def는 자리의 크기를 반영) */
export function placedList(pieces: PieceDef[], place: Placement): Placed[] {
  return pieces.filter(d => place[d.id]).map(d => {
    const [x, y] = place[d.id], s = slotDef(d, place[d.id])
    return { def: s, left: x, right: x + s.w - 1, top: y, bottom: y + s.h - 1, ax: y + s.axis, area: cellsOf(s).length }
  })
}
