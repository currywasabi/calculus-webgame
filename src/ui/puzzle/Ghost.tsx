import { useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Form, PieceDef } from '../../core/puzzle/pieces'
import { inForm } from '../../core/puzzle/pieces'
import { Piece } from './Piece'
import { useMorph } from './useMorph'

type Props = {
  def: PieceDef
  /** 놓일 자리의 크기 */
  form: Form | undefined
  cell: number
  /** 본문 크기 고스트의 왼쪽 위 (viewport) */
  px: number
  py: number
}

/** 드래그 중인 조각. 첨자 자리에 가져다 대면 아랫줄을 유지한 채 첨자 크기로 부드럽게 바뀐다. */
export function Ghost({ def, form, cell, px, py }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useMorph(ref, form ?? 'normal')
  const d = inForm(def, form)
  return createPortal(
    <div className="ghost" style={{ transform: `translate(${px}px,${py}px)` }}>
      <Piece elRef={ref} def={d} cell={cell} style={{ position: 'absolute', left: 0, top: (def.h - d.h) * cell + 'px' }} />
    </div>,
    document.body,
  )
}
