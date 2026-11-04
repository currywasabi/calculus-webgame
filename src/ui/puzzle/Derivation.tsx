import { useEffect, useRef, useState } from 'react'
import type { DerivLine } from '../../core/puzzle/solve'
import { MathSvg } from '../math/MathSvg'
import { gameStore, LEVELS, useGame } from '../game'

type Props = {
  lines: DerivLine[]
  ok: boolean
  /** 흐려지는 조각 수 (첫 줄이 뜨기 전 대기 시간) */
  pieceCount: number
  fontSize: number
}

/** = 이후 단계별 풀이 오버레이 (원본 play). 탭하면 애니메이션을 건너뛴다. */
export function Derivation({ lines, ok, pieceCount, fontSize }: Props) {
  const li = useGame(s => s.li)
  const [shown, setShown] = useState(0)
  const [done, setDone] = useState(false)
  const skip = useRef(false)
  const cancelWait = useRef<(() => void) | null>(null)
  const btn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let alive = true
    skip.current = false
    const wait = (ms: number) => new Promise<void>(res => {
      if (skip.current) return res()
      const t = setTimeout(res, ms)
      cancelWait.current = () => { clearTimeout(t); res() }
    })
    ;(async () => {
      await wait(380 + pieceCount * 60)
      for (let k = 0; k < lines.length; k++) {
        if (!alive) return
        setShown(k + 1)
        if (k < lines.length - 1) await wait(k === 0 ? 1000 : 1100)
      }
      await wait(450)
      if (!alive) return
      if (ok) gameStore.getState().finishDerivation()
      setDone(true)
      skip.current = true
    })()
    return () => { alive = false; skip.current = true; cancelWait.current?.() }
  }, [lines, ok, pieceCount])

  useEffect(() => { if (done) btn.current?.focus({ preventScroll: true }) }, [done])

  const skipAnim = () => { if (!skip.current) { skip.current = true; cancelWait.current?.() } }

  // Enter: 끝났으면 버튼, 아니면 건너뛰기. 캡처 단계에서 처리해 화면의 = 단축키보다 먼저 받는다.
  const doneRef = useRef(done)
  useEffect(() => { doneRef.current = done }, [done])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || (e.target as Element).closest?.('button')) return
      e.preventDefault()
      if (doneRef.current) gameStore.getState().closeDerivation(); else skipAnim()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [])

  // 최근 3줄만 남기고, 마지막 줄 외에는 흐리게
  const from = Math.max(0, shown - 3)
  const visible = lines.slice(from, shown)
  return (
    <div className="deriv" style={{ fontSize: fontSize + 'px' }} onClick={e => { if (!(e.target as Element).closest('.dctl')) skipAnim() }}>
      <div className="dlines">
        {visible.map((ln, j) => {
          const k = from + j, last = k === shown - 1
          return (
            <div key={k} className={'ln' + ('text' in ln ? ' txt' : '') + (last ? '' : ' old')}>
              {'text' in ln ? ln.text : <MathSvg tex={ln.tex} display />}
              {last && done && ok && <span className="qed">∎</span>}
            </div>
          )
        })}
      </div>
      <div className="dctl" hidden={!done}>
        <button className="btn" ref={btn} onClick={() => gameStore.getState().closeDerivation()}>
          {ok ? (li < LEVELS.length - 1 ? '다음 문제' : '처음부터') : '다시'}
        </button>
      </div>
    </div>
  )
}
