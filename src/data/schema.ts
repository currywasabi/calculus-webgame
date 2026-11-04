import { z } from 'zod'
import { buildPiece, type Level } from '../core/puzzle/pieces'

const id = z.string().min(1)
const cell = z.tuple([z.number().int(), z.number().int()])

export const pieceSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('num'), id, v: z.number().int() }),
  z.strictObject({ type: z.literal('const'), id, c: z.enum(['e', 'π', 'i']) }),
  z.strictObject({ type: z.literal('op'), id, op: z.enum(['+', '−', '×']) }),
  z.strictObject({ type: z.literal('frac'), id, w: z.number().int().min(1) }),
  z.strictObject({ type: z.literal('sqrt'), id, w: z.number().int().min(2), h: z.number().int().min(2) }),
  z.strictObject({ type: z.literal('inf'), id, sign: z.union([z.literal(1), z.literal(-1)]) }),
  z.strictObject({ type: z.enum(['lp', 'rp', 'gamma', 'int', 'negsq', 'dx']), id }),
])

export const noteSchema = z.strictObject({
  kind: z.string().min(1),
  text: z.string().optional(),
  tex: z.string().optional(),
}).refine(n => n.text || n.tex, '설명(text)이나 수식(tex) 중 하나는 있어야 한다.')

export const levelSchema = z.strictObject({
  title: z.string().min(1),
  goal: z.strictObject({ tex: z.string().min(1), value: z.number() }),
  notes: z.array(noteSchema),
  pieces: z.array(pieceSchema).min(1),
  sol: z.record(id, cell),
}).superRefine((l, ctx) => {
  const ids = l.pieces.map(p => p.id)
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: ['pieces'], message: '조각 id가 겹친다.' })
  const sol = Object.keys(l.sol)
  if (sol.length !== ids.length || !ids.every(k => k in l.sol)) {
    ctx.addIssue({ code: 'custom', path: ['sol'], message: `정답 배치의 id가 조각과 다르다: [${sol}] vs [${ids}]` })
  }
})

export type LevelJson = z.input<typeof levelSchema>

/** JSON → 검증 → 조각 정의로 변환. 스키마를 어기면 ZodError를 던진다. */
export function parseLevel(json: unknown): Level {
  const l = levelSchema.parse(json)
  return { ...l, pieces: l.pieces.map(buildPiece) }
}
