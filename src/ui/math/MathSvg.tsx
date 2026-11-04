import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { mathjax } from 'mathjax-full/js/mathjax.js'
import { TeX } from 'mathjax-full/js/input/tex.js'
import { SVG } from 'mathjax-full/js/output/svg.js'
import { browserAdaptor } from 'mathjax-full/js/adaptors/browserAdaptor.js'
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js'
import 'mathjax-full/js/input/tex/base/BaseConfiguration.js'
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js'

// fontCache: 'none' + 보조 MathML 끔: 이 둘을 빼면 수식이 두 번 보인다.
// 보조 MathML은 AssistiveMmlHandler를 등록하지 않는 것으로 끈다.
const adaptor = browserAdaptor()
RegisterHTMLHandler(adaptor)
const output = new SVG({ fontCache: 'none' })
const doc = mathjax.document(document, { InputJax: new TeX({ packages: ['base', 'ams'] }), OutputJax: output })
document.head.appendChild(output.styleSheet(doc) as HTMLStyleElement)

const cache = new Map<string, Element>()

/** TeX → mjx-container (캐시에서 복제). 실패하면 원문 TeX를 담은 span. */
function mj(tex: string, display = false): Element {
  const k = (display ? 'D' : 'I') + tex
  let n = cache.get(k)
  if (!n) {
    try { n = doc.convert(tex, { display }) as Element }
    catch { n = document.createElement('span'); n.className = 'rawtex'; n.textContent = tex }
    cache.set(k, n)
  }
  return n.cloneNode(true) as Element
}

type Props = {
  tex: string
  display?: boolean
  as?: 'span' | 'div'
  className?: string
  style?: CSSProperties
  /** ∫·괄호: SVG를 W×H 상자의 높이 비율 ratio에 맞춘다 (원본 fit) */
  fit?: { W: number; H: number; ratio: number }
}

export function MathSvg({ tex, display = false, as: Tag = 'span', className, style, fit }: Props) {
  const ref = useRef<HTMLElement>(null)
  const fW = fit?.W, fH = fit?.H, fR = fit?.ratio
  useLayoutEffect(() => {
    const host = ref.current
    if (!host) return
    const node = mj(tex, display)
    host.replaceChildren(node)
    const svg = node.querySelector('svg')
    if (svg && fW && fH && fR) {
      const wx = parseFloat(svg.getAttribute('width')!), hx = parseFloat(svg.getAttribute('height')!)
      if (wx && hx) {
        const r = wx / hx; let h = fH * fR, w = h * r
        if (w > fW * .92) { w = fW * .92; h = w / r }
        svg.setAttribute('width', w + 'px'); svg.setAttribute('height', h + 'px'); svg.style.verticalAlign = '0'
      }
    }
  }, [tex, display, fW, fH, fR])
  return <Tag ref={ref as never} className={className} style={style} />
}
