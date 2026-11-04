import { describe, expect, test } from 'vitest'
import { memoryNavigation } from '../src/platform/navigation'
import { createSceneStore } from '../src/state/scene'

describe('scene', () => {
  test('경로가 없으면 인트로', () => {
    expect(createSceneStore(memoryNavigation()).getState().scene).toBe('intro')
  })

  test('#/play로 들어오면 바로 퍼즐, 모르는 경로는 인트로', () => {
    expect(createSceneStore(memoryNavigation('play')).getState().scene).toBe('puzzle')
    expect(createSceneStore(memoryNavigation('nope')).getState().scene).toBe('intro')
  })

  test('go는 기록을 남기고, 뒤로 가기로 돌아온다', () => {
    const nav = memoryNavigation()
    const store = createSceneStore(nav)
    store.getState().go('puzzle')
    expect(store.getState().scene).toBe('puzzle')
    expect(nav.history).toEqual(['', 'play'])
    store.getState().go('puzzle')
    expect(nav.history).toEqual(['', 'play'])
    nav.back()
    expect(store.getState().scene).toBe('intro')
  })
})
