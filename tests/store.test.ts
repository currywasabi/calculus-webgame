import { afterEach, describe, expect, test, vi } from 'vitest'
import { LEVELS } from '../src/data/levels'
import { memoryStorage } from '../src/platform/storage'
import { webStorage } from '../src/platform/web'
import { createGameStore } from '../src/state/store'

const make = (solved: number[] = []) => {
  const storage = memoryStorage(solved)
  const store = createGameStore(LEVELS, storage)
  return { store, storage, s: () => store.getState() }
}

describe('레벨 로드', () => {
  test('저장된 클리어 기록을 읽는다', () => {
    expect([...make([0, 3]).s().solved]).toEqual([0, 3])
  })

  test('배치·힌트·메시지를 초기화하고 트레이 순서를 섞는다', () => {
    const { s } = make()
    s().tapPiece('a'); s().requestHint(); s().setMsg('x')
    s().loadLevel(4)
    expect(s()).toMatchObject({ li: 4, place: {}, hint: 0, msg: '', busy: false, derivation: null })
    expect([...s().order].sort()).toEqual(LEVELS[4].pieces.map(d => d.id).sort())
  })

  test('배치를 넘겨 받을 수 있다', () => {
    const { s } = make()
    s().loadLevel(1, LEVELS[1].sol)
    expect(s().place).toEqual(LEVELS[1].sol)
  })
})

describe('배치', () => {
  test('트레이 조각을 탭하면 기준선 행의 빈자리에 놓인다', () => {
    const { s } = make()
    s().tapPiece('a') // 숫자: axis 1 → y = 3
    s().tapPiece('b') // 연산자: axis 0 → y = 4, a 오른쪽
    expect(s().place).toEqual({ a: [1, 3], b: [3, 4] })
  })

  test('판 위 조각을 탭하면 트레이로 돌아간다', () => {
    const { s } = make()
    s().tapPiece('a'); s().tapPiece('a')
    expect(s().place).toEqual({})
  })

  test('드래그: 유효한 자리 / 판 밖 / 판 안의 잘못된 자리', () => {
    const { s } = make()
    s().dropPiece('a', { plan: { slot: [5, 2] }, over: true })
    expect(s().place.a).toEqual([5, 2])
    s().dropPiece('a', { plan: null, over: true })
    expect(s().place.a).toEqual([5, 2])
    s().dropPiece('a', { plan: null, over: false })
    expect(s().place.a).toBeUndefined()
  })

  test('드래그: 자리 맞바꾸기는 밀려난 조각을 옮기고 미끄러짐 신호를 낸다', () => {
    const { s } = make()
    s().loadLevel(0, { a: [1, 3], c: [5, 3] })
    s().dropPiece('a', { plan: { slot: [5, 3], swap: { id: 'c', slot: [1, 3] } }, over: true })
    expect(s().place).toEqual({ a: [5, 3], c: [1, 3] })
    expect(s().slide).toEqual({ id: 'c', n: 1 })
    // 트레이에서 온 조각과 맞바꾸면 밀려난 조각은 트레이로 (미끄러짐 없음)
    s().dropPiece('b', { plan: { slot: [5, 3], swap: { id: 'a', slot: null } }, over: true })
    expect(s().place).toEqual({ b: [5, 3], c: [1, 3] })
    expect(s().slide).toEqual({ id: 'c', n: 1 })
  })

  test('초기화는 배치와 힌트를 지운다', () => {
    const { s } = make()
    s().tapPiece('a'); s().requestHint()
    s().reset()
    expect(s()).toMatchObject({ place: {}, hint: 0 })
  })
})

describe('힌트', () => {
  test('첫 번째는 윤곽만, 이후에는 조각을 하나씩 놓는다', () => {
    const { s } = make()
    s().requestHint()
    expect(s()).toMatchObject({ hint: 1, place: {} })
    s().requestHint()
    expect(s().hint).toBe(2)
    expect(s().place).toEqual({ a: LEVELS[0].sol.a })
    expect(s().flash).toEqual({ id: 'a', n: 1 })
  })

  test('다 놓이면 메시지', () => {
    const { s } = make()
    s().loadLevel(0, LEVELS[0].sol)
    s().requestHint(); s().requestHint()
    expect(s().msg).toBe('이미 맞게 놓여 있다.')
  })
})

describe('계산', () => {
  test('빈 판 / 조각이 남음', () => {
    const { s } = make()
    s().solve()
    expect(s().msg).toBe('판이 비어 있다.')
    s().tapPiece('a'); s().solve()
    expect(s()).toMatchObject({ msg: '조각이 남았다.', shake: 1 })
  })

  test('파싱 에러는 메시지와 조각 표시', () => {
    const { s } = make()
    s().loadLevel(2, { a: [3, 3], b: [5, 2], c: [7, 4], d: [8, 3] })
    s().solve()
    expect(s()).toMatchObject({ msg: '줄이 맞지 않는 조각이 있다.', bad: { ids: ['b'], n: 1 }, busy: false })
  })

  test('정답: 풀이가 뜨고, 끝나면 클리어가 저장된다', () => {
    const { s, storage } = make()
    s().loadLevel(2, LEVELS[2].sol)
    s().solve()
    expect(s()).toMatchObject({ busy: true, derivation: { ok: true, lines: [{ tex: '{5}^{2}+1' }, { tex: '=25+1' }, { tex: '=26' }] } })
    s().tapPiece('a'); s().reset()
    expect(s().place).toEqual(LEVELS[2].sol) // 풀이 중에는 조작 불가
    s().finishDerivation()
    expect(storage.data).toEqual([2])
    s().closeDerivation()
    expect(s()).toMatchObject({ li: 3, busy: false, derivation: null })
  })

  test('마지막 레벨을 풀면 처음으로', () => {
    const { s } = make()
    s().loadLevel(7, LEVELS[7].sol)
    s().solve(); s().finishDerivation(); s().closeDerivation()
    expect(s().li).toBe(0)
  })

  test('오답: 마지막 줄에 ≠ 목표, 닫으면 판으로 돌아간다', () => {
    const { s, storage } = make()
    s().loadLevel(3, { a: [4, 5], b: [4, 4], c: [4, 1], d: [6, 4], f: [7, 3] })
    s().solve()
    expect(s().derivation).toEqual({ ok: false, lines: [{ tex: '\\frac{2}{6}+1' }, { tex: '=\\frac{1}{3}+1' }, { tex: '=\\frac{4}{3}\\;\\neq\\;4' }] })
    s().finishDerivation()
    expect(storage.data).toEqual([])
    s().closeDerivation()
    expect(s()).toMatchObject({ li: 3, busy: false, derivation: null })
    expect(s().place.a).toEqual([4, 5])
  })

  test('닫힌 형태가 아니면 ≈ 수치값 줄', () => {
    const { s } = make()
    s().loadLevel(6, { a: [2, 3], b: [4, 1], c: [6, 3], d: [8, 4], f: [9, 3] })
    s().solve()
    expect(s().derivation!.lines.at(-1)).toEqual({ tex: '\\approx 2.6974+2.6436i\\;\\neq\\;0' })
  })
})

describe('webStorage', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  test('키 proof-pieces-solved로 읽고 쓴다', () => {
    const m = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v) })
    webStorage.saveSolved([1, 4])
    expect(m.get('proof-pieces-solved')).toBe('[1,4]')
    expect(webStorage.loadSolved()).toEqual([1, 4])
  })

  test('읽기/쓰기 실패는 무시한다', () => {
    const boom = () => { throw new Error('denied') }
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom })
    expect(webStorage.loadSolved()).toEqual([])
    expect(() => webStorage.saveSolved([1])).not.toThrow()
  })

  test('깨진 값은 빈 기록으로 읽는다', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{oops', setItem: () => {} })
    expect(webStorage.loadSolved()).toEqual([])
  })
})
