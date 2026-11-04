import { useEffect, useRef, useState, type ComponentProps, type PointerEvent, type RefObject } from 'react'
import { absCells, COLS, edges, ROWS, slotDef } from '../../core/puzzle/geometry'
import type { Cell, Level } from '../../core/puzzle/pieces'
import { useGame } from '../game'
import { Derivation } from './Derivation'
import { Piece } from './Piece'
import type { DragView } from './usePieceDrag'
import { useMorph } from './useMorph'

/** 판 위 조각. 자리 맞바꾸기로 밀려나면(morph가 바뀌면) 새 자리·크기로 부드럽게 옮겨 간다. */
function BoardPiece({ morph, ...props }: ComponentProps<typeof Piece> & { morph: number | null }) {
  const ref = useRef<HTMLDivElement>(null)
  useMorph(ref, morph)
  return <Piece {...props} elRef={ref} />
}

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
  const slide = useGame(s => s.slide)

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
    for (const d of L.pieces) { const s = L.sol[d.id]; cells.push(...absCells(slotDef(d, s), s[0], s[1])) }
    const { o, f } = edges(cells, cell)
    sil = f + `<path d="${o}"/>`
  }
  let prev = ''
  const plan = drag?.snap?.plan
  if (drag && plan) {
    const { o, f } = edges(absCells(slotDef(L.pieces.find(d => d.id === drag.id)!, plan.slot), plan.slot[0], plan.slot[1]), cell)
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
              <BoardPiece
                key={`${d.id}:${flash?.id === d.id ? flash.n : 0}`}
                morph={slide?.id === d.id ? slide.n : null}
                def={slotDef(d, place[d.id])}
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
