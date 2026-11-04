import { useStore } from 'zustand'
import { LEVELS } from '../data/levels'
import { webStorage } from '../platform/web'
import { createGameStore, type GameStore } from '../state/store'

export { LEVELS }
export const gameStore = createGameStore(LEVELS, webStorage)
export const useGame = <T,>(selector: (s: GameStore) => T) => useStore(gameStore, selector)
