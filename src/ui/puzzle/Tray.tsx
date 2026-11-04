import { useEffect, useRef, type PointerEvent } from 'react'
import type { Level } from '../../core/puzzle/pieces'
import { useGame } from '../game'
import { Piece } from './Piece'
import type { DragView } from './usePieceDrag'

type Props = {
  level: Level
  cell: number
  drag: DragView | null
  onPointerDown: (id: string, e: PointerEvent<HTMLDivElement>) => void
}

export function Tray({ level: L, cell, drag, onPointerDown }: Props) {
  const place = useGame(s => s.place)
  const order = useGame(s => s.order)
  const shake = useGame(s => s.shake)

  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!shake || !el) return
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake')
  }, [shake])

  const loose = order.filter(id => !place[id])
  return (
    <div className="tray" ref={ref}>
      {loose.length
        ? loose.map(id => (
          <Piece
            key={id}
            def={L.pieces.find(d => d.id === id)!}
            cell={cell}
            style={drag?.id === id ? { visibility: 'hidden' } : undefined}
            onPointerDown={onPointerDown}
          />
        ))
        : <span className="tray-empty">모든 조각이 판 위에 있다.</span>}
    </div>
  )
}
