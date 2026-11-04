import type { SaveStorage } from './storage'

const KEY = 'proof-pieces-solved'

export const webStorage: SaveStorage = {
  loadSolved() {
    try {
      const s: unknown = JSON.parse(localStorage.getItem(KEY) || '[]')
      return Array.isArray(s) ? s.filter(Number.isInteger) : []
    } catch { return [] }
  },
  saveSolved(solved) {
    try { localStorage.setItem(KEY, JSON.stringify(solved)) } catch { /* 무시 */ }
  },
}
