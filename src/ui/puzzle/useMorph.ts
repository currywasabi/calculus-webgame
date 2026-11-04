import { useLayoutEffect, useRef, type RefObject } from 'react'

/**
 * key가 null이 아닌 새 값으로 바뀌면 요소를 직전 크기·위치에서 새 크기·위치로 부드럽게 바꾼다 (FLIP).
 * 기준점은 왼쪽 아래: 첨자 크기 전환이 아랫줄을 유지하는 규칙과 맞춘다.
 * 레이아웃 값(offset*)으로 재므로 진행 중인 transform의 영향을 받지 않는다.
 * prefers-reduced-motion이면 전역 CSS가 transition을 끄므로 즉시 바뀐다.
 */
export function useMorph(ref: RefObject<HTMLElement | null>, key: unknown) {
  const last = useRef<{ key: unknown; x: number; y: number; w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const now = { key, x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
    const p = last.current
    last.current = now
    if (!p || key === null || p.key === key || !now.w || !now.h) return
    const sx = p.w / now.w, sy = p.h / now.h
    const dx = p.x - now.x, dy = (p.y + p.h) - (now.y + now.h)
    if (sx === 1 && sy === 1 && dx === 0 && dy === 0) return
    el.style.transformOrigin = 'left bottom'
    el.style.transition = 'none'
    el.style.transform = `translate(${dx}px,${dy}px) scale(${sx},${sy})`
    void el.offsetWidth
    el.style.transition = 'transform .22s ease-out'
    el.style.transform = ''
    // 끝나면 인라인 transition을 지워 다른 연출(흐려짐 등)의 CSS transition을 가리지 않게 한다
    const t = setTimeout(() => { el.style.transition = ''; el.style.transformOrigin = '' }, 260)
    return () => clearTimeout(t)
  })
}
