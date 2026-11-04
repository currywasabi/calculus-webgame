import { useEffect, useRef } from 'react'
import { MathSvg } from '../math/MathSvg'
import { sceneStore } from '../game'

export function IntroScene() {
  const start = useRef<HTMLButtonElement>(null)
  // 포커스를 두어 Enter/Space로 바로 시작
  useEffect(() => { start.current?.focus({ preventScroll: true }) }, [])
  return (
    <main className="intro">
      <h1 className="intro-title" aria-label="Calculus is All You Need">
        <MathSvg tex="\text{Calculus is All You Need}" display />
      </h1>
      <button className="intro-start" ref={start} onClick={() => sceneStore.getState().go('puzzle')}>Start</button>
    </main>
  )
}
