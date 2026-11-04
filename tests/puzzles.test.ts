import { expect, test } from 'vitest'
import { checkLevel } from '../src/data/check'
import { LEVELS } from '../src/data/levels'
import { parseLevel } from '../src/data/schema'

test.each(LEVELS.map((L, k) => [k + 1, L] as const))('레벨 %i: 정답 배치가 유효하고 목표값이 나온다', (_, L) => {
  expect(checkLevel(L)).toEqual([])
})

test('스키마: 알 수 없는 조각 종류를 거부한다', () => {
  expect(() => parseLevel({ title: 't', goal: { tex: '1', value: 1 }, notes: [], pieces: [{ type: 'foo', id: 'a' }], sol: { a: [0, 0] } })).toThrow()
})

test('스키마: 정답 배치에 빠진 조각을 거부한다', () => {
  expect(() => parseLevel({ title: 't', goal: { tex: '1', value: 1 }, notes: [], pieces: [{ type: 'num', id: 'a', v: 1 }, { type: 'num', id: 'b', v: 2 }], sol: { a: [0, 0] } })).toThrow(/정답 배치의 id/)
})

test('검사: 겹치는 정답 배치를 잡아낸다', () => {
  const L = { ...LEVELS[0], sol: { ...LEVELS[0].sol, c: LEVELS[0].sol.a } }
  expect(checkLevel(L)[0]).toMatch(/조각 c/)
})

test('검사: 목표값과 다른 정답 배치를 잡아낸다', () => {
  const L = { ...LEVELS[0], goal: { tex: '8', value: 8 } }
  expect(checkLevel(L)[0]).toMatch(/목표 8/)
})
