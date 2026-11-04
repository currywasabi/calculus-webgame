import { describe, expect, test } from 'vitest'
import type { Node } from '../src/core/math/ast'
import { C, type Complex } from '../src/core/math/complex'
import { close, N } from '../src/core/math/evaluate'
import { fmt } from '../src/core/math/latex'
import { isParseError, parseRegion, type ParseError } from '../src/core/math/parse2d'
import { nice, trace } from '../src/core/math/rewrite'
import { placedList, type Placement } from '../src/core/puzzle/geometry'
import type { Level } from '../src/core/puzzle/pieces'

type Run =
  | { error: ParseError }
  | { lines: string[]; final: Node; val: Complex; ok: boolean }

export function run(level: Level, place: Placement): Run {
  let ast
  try { ast = parseRegion(placedList(level.pieces, place), { intDepth: 0 }) }
  catch (e) { if (isParseError(e)) return { error: e }; throw e }
  const val = N(ast, {})
  const tr = trace(ast)
  return { lines: tr.lines, final: tr.final, val, ok: close(val, C(level.goal.value)) }
}

function solved(level: Level, place: Placement) {
  const r = run(level, place)
  if ('error' in r) throw new Error('parse error: ' + r.error.msg)
  return r
}

const GAUSS = [
  '\\int_{-\\infty }^{\\infty } {e}^{-x^{2}}\\,dx',
  '\\sqrt{\\int_{-\\infty}^{\\infty}\\!\\int_{-\\infty}^{\\infty} e^{-(x^{2}+y^{2})}\\,dx\\,dy}',
  '\\sqrt{\\int_{0}^{2\\pi}\\!\\int_{0}^{\\infty} e^{-r^{2}}\\,r\\,dr\\,d\\theta}',
  '\\sqrt{2\\pi\\cdot\\tfrac{1}{2}}',
  '\\sqrt{\\pi }',
]

const SOLUTION_TRACES: string[][] = [
  ['3+4', '7'],
  ['2+3\\times 4', '2+12', '14'],
  ['{5}^{2}+1', '25+1', '26'],
  ['\\frac{6}{2}+1', '3+1', '4'],
  ['\\sqrt{9+16}', '\\sqrt{25}', '5'],
  ['\\Gamma\\left(3+3\\right)', '\\Gamma\\left(6\\right)', '5!', '120'],
  ['{e}^{i\\pi }+1', '-1+1', '0'],
  GAUSS,
]

/** PORTING.md 9장 단계 2의 표 */
export function engineSuite(name: string, levels: Level[]) {
  describe(`${name}: 정답 배치`, () => {
    test('레벨은 8개', () => expect(levels).toHaveLength(8))
    SOLUTION_TRACES.forEach((lines, k) => {
      test(`레벨 ${k + 1}`, () => {
        const r = solved(levels[k], levels[k].sol)
        expect(r.ok).toBe(true)
        expect(r.lines).toEqual(lines)
      })
    })
  })

  describe(`${name}: 틀린 배치`, () => {
    test('레벨 3: 지수를 평평하게 → 11, 오답', () => {
      const r = solved(levels[2], { a: [3, 3], b: [5, 3], c: [7, 4], d: [8, 3] })
      expect(r.lines[0]).toBe('5\\cdot 2+1')
      expect(r.lines.at(-1)).toBe('11')
      expect(r.ok).toBe(false)
    })
    test('레벨 3: 줄이 맞지 않음', () => {
      expect(run(levels[2], { a: [3, 3], b: [5, 2], c: [7, 4], d: [8, 3] }))
        .toEqual({ error: { msg: '줄이 맞지 않는 조각이 있다.', ids: ['b'] } })
    })
    test('레벨 4: 분자·분모 뒤바뀜 → 4/3, 오답', () => {
      const r = solved(levels[3], { a: [4, 5], b: [4, 4], c: [4, 1], d: [6, 4], f: [7, 3] })
      expect(r.lines).toEqual(['\\frac{2}{6}+1', '\\frac{1}{3}+1', '\\frac{4}{3}'])
      expect(r.ok).toBe(false)
    })
    test('레벨 6: 식이 완성되지 않음', () => {
      expect(run(levels[5], { a: [1, 3], c: [3, 3], d: [5, 4], f: [6, 3], b: [8, 3], g: [9, 3] }))
        .toEqual({ error: { msg: '식이 완성되지 않았다.', ids: ['g'] } })
    })
    test('레벨 7: π를 평평하게 → 닫힌 형태가 아님', () => {
      const r = solved(levels[6], { a: [2, 3], b: [4, 1], c: [6, 3], d: [8, 4], f: [9, 3] })
      expect(r.lines.at(-1)).toBe('{e}^{i}\\,\\pi +1')
      expect(nice(r.final)).toBe(false)
      expect(fmt(r.val)).toBe('2.6974+2.6436i')
      expect(r.ok).toBe(false)
    })
    test('레벨 8: 구간 뒤집힘 → -√π, 오답', () => {
      const r = solved(levels[7], { a: [2, 2], b: [3, 6], c: [3, 2], d: [3, 3], f: [5, 2, 'script'], g: [7, 3] })
      expect(r.lines.at(-1)).toBe('-\\sqrt{\\pi }')
      expect(fmt(r.val)).toBe('-1.7725')
      expect(r.ok).toBe(false)
    })
    test('레벨 8: 아래끝 없음', () => {
      expect(run(levels[7], { a: [2, 2], b: [3, 2], d: [3, 3], f: [5, 2, 'script'], g: [7, 3] }))
        .toEqual({ error: { msg: '적분 구간이 없다.', ids: ['a'] } })
    })
  })
}
