import { useEffect, useState, type PointerEvent, type RefObject } from 'react'
import { absCells, COLS, edges, ROWS } from '../../core/puzzle/geometry'
import type { Cell, Level } from '../../core/puzzle/pieces'
import { useGame } from '../game'
import { Derivation } from './Derivation'
import { Piece } from './Piece'
import type { DragView } from './usePieceDrag'

type Props = {
  level: Level
  cell: number
  boardRef: RefObject<HTMLDivElement | null>
  drag: DragView | null
  onPointerDown: (id: string, e: PointerEvent<HTMLDivElement>) => void
}

export function Board({ level: L, cell, boardRef, drag, onPointerDown }: Props) {
  const place = useGame(s => s.place)
  const hint = useGame(s => s.hint)
  const derivation = useGame(s => s.derivation)
  const bad = useGame(s => s.bad)
  const flash = useGame(s => s.flash)

  // 에러 조각은 1.8초 동안 색 반전
  const [expired, setExpired] = useState(0)
  useEffect(() => {
    if (!bad) return
    const t = setTimeout(() => setExpired(bad.n), 1800)
    return () => clearTimeout(t)
  }, [bad])
  const badIds = bad && bad.n !== expired ? bad.ids : []

  const W = COLS * cell, H = ROWS * cell
  const onboard = L.pieces.filter(d => place[d.id])
  // 흐려지는 순서: 왼쪽부터
  const meltOrder = new Map([...onboard].sort((a, b) => place[a.id][0] - place[b.id][0]).map((d, k) => [d.id, k]))

  let sil = ''
  if (hint >= 1) {
    const cells: Cell[] = []
    for (const d of L.pieces) cells.push(...absCells(d, ...L.sol[d.id]))
    const { o, f } = edges(cells, cell)
    sil = f + `<path d="${o}"/>`
  }
  let prev = ''
  if (drag?.snap?.valid) {
    const { o, f } = edges(absCells(drag.snap.d, drag.snap.x, drag.snap.y), cell)
    prev = f + `<path d="${o}"/>`
  }

  return (
    <div className="bw">
      <div
        className="board"
        ref={boardRef}
        style={{ width: W + 'px', height: H + 'px', backgroundSize: cell + 'px ' + cell + 'px', backgroundPosition: (-cell / 2) + 'px ' + (-cell / 2) + 'px' }}
      >
        <svg className="ov sil" width={W} height={H} dangerouslySetInnerHTML={{ __html: sil }} />
        <div className="layer">
          {onboard.map(d => {
            const cls = ['onboard']
            if (badIds.includes(d.id)) cls.push('bad')
            if (flash?.id === d.id) cls.push('flash')
            if (derivation) cls.push('melt')
            return (
              <Piece
                key={`${d.id}:${flash?.id === d.id ? flash.n : 0}`}
                def={d}
                cell={cell}
                className={cls.join(' ')}
                style={{
                  left: place[d.id][0] * cell + 'px',
                  top: place[d.id][1] * cell + 'px',
                  visibility: drag?.id === d.id ? 'hidden' : undefined,
                  transitionDelay: derivation ? (meltOrder.get(d.id)! * 60) + 'ms' : undefined,
                }}
                onPointerDown={onPointerDown}
              />
            )
          })}
        </div>
        <svg className="ov prev" width={W} height={H} dangerouslySetInnerHTML={{ __html: prev }} />
        {derivation && <Derivation lines={derivation.lines} ok={derivation.ok} pieceCount={onboard.length} fontSize={Math.max(14, cell * .5)} />}
      </div>
    </div>
  )
}
