// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, test } from 'vitest'
import { sceneStore } from '../src/ui/game'
import { App } from '../src/ui/App'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

test('인트로 → Start → 퍼즐, 뒤로 가기 → 인트로', () => {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(<App />))

  expect(host.querySelector('.intro-title mjx-container svg')).not.toBeNull()
  const start = host.querySelector<HTMLButtonElement>('.intro-start')!
  expect(document.activeElement).toBe(start)

  act(() => start.click())
  expect(sceneStore.getState().scene).toBe('puzzle')
  expect(location.hash).toBe('#/play')
  expect(host.querySelector('.intro')).toBeNull()
  expect(host.querySelector('.board')).not.toBeNull()

  act(() => { history.back() })
  return new Promise<void>(res => setTimeout(() => {
    expect(sceneStore.getState().scene).toBe('intro')
    act(() => root.unmount())
    res()
  }, 50))
})
