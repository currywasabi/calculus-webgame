/* ---------- rewrite engine: step-by-step solution trace ---------- */
import { isNum, type BinOp, type ConstName, type Lit, type Node, type NumNode } from './ast'
import { factN } from './complex'
import { tx } from './latex'

/** 정의되지 않는 연산(0으로 나누기, Γ(0) 등)에서 던진다. */
export type Undef = { undef: true }

export const num = (v: number): NumNode => ({ t: 'num', v })
export const isLit = (n: Node): n is Lit => isNum(n) || (n.t === 'div' && isNum(n.a) && isNum(n.b) && n.b.v !== 0)
export const rat = (n: Lit): [number, number] => isNum(n) ? [n.v, 1] : [n.a.v, n.b.v]
const gcd = (a: number, b: number) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1 }
export function mk(p: number, q: number): Lit {
  if (q === 0) throw { undef: true } satisfies Undef
  if (q < 0) { p = -p; q = -q }
  const g = gcd(p, q); p /= g; q /= g
  return q === 1 ? num(p) : { t: 'div', a: num(p), b: num(q) }
}
function arith(op: BinOp, x: Lit, y: Lit) {
  const [a, b] = rat(x), [c, d] = rat(y)
  if (op === '+') return mk(a * d + c * b, b * d)
  if (op === '−') return mk(a * d - c * b, b * d)
  return mk(a * c, b * d)
}
const isConst = (n: Node, c: ConstName) => n.t === 'const' && n.c === c
const isIPi = (n: Node) => n.t === 'bin' && (n.op === 'imp' || n.op === '×') && ((isConst(n.a, 'i') && isConst(n.b, 'π')) || (isConst(n.a, 'π') && isConst(n.b, 'i')))
const isGaussBody = (n: Node) => n.t === 'pow' && isConst(n.b, 'e') && n.e.t === 'negsq'
const perfect = (v: number) => { if (v < 0) return null; const r = Math.round(Math.sqrt(v)); return r * r === v ? r : null }

/** 노드 하나에 맞는 규칙을 적용한다. 결과는 그 노드의 연속 상태 배열이다. */
export function rule(n: Node): Node[] | null {
  switch (n.t) {
    case 'group':
      if (isLit(n.a) || n.a.t === 'const' || n.a.t === 'sqrt' || n.a.t === 'fact' || n.a.t === 'gamma') return [n.a]
      return null
    case 'div':
      if (isNum(n.a) && isNum(n.b)) {
        const r = mk(n.a.v, n.b.v)
        if (isNum(r) || r.a.v !== n.a.v || r.b.v !== n.b.v) return [r]
      }
      return null
    case 'bin':
      if (isLit(n.a) && isLit(n.b)) return [arith(n.op, n.a, n.b)]
      return null
    case 'neg':
      if (isLit(n.a)) { const [p, q] = rat(n.a); return [mk(-p, q)] }
      return null
    case 'pow': {
      if (isConst(n.b, 'e') && isIPi(n.e)) return [num(-1)]
      if (isConst(n.b, 'i') && isNum(n.e)) {
        const k = ((n.e.v % 4) + 4) % 4
        return [([num(1), { t: 'const', c: 'i' }, num(-1), { t: 'neg', a: { t: 'const', c: 'i' } }] satisfies Node[])[k]]
      }
      if (isLit(n.b) && isNum(n.e) && Math.abs(n.e.v) <= 40) {
        let [p, q] = rat(n.b), k = n.e.v
        if (k < 0) { [p, q] = [q, p]; k = -k }
        const P = p ** k, Q = q ** k
        if (Math.abs(P) > 1e15 || Q > 1e15) return null
        return [mk(P, Q)]
      }
      return null
    }
    case 'sqrt':
      if (isNum(n.a)) { const r = perfect(n.a.v); if (r !== null) return [num(r)] }
      if (n.a.t === 'div' && isLit(n.a)) { const p = perfect(n.a.a.v), q = perfect(n.a.b.v); if (p !== null && q !== null) return [mk(p, q)] }
      return null
    case 'gamma':
      if (isNum(n.a)) { if (n.a.v <= 0) throw { undef: true } satisfies Undef; return [{ t: 'fact', a: num(n.a.v - 1) }] }
      return null
    case 'fact':
      if (isNum(n.a) && n.a.v >= 0 && n.a.v <= 20) return [num(factN(n.a.v))]
      return null
    case 'int':
      if (n.lo.t === 'inf' && n.hi.t === 'inf') {
        if (n.lo.sign === n.hi.sign) return [num(0)]
        if (n.lo.sign > 0) return [{ t: 'neg', a: Object.assign({}, n, { lo: n.hi, hi: n.lo }) }]
        if (isGaussBody(n.body)) return [
          { t: 'raw', tex: '\\sqrt{\\int_{-\\infty}^{\\infty}\\!\\int_{-\\infty}^{\\infty} e^{-(x^{2}+y^{2})}\\,dx\\,dy}' },
          { t: 'raw', tex: '\\sqrt{\\int_{0}^{2\\pi}\\!\\int_{0}^{\\infty} e^{-r^{2}}\\,r\\,dr\\,d\\theta}' },
          { t: 'raw', tex: '\\sqrt{2\\pi\\cdot\\tfrac{1}{2}}' },
          { t: 'sqrt', a: { t: 'const', c: 'π' } },
        ]
      }
      return null
  }
  return null
}
const KIDS: Partial<Record<Node['t'], readonly string[]>> = { bin: ['a', 'b'], div: ['a', 'b'], neg: ['a'], group: ['a'], sqrt: ['a'], gamma: ['a'], fact: ['a'], pow: ['b', 'e'], int: ['lo', 'hi', 'body'] }
/** 왼쪽부터, 자식부터(후위 순회) 규칙이 맞는 첫 노드 하나를 바꾼다. */
export function step(n: Node): Node[] | null {
  for (const k of KIDS[n.t] || []) {
    const r = step((n as unknown as Record<string, Node>)[k])
    if (r) return r.map(c => Object.assign({}, n, { [k]: c }))
  }
  return rule(n)
}
/** 닫힌 형태인지 */
export function nice(n: Node): boolean {
  return isLit(n) || n.t === 'const' || ((n.t === 'sqrt' || n.t === 'neg' || n.t === 'group') && nice(n.a)) || (n.t === 'pow' && nice(n.b) && nice(n.e))
}
export type Trace = { lines: string[]; final: Node; err: unknown }
export function trace(ast: Node): Trace {
  const lines = [tx(ast)]
  let cur = ast, err: unknown = null
  try {
    for (let g = 0; g < 40; g++) {
      const r = step(cur)
      if (!r) break
      for (const s of r) { const t = tx(s); if (t !== lines[lines.length - 1]) lines.push(t) }
      cur = r[r.length - 1]
    }
  } catch (e) { err = e }
  return { lines, final: cur, err }
}
