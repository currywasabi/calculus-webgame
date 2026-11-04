import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Form, PieceDef } from '../../core/puzzle/pieces'
import { inForm } from '../../core/puzzle/pieces'
import { Piece } from './Piece'

type Props = {
  def: PieceDef
  /** 놓일 자리의 크기 */
  form: Form | undefined
  cell: number
  /** 본문 크기 고스트의 왼쪽 위 (viewport) */
  px: number
  py: number
}

/** 드래그 중인 조각. 첨자 자리에 가져다 대면 아랫줄을 유지한 채 첨자 크기로 바뀐다. */
export function Ghost({ def, form, cell, px, py }: Props) {
  // 크기가 바뀔 때마다 짧게 튀는 전환을 다시 재생한다
  const [prevForm, setPrevForm] = useState(form)
  const [changes, setChanges] = useState(0)
  if (form !== prevForm) { setPrevForm(form); setChanges(changes + 1) }

  const d = inForm(def, form)
  const y = py + (def.h - d.h) * cell
  return createPortal(
    <Piece
      key={changes}
      def={d}
      cell={cell}
      className={'ghost' + (changes ? ' ghost-form' : '')}
      style={{ transform: `translate(${px}px,${y}px)`, transformOrigin: 'left bottom' }}
    />,
    document.body,
  )
}
