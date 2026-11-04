import { createStore } from 'zustand/vanilla'
import { autoPlace, COLS, ROWS, type Placement } from '../core/puzzle/geometry'
import { hintStep } from '../core/puzzle/hint'
import type { Level } from '../core/puzzle/pieces'
import { solve, type DerivLine } from '../core/puzzle/solve'
import type { SaveStorage } from '../platform/storage'

export { COLS, ROWS }

/** 드래그를 놓은 자리 (UI의 snapAt 결과) */
export type Drop = { x: number; y: number; valid: boolean; over: boolean }

export type GameState = {
  li: number
  place: Placement
  /** 0: 힌트 없음, 1: 정답 윤곽, 2~: 조각을 놓은 횟수 + 1 */
  hint: number
  /** 트레이 조각 순서 (레벨 로드 때 섞음) */
  order: string[]
  solved: Set<number>
  /** 풀이 오버레이가 떠 있는 동안 true */
  busy: boolean
  msg: string
  derivation: { lines: DerivLine[]; ok: boolean } | null
  /** 연출 신호. n이 바뀔 때마다 한 번 재생한다. */
  bad: { ids: string[]; n: number } | null
  flash: { id: string; n: number } | null
  shake: number
}

export type GameActions = {
  loadLevel(k: number, place?: Placement): void
  /** 탭: 판 위 조각은 트레이로, 트레이 조각은 기준선 행의 빈자리로 */
  tapPiece(id: string): void
  /** 드래그 놓기: 유효하면 그 자리, 판 밖이면 트레이, 판 안의 잘못된 자리면 그대로 */
  dropPiece(id: string, drop: Drop | null): void
  reset(): void
  requestHint(): void
  setMsg(msg: string): void
  /** = 버튼 */
  solve(): void
  /** 풀이 애니메이션이 끝났을 때 */
  finishDerivation(): void
  /** 풀이 오버레이의 버튼: 성공이면 다음 문제, 실패면 판으로 돌아감 */
  closeDerivation(): void
}

export type GameStore = GameState & GameActions

export function createGameStore(levels: Level[], storage: SaveStorage, random: () => number = Math.random) {
  return createStore<GameStore>()((set, get) => {
    const lvl = () => levels[get().li]
    const shuffled = (k: number) => {
      const ids = levels[k].pieces.map(d => d.id)
      for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]] }
      return ids
    }
    return {
      li: 0,
      place: {},
      hint: 0,
      order: shuffled(0),
      solved: new Set(storage.loadSolved()),
      busy: false,
      msg: '',
      derivation: null,
      bad: null,
      flash: null,
      shake: 0,

      loadLevel(k, place) {
        set({ li: k, place: place || {}, hint: 0, busy: false, order: shuffled(k), derivation: null, msg: '', bad: null, flash: null })
      },
      tapPiece(id) {
        const s = get()
        if (s.busy) return
        const place = { ...s.place }
        if (place[id]) delete place[id]
        else { const pos = autoPlace(lvl().pieces, place, lvl().pieces.find(q => q.id === id)!); if (pos) place[id] = pos }
        set({ place, msg: '' })
      },
      dropPiece(id, drop) {
        const s = get()
        if (s.busy || !drop) return
        const place = { ...s.place }
        if (drop.valid) place[id] = [drop.x, drop.y]
        else if (!drop.over) delete place[id]
        set({ place })
      },
      reset() {
        if (get().busy) return
        set({ place: {}, hint: 0, msg: '' })
      },
      requestHint() {
        const s = get()
        if (s.busy) return
        if (s.hint === 0) { set({ hint: 1, msg: '' }); return }
        const r = hintStep(lvl(), s.place)
        if (!r) { set({ msg: '이미 맞게 놓여 있다.' }); return }
        set({ place: r.place, hint: s.hint + 1, msg: '', flash: { id: r.id, n: (s.flash?.n ?? 0) + 1 } })
      },
      setMsg(msg) {
        set({ msg })
      },
      solve() {
        const s = get()
        if (s.busy) return
        const r = solve(lvl(), s.place)
        if (r.kind === 'msg') set({ msg: r.msg, shake: r.shake ? s.shake + 1 : s.shake })
        else if (r.kind === 'error') set({ msg: r.msg, bad: { ids: r.ids, n: (s.bad?.n ?? 0) + 1 } })
        else set({ msg: '', busy: true, derivation: { lines: r.lines, ok: r.ok } })
      },
      finishDerivation() {
        const s = get()
        if (!s.derivation?.ok || s.solved.has(s.li)) return
        const solved = new Set(s.solved).add(s.li)
        storage.saveSolved([...solved])
        set({ solved })
      },
      closeDerivation() {
        const s = get()
        if (!s.derivation) return
        if (s.derivation.ok) get().loadLevel((s.li + 1) % levels.length)
        else set({ derivation: null, busy: false })
      },
    }
  })
}

export type GameStoreApi = ReturnType<typeof createGameStore>
