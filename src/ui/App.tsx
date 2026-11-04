import { useScene } from './game'
import { SCENE_VIEWS } from './scenes'

export function App() {
  const scene = useScene(s => s.scene)
  const View = SCENE_VIEWS[scene]
  return <View key={scene} />
}
