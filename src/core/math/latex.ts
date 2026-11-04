/* ---------- LaTeX ---------- */
import { isNum, type Node } from './ast'
import type { Complex } from './complex'

const strip = (n: Node) => n.t === 'group' ? n.a : n
const startsDigit = (n: Node): boolean => n.t === 'num' || (n.t === 'pow' && startsDigit(n.b)) || (n.t === 'bin' && startsDigit(n.a))
export const negLit = (n: Node) => (isNum(n) && n.v < 0) || (n.t === 'div' && isNum(n.a) && n.a.v < 0) || n.t === 'neg'
const rhs = (n: Node) => negLit(n) ? '\\left(' + tx(n) + '\\right)' : tx(n)

/** 트리 → LaTeX (원본 tx) */
export function tx(n: Node): string {
  switch (n.t) {
    case 'num': return String(n.v)
    case 'const': return n.c === 'π' ? '\\pi ' : n.c
    case 'inf': return n.sign > 0 ? '\\infty ' : '-\\infty '
    case 'negsq': return '-x^{2}'
    case 'raw': return n.tex
    case 'group': return '\\left(' + tx(n.a) + '\\right)'
    case 'neg': return '-' + ((n.a.t === 'bin' && (n.a.op === '+' || n.a.op === '−')) ? '\\left(' + tx(n.a) + '\\right)' : tx(n.a))
    case 'div':
      if (isNum(n.a) && isNum(n.b) && n.a.v < 0) return '-\\frac{' + (-n.a.v) + '}{' + n.b.v + '}'
      return '\\frac{' + tx(strip(n.a)) + '}{' + tx(strip(n.b)) + '}'
    case 'bin':
      if (n.op === '+') return tx(n.a) + '+' + rhs(n.b)
      if (n.op === '−') return tx(n.a) + '-' + rhs(n.b)
      if (n.op === '×') return tx(n.a) + '\\times ' + rhs(n.b)
      if (startsDigit(n.b)) return tx(n.a) + '\\cdot ' + tx(n.b)
      return tx(n.a) + ((n.a.t === 'num' || n.a.t === 'const') && n.b.t === 'const' ? '' : '\\,') + tx(n.b)
    case 'pow': {
      const b = n.b
      const wrap = negLit(b) || b.t === 'div' || b.t === 'bin' || b.t === 'fact' || b.t === 'gamma'
      return '{' + (wrap ? '\\left(' + tx(b) + '\\right)' : tx(b)) + '}^{' + tx(n.e) + '}'
    }
    case 'sqrt': return '\\sqrt{' + tx(strip(n.a)) + '}'
    case 'gamma': return '\\Gamma' + (n.a.t === 'group' ? tx(n.a) : '\\left(' + tx(n.a) + '\\right)')
    case 'fact': return (isNum(n.a) && n.a.v >= 0) ? tx(n.a) + '!' : '\\left(' + tx(n.a) + '\\right)!'
    case 'int': return '\\int_{' + tx(n.lo) + '}^{' + tx(n.hi) + '} ' + tx(n.body) + '\\,dx'
  }
  return ''
}
export function fmt(z: Complex) {
  const r = (x: number) => { const s = x.toFixed(4).replace(/\.?0+$/, ''); return s === '-0' ? '0' : s }
  if (Math.abs(z.im) < 1e-9) return r(z.re)
  const im = Math.abs(z.im)
  return r(z.re) + (z.im < 0 ? '-' : '+') + (Math.abs(im - 1) < 1e-9 ? '' : r(im)) + 'i'
}
