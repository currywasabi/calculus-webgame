/* 수식 트리 노드 (판별 유니온, 판별자 t) */

export type ConstName = 'e' | 'π' | 'i'
export type OpSymbol = '+' | '−' | '×'
/** 'imp' = 인접한 피연산자의 암묵적 곱셈 */
export type BinOp = OpSymbol | 'imp'

export type NumNode = { t: 'num'; v: number }
export type ConstNode = { t: 'const'; c: ConstName }
export type InfNode = { t: 'inf'; sign: number }
/** 적분 안의 -x² 조각 */
export type NegSqNode = { t: 'negsq' }
/** 저작된 풀이 단계(가우스 적분)의 LaTeX 그대로 */
export type RawNode = { t: 'raw'; tex: string }
export type GroupNode = { t: 'group'; a: Node }
export type NegNode = { t: 'neg'; a: Node }
export type DivNode = { t: 'div'; a: Node; b: Node }
export type BinNode = { t: 'bin'; op: BinOp; a: Node; b: Node }
export type PowNode = { t: 'pow'; b: Node; e: Node }
export type SqrtNode = { t: 'sqrt'; a: Node }
export type GammaNode = { t: 'gamma'; a: Node }
export type FactNode = { t: 'fact'; a: Node }
export type IntNode = { t: 'int'; lo: Node; hi: Node; body: Node }

export type Node =
  | NumNode
  | ConstNode
  | InfNode
  | NegSqNode
  | RawNode
  | GroupNode
  | NegNode
  | DivNode
  | BinNode
  | PowNode
  | SqrtNode
  | GammaNode
  | FactNode
  | IntNode

/** 정수 분수 a/b (재작성 엔진의 유리수 리터럴) */
export type RatNode = { t: 'div'; a: NumNode; b: NumNode }
export type Lit = NumNode | RatNode

export const isNum = (n: Node): n is NumNode => n.t === 'num'
