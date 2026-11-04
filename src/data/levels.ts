import { parseLevel } from './schema'

const files = import.meta.glob<unknown>('./puzzles/*.json', { eager: true, import: 'default' })

/** puzzles/*.json을 파일 이름 순서로 읽은 레벨 목록 */
export const LEVELS = Object.keys(files).sort().map(f => {
  try { return parseLevel(files[f]) }
  catch (e) { throw new Error(`${f}: ${e instanceof Error ? e.message : e}`) }
})
