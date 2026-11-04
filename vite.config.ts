import { cpSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

// 원본 프로토타입을 비교용으로 dist/prototype/ 에 그대로 복사한다.
const copyPrototype = (): Plugin => ({
  name: 'copy-prototype',
  apply: 'build',
  closeBundle() {
    cpSync('prototype', 'dist/prototype', { recursive: true })
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: '/calculus-webgame/',
  plugins: [react(), copyPrototype()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
