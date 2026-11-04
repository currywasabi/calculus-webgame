// @vitest-environment jsdom
// 브라우저 확인 전의 연기 테스트: 화면이 그려지고, 조작과 풀이 흐름이 끝까지 도는지
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { gameStore, LEVELS } from '../src/ui/game'
import { PuzzleScreen } from '../src/ui/puzzle/PuzzleScreen'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root, host: HTMLDivElement
const $ = (sel: string) => host.querySelector(sel)
const $$ = (sel: string) => [...host.querySelectorAll(sel)]
const button = (text: string) => $$('button').find(b => b.textContent === text) as HTMLButtonElement
const run = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })

beforeAll(() => {
  vi.useFakeTimers()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<PuzzleScreen />))
})
afterAll(() => { act(() => root.unmount()); vi.useRealTimers() })

describe('화면', () => {
  test('레벨 1이 그려진다', () => {
    expect($('.sec')!.textContent).toBe('§1덧셈')
    expect($$('.lv button')).toHaveLength(8)
    expect($$('.tray .piece')).toHaveLength(3)
    expect($$('.layer .piece')).toHaveLength(0)
    expect($('.goal-tex mjx-container svg')).not.toBeNull()
  })

  test('수식이 두 번 들어가지 않는다 (보조 MathML 없음)', () => {
    expect(document.querySelector('mjx-assistive-mml')).toBeNull()
    for (const lab of $$('.lab')) expect(lab.querySelectorAll('mjx-container')).toHaveLength(1)
  })

  test('트레이 조각을 탭하면 판 위로 간다', () => {
    const p = $('.tray .piece')!
    act(() => {
      p.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }))
      window.dispatchEvent(new MouseEvent('pointerup', { clientX: 10, clientY: 10 }))
    })
    expect($$('.layer .piece')).toHaveLength(1)
    expect($$('.tray .piece')).toHaveLength(2)
  })

  test('조각이 남았으면 = 에서 메시지', () => {
    act(() => button('=').click())
    expect($('.msg')!.textContent).toBe('조각이 남았다.')
  })

  test('정답 배치 → 풀이 → ∎ → 다음 문제', async () => {
    act(() => gameStore.getState().loadLevel(0, LEVELS[0].sol))
    act(() => button('=').click())
    expect($('.deriv')).not.toBeNull()
    expect($$('.layer .piece.melt')).toHaveLength(3)
    await run(10_000)
    expect($$('.ln').map(l => l.querySelector('mjx-container') !== null)).toEqual([true, true])
    expect($('.qed')!.textContent).toBe('∎')
    expect($('.lv button')!.className).toBe('done')
    expect(JSON.parse(localStorage.getItem('proof-pieces-solved')!)).toEqual([0])
    act(() => button('다음 문제').click())
    expect($('.sec')!.textContent).toBe('§2우선순위')
    expect($('.deriv')).toBeNull()
  })

  test('풀이 중 탭하면 애니메이션을 건너뛴다', async () => {
    act(() => gameStore.getState().loadLevel(5, LEVELS[5].sol))
    act(() => button('=').click())
    act(() => ($('.deriv') as HTMLElement).click())
    await run(0)
    expect($$('.ln')).toHaveLength(3) // 4줄 중 최근 3줄
    expect($$('.ln.old')).toHaveLength(2)
    expect($('.dctl')!.hasAttribute('hidden')).toBe(false)
  })

  test('오답이면 ≠ 목표, 다시 누르면 판으로', async () => {
    act(() => gameStore.getState().loadLevel(3, { a: [4, 5], b: [4, 4], c: [4, 1], d: [6, 4], f: [7, 3] }))
    act(() => button('=').click())
    await run(10_000)
    expect($('.qed')).toBeNull()
    act(() => button('다시').click())
    expect($('.deriv')).toBeNull()
    expect($$('.layer .piece.melt')).toHaveLength(0)
  })

  test('줄이 맞지 않으면 조각을 1.8초 동안 반전한다', async () => {
    act(() => gameStore.getState().loadLevel(2, { a: [3, 3], b: [5, 2], c: [7, 4], d: [8, 3] }))
    act(() => button('=').click())
    expect($('.msg')!.textContent).toBe('줄이 맞지 않는 조각이 있다.')
    expect($$('.piece.bad').map(p => p.getAttribute('data-id'))).toEqual(['b'])
    await run(1800)
    expect($$('.piece.bad')).toHaveLength(0)
  })

  test('힌트: 윤곽 → 조각 하나', () => {
    act(() => gameStore.getState().loadLevel(0))
    act(() => button('힌트').click())
    expect($('.sil')!.innerHTML).toContain('<path')
    act(() => button('힌트').click())
    expect($$('.layer .piece.flash')).toHaveLength(1)
  })
})
