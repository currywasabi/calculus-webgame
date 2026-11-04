/* ---------- evaluate (원본 solve의 순수 부분) ---------- */
import { C, type Complex } from '../math/complex'
import { close, N } from '../math/evaluate'
import { fmt } from '../math/latex'
import { isParseError, parseRegion } from '../math/parse2d'
import { nice, trace } from '../math/rewrite'
import { placedList, type Placement } from './geometry'
import type { Level } from './pieces'

/** 풀이 오버레이의 한 줄: 수식 또는 문장 */
export type DerivLine = { tex: string } | { text: string }

export type SolveResult =
  /** 판이 비었거나 조각이 남음. shake면 트레이를 흔든다. */
  | { kind: 'msg'; msg: string; shake?: boolean }
  /** 파싱 실패. ids의 조각을 색 반전으로 표시한다. */
  | { kind: 'error'; msg: string; ids: string[] }
  | { kind: 'derivation'; lines: DerivLine[]; ok: boolean }

export function solve(L: Level, place: Placement): SolveResult {
  const list = placedList(L.pieces, place)
  if (!list.length) return { kind: 'msg', msg: '판이 비어 있다.' }
  if (list.length < L.pieces.length) return { kind: 'msg', msg: '조각이 남았다.', shake: true }
  let ast
  try { ast = parseRegion(list, { intDepth: 0 }) }
  catch (err) { return { kind: 'error', msg: isParseError(err) ? err.msg : '식이 완성되지 않았다.', ids: isParseError(err) ? err.ids : [] } }

  const goal = C(L.goal.value)
  let val: Complex | null = null, reason = ''
  try { val = N(ast, {}); if (!isFinite(val.re) || !isFinite(val.im)) { val = null; reason = '정의되지 않는다.' } }
  catch (e) { reason = e && typeof e === 'object' && 'diverge' in e ? '발산한다.' : '정의되지 않는다.' }
  const tr = trace(ast)
  const lines: DerivLine[] = tr.lines.map((t, k) => ({ tex: k ? '=' + t : t }))
  if (tr.err) lines.push({ text: '정의되지 않는다.' })
  else if (!nice(tr.final)) lines.push(val ? { tex: '\\approx ' + fmt(val) } : { text: reason })
  const ok = !!val && close(val, goal)
  const last = lines[lines.length - 1]
  if (!ok && 'tex' in last) last.tex += '\\;\\neq\\;' + L.goal.tex
  return { kind: 'derivation', lines, ok }
}
