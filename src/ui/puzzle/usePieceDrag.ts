import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { resolveDrop } from '../../core/puzzle/drop'
import type { Drop } from '../../state/store'
import { gameStore, LEVELS } from '../game'

export type DragView = {
  id: string
  /** 본문 크기 고스트의 왼쪽 위 좌표 (viewport) */
  px: number
  py: number
  snap: Drop | null
}

type DragData = DragView & { moved: boolean; x0: number; y0: number; gx: number; gy: number }

/** 원본 drag & drop: 5px 이상 움직여야 드래그, 아니면 탭 */
export function usePieceDrag(boardRef: RefObject<HTMLElement | null>, cell: number) {
  const drag = useRef<DragData | null>(null)
  const [view, setView] = useState<DragView | null>(null)

  const cellRef = useRef(cell)
  useEffect(() => { cellRef.current = cell }, [cell])

  const onPointerDown = useCallback((id: string, e: PointerEvent<HTMLDivElement>) => {
    const s = gameStore.getState()
    if (s.busy || drag.current) return
    e.preventDefault()
    const r = e.currentTarget.getBoundingClientRect()
    // 첨자 크기 조각을 잡으면 아랫줄을 맞춘 본문 크기 조각을 잡은 것으로 본다 (아랫줄 유지 규칙과 맞춤)
    const d = LEVELS[s.li].pieces.find(q => q.id === id)!
    const lift = s.place[id]?.[2] === 'script' && d.script ? (d.h - d.script.h) * cellRef.current : 0
    drag.current = { id, x0: e.clientX, y0: e.clientY, gx: e.clientX - r.left, gy: e.clientY - r.top + lift, moved: false, px: 0, py: 0, snap: null }
  }, [])

  useEffect(() => {
    const snapAt = (id: string, px: number, py: number, cx: number, cy: number): Drop => {
      const c = cellRef.current
      const br = boardRef.current!.getBoundingClientRect()
      const s = gameStore.getState()
      const x = Math.round((px - br.left) / c), y = Math.round((py - br.top) / c)
      const over = cx >= br.left && cx <= br.right && cy >= br.top && cy <= br.bottom
      return { over, plan: resolveDrop(LEVELS[s.li].pieces, s.place, id, x, y) }
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
