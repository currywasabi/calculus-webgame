# 증명 조각

수식 조각을 판 위에 조립해 목표값을 만드는 퍼즐. 단일 HTML 프로토타입([prototype/proof-pieces.html](prototype/proof-pieces.html))을 TypeScript + React로 이식한 것이다. 이식 지시서는 [PORTING.md](PORTING.md).

- 데모: https://currywasabi.github.io/calculus-webgame/
- 원본 프로토타입: https://currywasabi.github.io/calculus-webgame/prototype/proof-pieces.html

## 실행

Node 22.12 이상.

```sh
npm install
npm run dev        # 개발 서버 (http://localhost:5173/calculus-webgame/)
npm run build      # 타입 검사 + dist/ 빌드 (원본 프로토타입도 dist/prototype/에 복사)
npm run preview    # 빌드 결과 미리보기
npm test           # Vitest (엔진, 퍼즐 데이터, 힌트, 스토어, UI 연기 테스트)
npm run validate   # 퍼즐 JSON 검증
```

`main`에 push하면 GitHub Actions가 test → validate → build 후 GitHub Pages에 배포한다([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

## 구조

```
src/
  core/        순수 TS. React·DOM·MathJax·Zustand를 import하지 않는다.
    math/      수식 트리, 복소수, 2D 파서, 수치 평가, 재작성 엔진, LaTeX
    puzzle/    조각 정의, 판 기하, 힌트, 계산(풀이 줄 만들기)
  data/        퍼즐 JSON, Zod 스키마, 정답 배치 검사
  state/       Zustand 스토어 (퍼즐 진행 store.ts, 화면 전환 scene.ts)
  platform/    저장소·화면 경로 인터페이스와 웹 구현 (localStorage, URL 해시)
  ui/          React 컴포넌트, MathJax 래퍼
    scenes/    최상위 화면 레지스트리 (인트로, 퍼즐)
  styles/      원본 색상 토큰과 스타일
tools/         validate-puzzles.ts
tests/
```

## 새 화면 추가

1. `src/state/scene.ts`의 `SCENES`에 id와 URL 경로를 추가한다 (예: `levels: { route: 'levels' }` → `#/levels`).
2. `src/ui/scenes/index.ts`의 `SCENE_VIEWS`에 컴포넌트를 등록한다.
3. 화면 이동은 `sceneStore.getState().go('levels')`. 브라우저 뒤로 가기도 동작한다.

## 새 레벨 추가

1. `src/data/puzzles/`에 `NN-이름.json`을 만든다. 파일 이름 순서가 레벨 순서다.

   ```json
   {
     "title": "덧셈",
     "goal": { "tex": "7", "value": 7 },
     "notes": [{ "kind": "규칙", "text": "조각을 모두 판 위에 놓고 = 을 누른다." }],
     "pieces": [
       { "type": "num", "id": "a", "v": 3 },
       { "type": "op", "id": "b", "op": "+" },
       { "type": "num", "id": "c", "v": 4 }
     ],
     "sol": { "a": [4, 3], "b": [6, 4], "c": [7, 3] }
   }
   ```

   - `goal.tex`는 화면에 보일 LaTeX, `goal.value`는 정답 판정에 쓰는 수치(상대 오차 1e-7).
   - `notes`의 항목은 `kind`(예: 규칙, 정리)와 `text`(문장) 또는 `tex`(수식) 중 하나 이상을 가진다.
   - `sol`은 모든 조각의 정답 위치 `[x, y]`(조각 바운딩 박스의 왼쪽 위 칸, 판은 12열 × 8행)다. 첨자 크기로 놓이는 조각은 `[x, y, "script"]`. 힌트가 이 배치를 쓴다.

2. 조각 종류 (`type`)

   | type | 추가 필드 | 크기 | 비고 |
   |---|---|---|---|
   | `num` | `v` (정수) | 2 × 3 | 첨자 2 × 1 |
   | `const` | `c`: `"e"`, `"π"`, `"i"` | 2 × 3 | 첨자 2 × 1 |
   | `op` | `op`: `"+"`, `"−"`, `"×"` | 1 × 1 | 빼기는 U+2212 `−` |
   | `lp`, `rp` | | 1 × 3 | 괄호 |
   | `gamma` | | 2 × 3 | Γ |
   | `frac` | `w` | w × 1 | 분수 막대 |
   | `sqrt` | `w`, `h` | ㄱ자 | 근호 |
   | `int` | | 1 × 5 | ∫ |
   | `inf` | `sign`: `1` 또는 `-1` | 2 × 1 | ±∞ |
   | `negsq` | | 3 × 3 | 첨자 3 × 1. `-x²` (∫ … dx 안에서만) |
   | `dx` | | 2 × 3 | |

3. 배치 규칙 ([src/core/puzzle/drop.ts](src/core/puzzle/drop.ts))
   - **첨자 자리:** 첨자 크기가 있는 조각을 위첨자를 받는 조각(숫자, 상수, -x², 닫는 괄호, 근호, 분수, ∫)의 바로 오른쪽에, 아랫줄이 그 조각의 윗줄이거나 한 줄 위가 되게 놓으면 아랫줄을 유지한 채 첨자 크기(같은 너비, 높이 1)가 된다. 첨자 크기 조각 뒤에 이어 붙여도 같다. 크기는 그 조각을 놓을 때만 정해진다.
   - **자리 맞바꾸기:** 같은 모양의 조각 하나와만 겹치게 놓으면 서로 자리를 바꾼다. 크기는 자리를 따르고, 트레이에서 온 조각이면 밀려난 조각이 트레이로 간다.
   - 첨자 크기 정답 자리는 첨자 자리 규칙으로 만들 수 있는 자리여야 한다 (`npm run validate`가 검사).

4. `npm run validate`로 스키마, 정답 배치(판 안·겹침 없음), 정답 배치의 값이 목표값과 같은지를 확인한다. `npm test`의 퍼즐 테스트도 같은 검사를 한다.
