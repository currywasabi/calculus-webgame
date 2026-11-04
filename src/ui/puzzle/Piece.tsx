import { memo, type CSSProperties, type PointerEvent, type Ref } from 'react'
import { cellsOf, edges } from '../../core/puzzle/geometry'
import type { PieceDef } from '../../core/puzzle/pieces'
import { MathSvg } from '../math/MathSvg'

type Props = {
  def: PieceDef
  cell: number
  /** onboard, bad, melt, flash, ghost */
  className?: string
  style?: CSSProperties
  onPointerDown?: (id: string, e: PointerEvent<HTMLDivElement>) => void
  /** 바깥 요소 (모양 전환 연출용) */
  elRef?: Ref<HTMLDivElement>
}

export const Piece = memo(function Piece({ def: d, cell, className, style, onPointerDown, elRef }: Props) {
  const W = d.w * cell, H = d.h * cell
  const { o, f } = edges(cellsOf(d), cell)
  const sw = Math.max(1.6, cell * .075)
  return (
    <div
      ref={elRef}
      className={'piece k-' + d.kind + (className ? ' ' + className : '')}
      data-id={d.id}
      style={{ width: W + 'px', height: H + 'px', ...style }}
      role="img"
      aria-label={d.aria || d.tex}
      onPointerDown={onPointerDown && (e => onPointerDown(d.id, e))}
    >
      <svg className="shape" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <g className="sh" transform="translate(2.5 2.5)" dangerouslySetInnerHTML={{ __html: f }} />
        <g className="fl" dangerouslySetInnerHTML={{ __html: f }} />
        <path className="ol" d={o} />
        {d.draw === 'bar' && <path className="dr" strokeWidth={sw} d={`M${cell * .2} ${cell / 2}H${W - cell * .2}`} />}
        {d.draw === 'root' && <path className="dr" strokeWidth={sw} d={`M${cell * .14} ${cell * (d.h - 1.65)}L${cell * .34} ${cell * (d.h - 1.85)}L${cell * .56} ${cell * (d.h - .3)}L${cell * .84} ${cell * .5}H${W - cell * .15}`} />}
      </svg>
      {d.tex && (d.fit
        ? <MathSvg as="div" className="lab" tex={d.tex} fit={{ W, H, ratio: d.fit }} />
        : <MathSvg as="div" className="lab" tex={d.tex} style={{ fontSize: (d.em! * cell) + 'px' }} />)}
    </div>
  )
})
