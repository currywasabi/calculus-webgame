/** 저장소 인터페이스. 게임 코드는 이것만 쓴다. 구현은 읽기/쓰기 실패를 삼킨다. */
export interface SaveStorage {
  /** 클리어한 레벨 번호(0부터) */
  loadSolved(): number[]
  saveSolved(solved: number[]): void
}

/** 테스트·비영속 환경용 */
export function memoryStorage(initial: number[] = []): SaveStorage & { data: number[] } {
  const s = {
    data: [...initial],
    loadSolved: () => [...s.data],
    saveSolved: (solved: number[]) => { s.data = [...solved] },
  }
  return s
}
