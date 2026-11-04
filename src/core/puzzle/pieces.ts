/* ---------- pieces ---------- */
import type { ConstName, OpSymbol } from '../math/ast'

export type Cell = [number, number]

type Base = {
  id: string
  w: number
  h: number
  /** 기준선 행 오프셋: 판 위 기준선 ax = y + axis */
  axis: number
  /** 라벨 LaTeX */
  tex?: string
  /** 라벨 글자 크기 (칸 크기 배수) */
  em?: number
  /** 라벨 SVG를 조각 높이에 맞출 비율 (∫, 괄호) */
  fit?: number
  /** 직사각형이 아닌 조각의 칸 목록 (근호) */
  cells?: Cell[]
  /** 라벨 대신 그리는 선 */
  draw?: 'bar' | 'root'
  aria?: string
}

export type NumPiece = Base & { kind: 'num'; v: number }
export type ConstPiece = Base & { kind: 'const'; c: ConstName }
export type OpPiece = Base & { kind: 'op'; op: OpSymbol }
export type InfPiece = Base & { kind: 'inf'; sign: number }
export type PlainPiece = Base & { kind: 'lp' | 'rp' | 'gamma' | 'frac' | 'sqrt' | 'int' | 'negsq' | 'dx' }

export type PieceDef = NumPiece | ConstPiece | OpPiece | InfPiece | PlainPiece
export type PieceKind = PieceDef['kind']

export const rect = (w: number, h: number) => { const c: Cell[] = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) c.push([x, y]); return c }

/** 조각 생성 함수 (원본 P) */
export const P = {
  num: (id: string, v: number): PieceDef => ({ id, kind: 'num', v, tex: String(v), w: 2, h: 3, axis: 1, em: 1.6 }),
  con: (id: string, c: ConstName): PieceDef => ({ id, kind: 'const', c, tex: { e: 'e', 'π': '\\pi', i: 'i' }[c], w: 2, h: 3, axis: 1, em: 1.6 }),
  op: (id: string, op: OpSymbol): PieceDef => ({ id, kind: 'op', op, tex: { '+': '+', '−': '-', '×': '\\times' }[op], w: 1, h: 1, axis: 0, em: .9 }),
  lp: (id: string): PieceDef => ({ id, kind: 'lp', tex: '(', w: 1, h: 3, axis: 1, fit: .82 }),
  rp: (id: string): PieceDef => ({ id, kind: 'rp', tex: ')', w: 1, h: 3, axis: 1, fit: .82 }),
  gamma: (id: string): PieceDef => ({ id, kind: 'gamma', tex: '\\Gamma', w: 2, h: 3, axis: 1, em: 1.6 }),
  frac: (id: string, w: number): PieceDef => ({ id, kind: 'frac', w, h: 1, axis: 0, draw: 'bar', aria: '분수 막대' }),
  sqrt: (id: string, w: number, h: number): PieceDef => {
    const cells: Cell[] = []; for (let y = 0; y < h; y++) cells.push([0, y]); for (let x = 1; x < w; x++) cells.push([x, 0])
    return { id, kind: 'sqrt', w, h, axis: h - 2, cells, draw: 'root', aria: '근호' }
  },
  int: (id: string): PieceDef => ({ id, kind: 'int', tex: '\\displaystyle\\int', w: 1, h: 5, axis: 2, fit: .9 }),
  inf: (id: string, s: number): PieceDef => ({ id, kind: 'inf', sign: s, tex: s > 0 ? '\\infty' : '-\\infty', w: 2, h: 1, axis: 0, em: .92 }),
  nsq: (id: string): PieceDef => ({ id, kind: 'negsq', tex: '-x^{2}', w: 2, h: 1, axis: 0, em: .8 }),
  dx: (id: string): PieceDef => ({ id, kind: 'dx', tex: 'dx', w: 2, h: 3, axis: 1, em: 1.3 }),
}

/** 퍼즐 JSON의 선언형 조각: { "type": "num", "id": "a", "v": 3 } */
export type PieceSpec =
  | { type: 'num'; id: string; v: number }
  | { type: 'const'; id: string; c: ConstName }
  | { type: 'op'; id: string; op: OpSymbol }
  | { type: 'frac'; id: string; w: number }
  | { type: 'sqrt'; id: string; w: number; h: number }
  | { type: 'inf'; id: string; sign: number }
  | { type: 'lp' | 'rp' | 'gamma' | 'int' | 'negsq' | 'dx'; id: string }

export function buildPiece(s: PieceSpec): PieceDef {
  switch (s.type) {
    case 'num': return P.num(s.id, s.v)
    case 'const': return P.con(s.id, s.c)
    case 'op': return P.op(s.id, s.op)
    case 'frac': return P.frac(s.id, s.w)
    case 'sqrt': return P.sqrt(s.id, s.w, s.h)
    case 'inf': return P.inf(s.id, s.sign)
    case 'lp': return P.lp(s.id)
    case 'rp': return P.rp(s.id)
    case 'gamma': return P.gamma(s.id)
    case 'int': return P.int(s.id)
    case 'negsq': return P.nsq(s.id)
    case 'dx': return P.dx(s.id)
  }
}

export type Note = { kind: string; text?: string; tex?: string }

export type Level = {
  title: string
  /** 목표 [LaTeX, 값] */
  goal: { tex: string; value: number }
  notes: Note[]
  pieces: PieceDef[]
  /** 정답 배치 {조각id: [x, y]} */
  sol: Record<string, Cell>
}
