// 퍼즐 JSON 검증: ① 스키마 ② 정답 배치가 판 안에 있고 겹치지 않음 ③ 정답 배치의 값이 목표값
// 실행: npm run validate
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { checkLevel } from '../src/data/check'
import { parseLevel } from '../src/data/schema'

const dir = join(import.meta.dirname, '../src/data/puzzles')
const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
let failed = 0

for (const f of files) {
  let errors: string[]
  try {
    errors = checkLevel(parseLevel(JSON.parse(readFileSync(join(dir, f), 'utf8'))))
  } catch (e) {
    errors = [e instanceof z.ZodError ? '스키마: ' + z.prettifyError(e) : String(e)]
  }
  if (errors.length) {
    failed++
    console.log(`✗ ${f}`)
    for (const m of errors) console.log('    ' + m.replace(/\n/g, '\n    '))
  } else console.log(`✓ ${f}`)
}

console.log(`\n${files.length - failed}/${files.length} 통과`)
if (failed || !files.length) process.exit(1)
