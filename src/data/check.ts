import { C } from '../core/math/complex'
import { close, N } from '../core/math/evaluate'
import { isParseError, parseRegion } from '../core/math/parse2d'
import { canPlace, placedList, type Placement } from '../core/puzzle/geometry'
import type { Level } from '../core/puzzle/pieces'

/** 스키마를 통과한 레벨의 의미 검사. 문제가 없으면 빈 배열. */
export function checkLevel(L: Level): string[] {
  const errors: string[] = []
  const place: Placement = {}
  for (const d of L.pieces) {
    const [x, y] = L.sol[d.id]
    if (!canPlace(L.pieces, place, d, x, y)) errors.push(`정답 배치에서 조각 ${d.id}가 판 밖에 있거나 다른 조각과 겹친다.`)
    place[d.id] = [x, y]
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
