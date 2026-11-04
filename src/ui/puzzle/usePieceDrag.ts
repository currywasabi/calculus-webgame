import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { canPlace } from '../../core/puzzle/geometry'
import type { PieceDef } from '../../core/puzzle/pieces'
import type { Drop } from '../../state/store'
import { gameStore, LEVELS } from '../game'

/** 스냅 미리보기용: 놓일 자리와 조각 */
export type Snap = Drop & { d: PieceDef }

export type DragView = {
  id: string
  /** 고스트 좌표 (viewport) */
  px: number
  py: number
  snap: Snap | null
}

type DragData = DragView & { moved: boolean; x0: number; y0: number; gx: number; gy: number }

/** 원본 drag & drop: 5px 이상 움직여야 드래그, 아니면 탭 */
export function usePieceDrag(boardRef: RefObject<HTMLElement | null>, cell: number) {
  const drag = useRef<DragData | null>(null)
  const [view, setView] = useState<DragView | null>(null)

  const onPointerDown = useCallback((id: string, e: PointerEvent<HTMLDivElement>) => {
    if (gameStore.getState().busy || drag.current) return
    e.preventDefault()
    const r = e.currentTarget.getBoundingClientRect()
    drag.current = { id, x0: e.clientX, y0: e.clientY, gx: e.clientX - r.left, gy: e.clientY - r.top, moved: false, px: 0, py: 0, snap: null }
  }, [])

  const cellRef = useRef(cell)
  useEffect(() => { cellRef.current = cell }, [cell])

  useEffect(() => {
    const snapAt = (id: string, px: number, py: number, cx: number, cy: number): Snap => {
      const c = cellRef.current
      const br = boardRef.current!.getBoundingClientRect()
      const s = gameStore.getState()
      const pieces = LEVELS[s.li].pieces
      const d = pieces.find(q => q.id === id)!
      const x = Math.round((px - br.left) / c), y = Math.round((py - br.top) / c)
      const over = cx >= br.left && cx <= br.right && cy >= br.top && cy <= br.bottom
      return { x, y, over, valid: canPlace(pieces, s.place, d, x, y, d.id), d }
    }
    const move = (e: globalThis.PointerEvent) => {
      const dr = drag.current
      if (!dr) return
      if (!dr.moved) {
        if (Math.hypot(e.clientX - dr.x0, e.clientY - dr.y0) < 5) return
        dr.moved = true
        gameStore.getState().setMsg('')
      }
      dr.px = e.clientX - dr.gx; dr.py = e.clientY - dr.gy
      dr.snap = snapAt(dr.id, dr.px, dr.py, e.clientX, e.clientY)
      setView({ id: dr.id, px: dr.px, py: dr.py, snap: dr.snap })
    }
    const end = (apply: boolean) => {
      const dr = drag.current
      if (!dr) return
      drag.current = null
      setView(null)
      if (!dr.moved) { if (apply) gameStore.getState().tapPiece(dr.id); return }
      if (apply) gameStore.getState().dropPiece(dr.id, dr.snap)
    }
    const up = () => end(true), cancel = () => end(false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
    }
  }, [boardRef])

  return { drag: view, onPointerDown }
}
