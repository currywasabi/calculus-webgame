/* ---------- geometry ---------- */
import type { Placed } from '../math/parse2d'
import type { Cell, PieceDef } from './pieces'
import { rect } from './pieces'

export const COLS = 12, ROWS = 8

/** 판 위 배치 {조각id: [x, y]} — 조각 바운딩 박스의 왼쪽 위 칸 */
export type Placement = Record<string, Cell>

export const cellsOf = (d: PieceDef) => d.cells || rect(d.w, d.h)
export const absCells = (d: PieceDef, x: number, y: number): Cell[] => cellsOf(d).map(([a, b]) => [a + x, b + y])
export function occMap(pieces: PieceDef[], place: Placement, except?: string) {
  const m = new Map<string, string>()
  for (const d of pieces) {
    if (d.id === except || !place[d.id]) continue
    const [x, y] = place[d.id]
    for (const [a, b] of absCells(d, x, y)) m.set(a + ',' + b, d.id)
  }
  return m
}
export function canPlace(pieces: PieceDef[], place: Placement, d: PieceDef, x: number, y: number, except?: string) {
  const m = occMap(pieces, place, except)
  return absCells(d, x, y).every(([a, b]) => a >= 0 && b >= 0 && a < COLS && b < ROWS && !m.has(a + ',' + b))
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
/** 트레이 조각을 탭했을 때 놓을 자리: 기준선 행(4)에서 기존 조각 오른쪽의 빈자리, 없으면 아무 빈자리 */
export function autoPlace(pieces: PieceDef[], place: Placement, d: PieceDef): Cell | null {
  const y0 = Math.max(0, Math.min(ROWS - d.h, 4 - d.axis))
  let start = 1
  for (const q of pieces) if (place[q.id]) start = Math.max(start, place[q.id][0] + q.w)
  for (let x = start; x + d.w <= COLS; x++) if (canPlace(pieces, place, d, x, y0, d.id)) return [x, y0]
  for (let y = 0; y + d.h <= ROWS; y++) for (let x = 0; x + d.w <= COLS; x++) if (canPlace(pieces, place, d, x, y, d.id)) return [x, y]
  return null
}
/** 판 위 조각 → 파서 입력 */
export function placedList(pieces: PieceDef[], place: Placement): Placed[] {
  return pieces.filter(d => place[d.id]).map(d => {
    const [x, y] = place[d.id]
    return { def: d, left: x, right: x + d.w - 1, top: y, bottom: y + d.h - 1, ax: y + d.axis, area: cellsOf(d).length }
  })
}
