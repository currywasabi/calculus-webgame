import { describe, expect, test } from 'vitest'
import { applyDrop, resolveDrop, scriptSlot } from '../src/core/puzzle/drop'
import type { Placement } from '../src/core/puzzle/geometry'
import { inForm, P } from '../src/core/puzzle/pieces'
import { LEVELS } from '../src/data/levels'
import { run } from './engineCases'

// 레벨 3: a=5, b=2, c=+, d=1
const L3 = LEVELS[2].pieces
const base: Placement = { a: [3, 3] } // 5: 열 3-4, 행 3-5 (윗줄 3)

describe('첨자 크기 (행 × 열)', () => {
  test('단일 기호는 3×2 → 2×1', () => {
    expect(inForm(P.num('a', 7), 'script')).toMatchObject({ h: 2, w: 1 })
    expect(inForm(P.con('a', 'π'), 'script')).toMatchObject({ h: 2, w: 1 })
  })
  test('여러 기호는 비율대로: 16은 3×2 → 2×2, -x²는 3×3 → 2×2', () => {
    expect(inForm(P.num('a', 16), 'script')).toMatchObject({ h: 2, w: 2 })
    expect(inForm(P.nsq('a'), 'script')).toMatchObject({ h: 2, w: 2 })
  })
  test('첨자 크기가 없는 조각은 그대로', () => {
    expect(inForm(P.gamma('g'), 'script')).toMatchObject({ h: 3, w: 2 })
  })
})

describe('첨자 자리 규칙', () => {
  test('밑 오른쪽 위(아랫줄 = 밑의 윗줄)면 아랫줄을 유지한 첨자 크기', () => {
    expect(resolveDrop(L3, base, 'b', 5, 1)).toEqual({ slot: [5, 2, 'script'] }) // 행 2-3
  })

  test('한 줄 더 위(아랫줄 = 밑의 윗줄 - 1)도 첨자', () => {
    expect(resolveDrop(L3, base, 'b', 5, 0)).toEqual({ slot: [5, 1, 'script'] })
  })

  test('같은 높이·한 줄 위·떨어진 자리는 본문 크기', () => {
    expect(resolveDrop(L3, base, 'b', 5, 3)).toEqual({ slot: [5, 3] })
    expect(resolveDrop(L3, base, 'b', 5, 2)).toEqual({ slot: [5, 2] })
    expect(resolveDrop(L3, base, 'b', 6, 1)).toEqual({ slot: [6, 1] })
  })

  test('연산자는 첨자를 받지 않고, 첨자 크기가 없는 조각은 줄지 않는다', () => {
    expect(scriptSlot(L3, { c: [3, 4] }, L3[1], 4, 2)).toBeNull()
    const pieces = [P.num('a', 2), P.gamma('g')]
    expect(scriptSlot(pieces, { a: [3, 3] }, pieces[1], 5, 1)).toBeNull()
  })

  test('첨자 줄 잇기: 첨자 크기 조각 바로 뒤에 아랫줄을 맞추면 첨자 (e^{iπ})', () => {
    const L7 = LEVELS[6].pieces
    const place: Placement = { a: [2, 3], b: [4, 2, 'script'] } // i: 열 4, 행 2-3
    expect(resolveDrop(L7, place, 'c', 5, 1)).toEqual({ slot: [5, 2, 'script'] })
  })

  test('-x²: 3×3이 2×2 첨자로', () => {
    const L8 = LEVELS[7].pieces
    expect(resolveDrop(L8, { d: [3, 3] }, 'f', 5, 0)).toEqual({ slot: [5, 1, 'script'] }) // 열 5-6, 행 1-2
  })

  test('첨자 크기 조각을 첨자 자리 밖에 놓으면 본문 크기로 돌아간다', () => {
    const place: Placement = { a: [3, 3], b: [5, 2, 'script'] }
    expect(resolveDrop(L3, place, 'b', 8, 3)).toEqual({ slot: [8, 3] })
  })
})

describe('지수의 지수 (2단계까지)', () => {
  // 2^{3^{4}}: 2 본문, 3은 2의 지수, 4는 3의 지수
  const pieces = [P.num('a', 2), P.num('b', 3), P.num('c', 4), P.num('d', 5)]
  const place: Placement = { a: [3, 3], b: [5, 2, 'script'] } // 3: 열 5, 행 2-3 (윗줄 2)

  test('지수의 오른쪽 위에 놓으면 2단계 지수 (크기는 같음)', () => {
    expect(resolveDrop(pieces, place, 'c', 6, 0)).toEqual({ slot: [6, 1, 'script'] }) // 아랫줄 2 = 3의 윗줄
  })

  test('파서는 그대로 지수의 지수로 읽는다', () => {
    const L = { title: '', goal: { tex: '', value: 2 ** 81 }, notes: [], pieces, sol: {} }
    const r = run(L, { ...place, c: [6, 1, 'script'] })
    expect('lines' in r && r.lines[0]).toBe('{2}^{{3}^{4}}')
  })

  test('3단계는 첨자 크기가 되지 않는다', () => {
    const two: Placement = { ...place, c: [6, 1, 'script'] } // 4: 열 6, 행 1-2 (윗줄 1)
    expect(scriptSlot(pieces, two, pieces[3], 7, -1)).toBeNull()
  })

  test('2단계 지수 뒤에 이어 붙이는 것은 된다', () => {
    const two: Placement = { ...place, c: [6, 1, 'script'] }
    expect(scriptSlot(pieces, two, pieces[3], 7, 0)).toEqual([7, 1, 'script'])
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
    const place: Placement = { a: [3, 3], b: [5, 2, 'script'], d: [8, 3] }
    const plan = resolveDrop(L3, place, 'd', 5, 1)!
    expect(plan).toEqual({ slot: [5, 2, 'script'], swap: { id: 'b', slot: [8, 3] } })
    expect(applyDrop(place, 'd', plan)).toEqual({ a: [3, 3], d: [5, 2, 'script'], b: [8, 3] })
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

  test('맞바꾼 결과가 겹치면 놓을 수 없다: 넓은 16은 좁은 지수 자리에 못 들어간다', () => {
    const pieces = [P.num('a', 5), P.num('b', 3), P.num('c', 16)]
    // 3이 5의 지수(열 5), 16은 그 오른쪽 본문(열 6-7). 16을 지수 자리로 → 2×2가 열 5-6을 차지해 3의 새 자리와 겹침
    expect(resolveDrop(pieces, { a: [3, 3], b: [5, 2, 'script'], c: [6, 3] }, 'c', 5, 1)).toBeNull()
  })

  test('첨자 크기가 없는 조각은 첨자 자리와 맞바꾸지 않는다', () => {
    const pieces = [P.num('a', 5), P.num('b', 2), P.gamma('g')]
    expect(resolveDrop(pieces, { a: [3, 3], b: [5, 2, 'script'] }, 'g', 5, 1)).toBeNull()
  })
})
