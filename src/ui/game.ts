import { useStore } from 'zustand'
import { LEVELS } from '../data/levels'
import { hashNavigation } from '../platform/navigation'
import { webStorage } from '../platform/web'
import { createSceneStore, type SceneStore } from '../state/scene'
import { createGameStore, type GameStore } from '../state/store'

export { LEVELS }
export const gameStore = createGameStore(LEVELS, webStorage)
export const useGame = <T,>(selector: (s: GameStore) => T) => useStore(gameStore, selector)

export const sceneStore = createSceneStore(hashNavigation())
export const useScene = <T,>(selector: (s: SceneStore) => T) => useStore(sceneStore, selector)
