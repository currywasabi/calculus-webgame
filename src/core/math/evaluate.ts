/* ---------- numeric evaluation (answer check + fallback) ---------- */
import type { IntNode, Node } from './ast'
import { C, cadd, cdiv, cfact, cgamma, cmul, cpow, csqrt, csub, type Complex } from './complex'

export type Env = { x?: number }
/** 수치 적분이 수렴하지 않을 때 던진다. */
export type Diverge = { diverge: true }

export function N(n: Node, env: Env): Complex {
  switch (n.t) {
    case 'num': return C(n.v)
    case 'const': return n.c === 'e' ? C(Math.E) : n.c === 'π' ? C(Math.PI) : C(0, 1)
    case 'inf': return C(n.sign * Infinity)
    case 'negsq': return C(-(env.x! * env.x!))
    case 'group': return N(n.a, env)
    case 'neg': { const a = N(n.a, env); return C(-a.re, -a.im) }
    case 'div': return cdiv(N(n.a, env), N(n.b, env))
    case 'bin': { const a = N(n.a, env), b = N(n.b, env); return n.op === '+' ? cadd(a, b) : n.op === '−' ? csub(a, b) : cmul(a, b) }
    case 'pow': return cpow(N(n.b, env), N(n.e, env))
    case 'sqrt': return csqrt(N(n.a, env))
    case 'gamma': return cgamma(N(n.a, env))
    case 'fact': return cfact(N(n.a, env))
    case 'int': return quad(n, env)
  }
  return C(NaN, NaN)
}
export function quad(n: IntNode, env: Env): Complex {
  const lo = N(n.lo, env).re, hi = N(n.hi, env).re
  if (lo === hi) return C(0)
  if (lo > hi) { const r = quadR(n, hi, lo, env); return C(-r.re, -r.im) }
  return quadR(n, lo, hi, env)
}
export function quadR(n: IntNode, a: number, b: number, env: Env): Complex {
  const f = (x: number) => N(n.body, Object.assign({}, env, { x }))
  let map: (t: number) => [number, number], ta = 0, tb = 1
  if (a === -Infinity && b === Infinity) { map = t => [t / (1 - t * t), (1 + t * t) / ((1 - t * t) ** 2)]; ta = -1 }
  else if (b === Infinity) map = t => [a + t / (1 - t), 1 / ((1 - t) ** 2)]
  else if (a === -Infinity) map = t => [b - t / (1 - t), 1 / ((1 - t) ** 2)]
  else { map = t => [t, 1]; ta = a; tb = b }
  const run = (M: number) => {
    let re = 0, im = 0; const h = (tb - ta) / M
    for (let k = 0; k < M; k++) {
      const [x, w] = map(ta + (k + 0.5) * h)
      if (!isFinite(x) || !isFinite(w)) continue
      const z = f(x)
      if (z.re === 0 && z.im === 0) continue
      re += z.re * w; im += z.im * w
    }
    return C(re * h, im * h)
  }
  const r1 = run(3000), r2 = run(6000)
  const ok = [r1.re, r1.im, r2.re, r2.im].every(isFinite) && Math.hypot(r1.re - r2.re, r1.im - r2.im) <= 1e-5 * Math.max(1, Math.hypot(r2.re, r2.im))
  if (!ok) throw { diverge: true } satisfies Diverge
  return r2
}
export const close = (z: Complex, g: Complex) => isFinite(z.re) && isFinite(z.im) && Math.hypot(z.re - g.re, z.im - g.im) <= 1e-7 * Math.max(1, Math.hypot(g.re, g.im))
