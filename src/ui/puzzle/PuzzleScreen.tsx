import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { COLS } from '../../core/puzzle/geometry'
import { gameStore, LEVELS, useGame } from '../game'
import { MathSvg } from '../math/MathSvg'
import { Board } from './Board'
import { Piece } from './Piece'
import { Tray } from './Tray'
import { usePieceDrag } from './usePieceDrag'

/** 칸 크기 = 컨테이너 너비 ÷ 12, 18~44px (원본 computeCell) */
const computeCell = (el: HTMLElement | null) => Math.max(18, Math.min(44, Math.floor((el?.clientWidth || 360) / COLS)))

export function PuzzleScreen() {
  const li = useGame(s => s.li)
  const solved = useGame(s => s.solved)
  const msg = useGame(s => s.msg)
  const busy = useGame(s => s.busy)
  const L = LEVELS[li]
  const act = gameStore.getState()

  const appRef = useRef<HTMLElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const [cell, setCell] = useState(40)

  // .bw는 .app 안에서 가로로 꽉 차므로, 판 크기와 무관한 .app의 내용 너비로 잰다.
  const measure = () => {
    const app = appRef.current
    if (!app) return 40
    const cs = getComputedStyle(app)
    return computeCell({ clientWidth: app.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) } as HTMLElement)
  }
  useLayoutEffect(() => { setCell(measure()) }, [])
  useEffect(() => { if (!busy) setCell(measure()) }, [busy])
  useEffect(() => {
    let rz: ReturnType<typeof setTimeout>
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { if (!gameStore.getState().busy) setCell(measure()) }, 120) }
    window.addEventListener('resize', onResize)
    return () => { clearTimeout(rz); window.removeEventListener('resize', onResize) }
  }, [])

  // Enter = 계산 (풀이 중의 Enter는 Derivation이 먼저 처리한다)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented || (e.target as Element).closest?.('button')) return
      gameStore.getState().solve()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const { drag, onPointerDown } = usePieceDrag(boardRef, cell)
  const dragDef = drag && L.pieces.find(d => d.id === drag.id)

  return (
    <main className="app" ref={appRef}>
      <header className="head">
        <h1 className="sec"><span className="num">§{li + 1}</span><span>{L.title}</span></h1>
        <nav className="lv" aria-label="문제">
          {LEVELS.map((_, k) => (
            <button key={k} className={solved.has(k) ? 'done' : ''} aria-current={k === li} aria-label={`${k + 1}번 문제`} onClick={() => act.loadLevel(k)}>{k + 1}</button>
          ))}
        </nav>
      </header>

      <section className="task">
        <div className="goal"><span className="lbl">목표</span><MathSvg as="div" className="goal-tex" tex={'\\boxed{\\phantom{00}}\\;=\\;' + L.goal.tex} /></div>
        <div>
          {L.notes.map((n, k) => (
            <p className="note" key={k}>
              <b>{n.kind}.</b>
              {n.tex && <MathSvg className="m" tex={n.tex} />}
              {n.text && <span className="t">{n.text}</span>}
            </p>
          ))}
        </div>
      </section>

      <Board level={L} cell={cell} boardRef={boardRef} drag={drag} onPointerDown={onPointerDown} />

      <Tray level={L} cell={cell} drag={drag} onPointerDown={onPointerDown} />

      <div className="bar">
        <button className="btn" onClick={() => act.requestHint()}>힌트</button>
        <button className="btn" onClick={() => act.reset()}>초기화</button>
        <span className="msg" aria-live="polite">{msg}</span>
        <button className="eq" aria-label="계산" onClick={() => act.solve()}>=</button>
      </div>

      {drag && dragDef && createPortal(
        <Piece def={dragDef} cell={cell} className="ghost" style={{ transform: `translate(${drag.px}px,${drag.py}px)` }} />,
        document.body,
      )}
    </main>
  )
}
