import { createStore } from 'zustand/vanilla'
import type { Navigation } from '../platform/navigation'

/**
 * 게임의 최상위 화면. 새 화면(레벨 선택, 필드 탐험 등)은 여기와 ui/scenes의 레지스트리에 추가한다.
 * route는 URL 해시에 쓰이는 경로다.
 */
export const SCENES = {
  intro: { route: '' },
  puzzle: { route: 'play' },
} as const satisfies Record<string, { route: string }>

export type SceneId = keyof typeof SCENES

const fromRoute = (route: string): SceneId =>
  (Object.keys(SCENES) as SceneId[]).find(id => SCENES[id].route === route) ?? 'intro'

export type SceneStore = {
  scene: SceneId
  go(id: SceneId): void
}

export function createSceneStore(nav: Navigation) {
  const store = createStore<SceneStore>()((set, get) => ({
    scene: fromRoute(nav.current()),
    go(id) {
      if (get().scene === id) return
      nav.push(SCENES[id].route)
      set({ scene: id })
    },
  }))
  nav.subscribe(route => store.setState({ scene: fromRoute(route) }))
  return store
}
