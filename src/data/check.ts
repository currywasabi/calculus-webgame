import { C } from '../core/math/complex'
import { close, N } from '../core/math/evaluate'
import { isParseError, parseRegion } from '../core/math/parse2d'
import { canPlace, placedList, slotDef, type Placement } from '../core/puzzle/geometry'
import { scriptRow } from '../core/puzzle/drop'
import type { Level } from '../core/puzzle/pieces'

/** 스키마를 통과한 레벨의 의미 검사. 문제가 없으면 빈 배열. */
export function checkLevel(L: Level): string[] {
  const errors: string[] = []
  const place: Placement = {}
  for (const d of L.pieces) {
    const s = L.sol[d.id]
    if (s[2] === 'script' && !d.script) errors.push(`조각 ${d.id}는 첨자 크기가 없다.`)
    if (!canPlace(L.pieces, place, slotDef(d, s), s[0], s[1])) errors.push(`정답 배치에서 조각 ${d.id}가 판 밖에 있거나 다른 조각과 겹친다.`)
    place[d.id] = s
  }
  if (errors.length) return errors

  // 첨자 크기 자리는 드래그로 만들 수 있는 자리여야 한다 (첨자 자리 규칙)
  for (const d of L.pieces) {
    const s = L.sol[d.id]
    if (s[2] !== 'script') continue
    const others = { ...L.sol }
    delete others[d.id]
    if (scriptRow(L.pieces, others, d, s[0], s[1] - (d.h - 1)) !== s[1]) errors.push(`조각 ${d.id}의 첨자 크기 자리가 첨자 자리 규칙에 맞지 않는다.`)
  }
  if (errors.length) return errors

  try {
    const val = N(parseRegion(placedList(L.pieces, L.sol), { intDepth: 0 }), {})
    if (!close(val, C(L.goal.value))) errors.push(`정답 배치의 값 ${val.re}${val.im ? ` + ${val.im}i` : ''}이 목표 ${L.goal.value}와 다르다.`)
  } catch (e) {
    errors.push(isParseError(e) ? `정답 배치를 파싱할 수 없다: ${e.msg} [${e.ids}]` : `정답 배치를 평가할 수 없다: ${JSON.stringify(e)}`)
  }
  return errors
}
