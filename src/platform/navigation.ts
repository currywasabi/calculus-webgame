/**
 * 화면 경로를 바깥(URL 해시 등)과 동기화하는 인터페이스. 게임 코드는 location/history에 직접 접근하지 않는다.
 * 경로는 'play' 같은 짧은 문자열이고, 빈 문자열은 첫 화면이다.
 */
export interface Navigation {
  current(): string
  /** 새 기록으로 이동 (뒤로 가기로 돌아올 수 있음) */
  push(route: string): void
  /** 바깥에서 경로가 바뀌었을 때 (뒤로 가기, 주소창 수정) */
  subscribe(cb: (route: string) => void): () => void
}

/** URL 해시(#/play) 구현. GitHub Pages·Electron(file://) 모두 서버 설정 없이 동작한다. */
export function hashNavigation(): Navigation {
  const read = () => location.hash.replace(/^#\/?/, '')
  return {
    current: read,
    push(route) {
      history.pushState(null, '', route ? '#/' + route : location.pathname + location.search)
    },
    subscribe(cb) {
      const on = () => cb(read())
      window.addEventListener('popstate', on)
      return () => window.removeEventListener('popstate', on)
    },
  }
}

/** 테스트용 */
export function memoryNavigation(initial = ''): Navigation & { history: string[]; back(): void } {
  const subs = new Set<(r: string) => void>()
  const nav = {
    history: [initial],
    current: () => nav.history[nav.history.length - 1],
    push(route: string) { nav.history.push(route) },
    subscribe(cb: (r: string) => void) { subs.add(cb); return () => { subs.delete(cb) } },
    back() { if (nav.history.length > 1) nav.history.pop(); subs.forEach(cb => cb(nav.current())) },
  }
  return nav
}
