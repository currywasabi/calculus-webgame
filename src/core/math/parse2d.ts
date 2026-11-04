/* ---------- spatial parser: placed pieces → expression tree ---------- */
import type { Node } from './ast'
import type { PieceDef } from '../puzzle/pieces'

/** 판 위에 놓인 조각. 파서가 num/den/inner/sup/sub를 채워 넣는다. */
export type Placed = {
  def: PieceDef
  left: number
  right: number
  top: number
  bottom: number
  /** 판 위 기준선 행 */
  ax: number
  area: number
  num?: Placed[]
  den?: Placed[]
  inner?: Placed[]
  sup?: Placed[]
  sub?: Placed[]
}

export type ParseError = { msg: string; ids: string[] }
export type ParseCtx = { intDepth: number }

const E = (msg: string, ids: string[] = []): ParseError => ({ msg, ids })
export const isParseError = (e: unknown): e is ParseError => typeof e === 'object' && e !== null && 'msg' in e && 'ids' in e

const MIS = '줄이 맞지 않는 조각이 있다.'
const ATOM = new Set(['num', 'const', 'lp', 'gamma', 'frac', 'sqrt', 'int', 'inf', 'negsq'])
const isStruct = (p: Placed) => p.def.kind === 'frac' || p.def.kind === 'sqrt' || p.def.kind === 'int'

/** 실패하면 ParseError를 던진다. */
export function parseRegion(list: Placed[], ctx: ParseCtx, owner?: string): Node {
  if (!list.length) throw E('식이 완성되지 않았다.', owner ? [owner] : [])
  const claimed = new Set<Placed>()
  const structs = list.filter(p => p.def.kind === 'frac' || p.def.kind === 'sqrt').sort((a, b) => b.area - a.area)
  for (const s of structs) {
    if (claimed.has(s)) continue
    const free = (p: Placed) => p !== s && !claimed.has(p)
    if (s.def.kind === 'frac') {
      s.num = list.filter(p => free(p) && p.left >= s.left && p.right <= s.right && p.bottom < s.top)
      s.den = list.filter(p => free(p) && p.left >= s.left && p.right <= s.right && p.top > s.bottom);
      [...s.num, ...s.den].forEach(p => claimed.add(p))
    } else {
      s.inner = list.filter(p => free(p) && p.left > s.left && p.right <= s.right && p.top > s.top && p.bottom <= s.bottom)
      s.inner.forEach(p => claimed.add(p))
    }
  }
  const U = list.filter(p => !claimed.has(p))
  const minL = Math.min(...U.map(p => p.left))
  const lead = U.filter(p => p.left === minL).sort((a, b) => (Number(isStruct(b)) - Number(isStruct(a))) || (b.def.h - a.def.h))
  const A = lead[0].ax
  const anchors = U.filter(p => p.ax === A).sort((a, b) => a.left - b.left)
  anchors.forEach(a => { a.sup = []; a.sub = [] })
  for (const o of U) {
    if (o.ax === A) continue
    let base: Placed | null = null
    for (const a of anchors) if (a.right < o.left && (!base || a.right > base.right)) base = a
    if (!base) throw E(MIS, [o.def.id])
    if (o.bottom <= base.top) base.sup!.push(o)
    else if (o.top >= base.bottom) base.sub!.push(o)
    else throw E(MIS, [o.def.id])
  }

  // 여기부터 T의 원소는 모두 앵커라 sup/sub가 채워져 있다.
  let i = 0
  const T = anchors, peek = (): Placed | undefined => T[i], K = (t: Placed | undefined) => t && t.def.kind
  const noScripts = (t: Placed) => { const s = [...t.sup!, ...t.sub!]; if (s.length) throw E(MIS, s.map(p => p.def.id)) }
  const withSup = (t: Placed, node: Node): Node => {
    if (t.sub!.length) throw E(MIS, t.sub!.map(p => p.def.id))
    return t.sup!.length ? { t: 'pow', b: node, e: parseRegion(t.sup!, ctx) } : node
  }
  function primary(): Node {
    const t = peek()
    if (!t) throw E('식이 완성되지 않았다.', T.length ? [T[T.length - 1].def.id] : [])
    const d = t.def
    switch (d.kind) {
      case 'num': i++; return withSup(t, { t: 'num', v: d.v })
      case 'const': i++; return withSup(t, { t: 'const', c: d.c })
      case 'inf': i++; noScripts(t); return { t: 'inf', sign: d.sign }
      case 'negsq': i++; if (!ctx.intDepth) throw E('x가 적분 밖에 있다.', [d.id]); return withSup(t, { t: 'negsq' })
      case 'frac': {
        i++
        if (!t.num!.length || !t.den!.length) throw E('분수가 비어 있다.', [d.id])
        const node: Node = { t: 'div', a: parseRegion(t.num!, ctx), b: parseRegion(t.den!, ctx) }
        return t.sup!.length ? withSup(t, { t: 'group', a: node }) : (noScripts(t), node)
      }
      case 'sqrt':
        i++
        if (!t.inner!.length) throw E('근호가 비어 있다.', [d.id])
        return withSup(t, { t: 'sqrt', a: parseRegion(t.inner!, ctx) })
      case 'lp': {
        i++; noScripts(t)
        const inner = expr(), r = peek()
        if (!r || K(r) !== 'rp') throw E('괄호가 닫히지 않았다.', [d.id])
        i++; return withSup(r, { t: 'group', a: inner })
      }
      case 'gamma':
        i++; noScripts(t)
        if (!peek() || !ATOM.has(K(peek())!)) throw E('Γ 뒤에 올 것이 없다.', [d.id])
        return { t: 'gamma', a: primary() }
      case 'int': {
        i++
        if (!t.sup!.length || !t.sub!.length) throw E('적분 구간이 없다.', [d.id])
        const hi = parseRegion(t.sup!, ctx), lo = parseRegion(t.sub!, ctx)
        ctx.intDepth++
        const body = expr()
        ctx.intDepth--
        const r = peek()
        if (!r || K(r) !== 'dx') throw E('dx가 없다.', [d.id])
        noScripts(r); i++
        return { t: 'int', lo, hi, body }
      }
      case 'dx': throw E('∫ 없이 dx가 있다.', [d.id])
      default: throw E('식이 완성되지 않았다.', [d.id])
    }
  }
  function unary(): Node {
    const t = peek()
    if (t && t.def.kind === 'op' && t.def.op === '−') { noScripts(t); i++; return { t: 'neg', a: unary() } }
    return primary()
  }
  function term(): Node {
    let n = unary()
    for (;;) {
      const t = peek(); if (!t) break
      if (t.def.kind === 'op' && t.def.op === '×') { noScripts(t); i++; n = { t: 'bin', op: '×', a: n, b: unary() }; continue }
      if (ATOM.has(K(t)!)) { n = { t: 'bin', op: 'imp', a: n, b: primary() }; continue }
      break
    }
    return n
  }
  function expr(): Node {
    let n = term()
    for (;;) {
      const t = peek()
      if (t && t.def.kind === 'op' && (t.def.op === '+' || t.def.op === '−')) { noScripts(t); i++; n = { t: 'bin', op: t.def.op, a: n, b: term() }; continue }
      break
    }
    return n
  }
  const res = expr()
  if (i < T.length) {
    const t = T[i]
    throw E(t.def.kind === 'dx' ? '∫ 없이 dx가 있다.' : '식이 완성되지 않았다.', [t.def.id])
  }
  return res
}
