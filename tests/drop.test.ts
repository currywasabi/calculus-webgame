import { describe, expect, test } from 'vitest'
import { applyDrop, resolveDrop, scriptRow } from '../src/core/puzzle/drop'
import type { Placement } from '../src/core/puzzle/geometry'
import { P } from '../src/core/puzzle/pieces'
import { LEVELS } from '../src/data/levels'

// 레벨 3: a=5, b=2, c=+, d=1
const L3 = LEVELS[2].pieces
const base: Placement = { a: [3, 3] } // 5: 열 3-4, 행 3-5

describe('첨자 자리 규칙', () => {
  test('밑 오른쪽 위(아랫줄 = 밑의 윗줄)면 같은 아랫줄의 첨자 크기', () => {
    expect(resolveDrop(L3, base, 'b', 5, 1)).toEqual({ slot: [5, 3, 'script'] })
  })

  test('한 줄 더 위(아랫줄 = 밑의 윗줄 - 1)도 첨자', () => {
    expect(resolveDrop(L3, base, 'b', 5, 0)).toEqual({ slot: [5, 2, 'script'] })
  })

  test('같은 높이·한 줄 위·떨어진 자리는 본문 크기', () => {
    expect(resolveDrop(L3, base, 'b', 5, 3)).toEqual({ slot: [5, 3] })
    expect(resolveDrop(L3, base, 'b', 5, 2)).toEqual({ slot: [5, 2] })
    expect(resolveDrop(L3, base, 'b', 6, 1)).toEqual({ slot: [6, 1] })
  })

  test('연산자는 첨자를 받지 않고, 첨자 크기가 없는 조각은 줄지 않는다', () => {
    expect(scriptRow(L3, { c: [3, 4] }, L3[1], 4, 2)).toBeNull()
    const pieces = [P.num('a', 2), P.gamma('g')]
    expect(scriptRow(pieces, { a: [3, 3] }, pieces[1], 5, 1)).toBeNull()
  })

  test('첨자 크기 조각 뒤에 이어 붙이면 첨자 (e^{iπ})', () => {
    const L7 = LEVELS[6].pieces
    const place: Placement = { a: [2, 3], b: [4, 3, 'script'] }
    expect(resolveDrop(L7, place, 'c', 6, 1)).toEqual({ slot: [6, 3, 'script'] })
  })

  test('-x²: 3×3이 3×1 첨자로', () => {
    const L8 = LEVELS[7].pieces
    expect(resolveDrop(L8, { d: [3, 3] }, 'f', 5, 0)).toEqual({ slot: [5, 2, 'script'] })
  })

  test('첨자 크기 조각을 첨자 자리 밖에 놓으면 본문 크기로 돌아간다', () => {
    const place: Placement = { a: [3, 3], b: [5, 3, 'script'] }
    expect(resolveDrop(L3, place, 'b', 8, 3)).toEqual({ slot: [8, 3] })
  })
})

describe('자리 맞바꾸기', () => {
  test('판 위 같은 모양끼리: 서로 자리를 바꾼다', () => {
    const place: Placement = { a: [3, 3], d: [8, 3] }
    expect(resolveDrop(L3, place, 'a', 8, 3)).toEqual({ slot: [8, 3], swap: { id: 'd', slot: [3, 3] } })
  })

  test('조금 어긋나게 겹쳐도 하나와만 겹치면 맞바꾼다', () => {
    const place: Placement = { a: [3, 3], d: [8, 3] }
    expect(resolveDrop(L3, place, 'a', 7, 4)).toEqual({ slot: [8, 3], swap: { id: 'd', slot: [3, 3] } })
  })

  test('크기는 자리를 따른다: 본문 조각을 지수 위에 놓으면 지수가 되고, 지수는 본문 크기로', () => {
    const place: Placement = { a: [3, 3], b: [5, 3, 'script'], d: [8, 3] }
    const plan = resolveDrop(L3, place, 'd', 5, 1)!
    expect(plan).toEqual({ slot: [5, 3, 'script'], swap: { id: 'b', slot: [8, 3] } })
    expect(applyDrop(place, 'd', plan)).toEqual({ a: [3, 3], d: [5, 3, 'script'], b: [8, 3] })
  })

  test('트레이에서 온 조각과 맞바꾸면 밀려난 조각은 트레이로', () => {
    const plan = resolveDrop(L3, { a: [3, 3] }, 'd', 3, 3)!
    expect(plan).toEqual({ slot: [3, 3], swap: { id: 'a', slot: null } })
    expect(applyDrop({ a: [3, 3] }, 'd', plan)).toEqual({ d: [3, 3] })
  })

  test('모양이 다르거나 둘 이상과 겹치면 놓을 수 없다', () => {
    expect(resolveDrop(L3, { a: [3, 3] }, 'c', 3, 4)).toBeNull() // + 와 5
    expect(resolveDrop(L3, { a: [3, 3], d: [5, 3] }, 'b', 4, 3)).toBeNull() // 5와 1 둘 다
  })

  test('Γ와 숫자는 둘 다 2×3이어도 첨자 크기 유무가 달라 맞바꾸지 않는다', () => {
    const pieces = [P.num('a', 2), P.gamma('g')]
    expect(resolveDrop(pieces, { a: [3, 3] }, 'g', 3, 3)).toBeNull()
  })
})
