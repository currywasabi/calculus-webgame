import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/old-standard-tt/400.css'
import '@fontsource/old-standard-tt/400-italic.css'
import '@fontsource/old-standard-tt/700.css'
import '@fontsource/nanum-myeongjo/400.css'
import '@fontsource/nanum-myeongjo/700.css'
import '@fontsource/nanum-myeongjo/800.css'
import './styles/tokens.css'
import './styles/app.css'
import { PuzzleScreen } from './ui/puzzle/PuzzleScreen'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PuzzleScreen />
  </StrictMode>,
)
