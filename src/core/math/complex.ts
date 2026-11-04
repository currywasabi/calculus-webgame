/* ---------- complex numbers ---------- */

export type Complex = { re: number; im: number }

export const C = (re: number, im = 0): Complex => ({ re, im })
export const cadd = (a: Complex, b: Complex) => C(a.re + b.re, a.im + b.im)
export const csub = (a: Complex, b: Complex) => C(a.re - b.re, a.im - b.im)
export const cmul = (a: Complex, b: Complex) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re)
export const cdiv = (a: Complex, b: Complex) => { const d = b.re * b.re + b.im * b.im; if (d === 0) return C(NaN, NaN); return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d) }
export const cexp = (a: Complex) => { const r = Math.exp(a.re); return C(r * Math.cos(a.im), r * Math.sin(a.im)) }
export const clog = (a: Complex) => C(Math.log(Math.hypot(a.re, a.im)), Math.atan2(a.im, a.re))
export function cpow(a: Complex, b: Complex): Complex {
  if (b.im === 0 && Number.isInteger(b.re) && Math.abs(b.re) <= 4096) {
    let n = Math.abs(b.re), r = C(1), base = a
    while (n) { if (n & 1) r = cmul(r, base); base = cmul(base, base); n = Math.floor(n / 2) }
    return b.re < 0 ? cdiv(C(1), r) : r
  }
  if (a.re === 0 && a.im === 0) return b.re > 0 ? C(0) : C(NaN, NaN)
  if (a.im === 0 && a.re > 0 && b.im === 0) return C(Math.pow(a.re, b.re))
  return cexp(cmul(b, clog(a)))
}
export const realInt = (z: Complex) => Math.abs(z.im) < 1e-12 && Math.abs(z.re - Math.round(z.re)) < 1e-9 ? Math.round(z.re) : null
export const factN = (n: number) => { let r = 1; for (let k = 2; k <= n; k++) r *= k; return r }
export function gammaReal(x: number): number {
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gammaReal(1 - x))
  const g = 7, p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  x -= 1; let a = p[0]; const t = x + g + 0.5
  for (let i = 1; i < 9; i++) a += p[i] / (x + i)
  return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a
}
export function cgamma(z: Complex): Complex {
  if (Math.abs(z.im) > 1e-12) return C(NaN, NaN)
  const n = realInt(z)
  if (n !== null) return n <= 0 || n > 171 ? C(NaN, NaN) : C(factN(n - 1))
  return C(gammaReal(z.re))
}
export const cfact = (z: Complex) => { const n = realInt(z); return n === null || n < 0 || n > 170 ? C(NaN, NaN) : C(factN(n)) }
export const csqrt = (a: Complex) => (a.im === 0 && a.re >= 0) ? C(Math.sqrt(a.re)) : cpow(a, C(0.5))
