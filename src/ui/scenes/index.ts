import type { ComponentType } from 'react'
import type { SceneId } from '../../state/scene'
import { PuzzleScreen } from '../puzzle/PuzzleScreen'
import { IntroScene } from './IntroScene'

/** 화면 레지스트리. state/scene.ts의 SCENES에 추가한 화면은 여기에도 컴포넌트를 등록한다. */
export const SCENE_VIEWS: Record<SceneId, ComponentType> = {
  intro: IntroScene,
  puzzle: PuzzleScreen,
}
