import { describe, expect, test } from 'vitest'
import type { Placement } from '../src/core/puzzle/geometry'
import { hintStep } from '../src/core/puzzle/hint'
import { LEVELS } from '../src/data/levels'

/** 힌트를 끝날 때까지 반복한 배치 */
function exhaust(k: number, place: Placement = {}) {
  let p = place, steps = 0
  for (let r; (r = hintStep(LEVELS[k], p)); steps++) p = r.place
  return { place: p, steps }
}

describe('hintStep', () => {
  test('빈 판에서는 첫 조각을 정답 위치에 놓는다', () => {
    const L = LEVELS[0]
    expect(hintStep(L, {})).toEqual({ place: { a: L.sol.a }, id: 'a' })
  })

  test('입력 배치를 바꾸지 않는다', () => {
    const place = { a: [0, 0] as [number, number] }
    hintStep(LEVELS[0], place)
    expect(place).toEqual({ a: [0, 0] })
  })

  test('모두 맞게 놓여 있으면 null', () => {
    LEVELS.forEach(L => expect(hintStep(L, L.sol)).toBeNull())
  })

  test('반복하면 모든 레벨에서 조각 수만큼만 놓고 끝난다', () => {
    LEVELS.forEach((L, k) => {
      const { place, steps } = exhaust(k)
      expect(steps).toBe(L.pieces.length)
      expect(place).toEqual(L.sol)
    })
  })

  test('정답 자리를 막고 있는 조각은 트레이로 돌려보낸다', () => {
    const L = LEVELS[0]
    // c(4)를 a의 정답 자리에 둔다 → a가 그 자리를 차지하고 c는 빠진다
    const r = hintStep(L, { c: L.sol.a })!
    expect(r.id).toBe('a')
    expect(r.place).toEqual({ a: L.sol.a })
  })

  test('같은 모양·기호의 조각은 서로 바꿔 쓸 수 있다', () => {
    // 레벨 6의 c, f는 둘 다 숫자 3
    const L = LEVELS[5]
    const r = hintStep(L, { a: L.sol.a, b: L.sol.b, f: L.sol.c })!
    expect(r.id).toBe('d')
    const { place } = exhaust(5, { a: L.sol.a, b: L.sol.b, f: L.sol.c })
    expect(place.f).toEqual(L.sol.c)
    expect(place.c).toEqual(L.sol.f)
  })
})
