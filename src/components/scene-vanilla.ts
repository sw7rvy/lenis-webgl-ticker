import * as THREE from 'three'
import { subscribe, TICK_PRIORITY } from '@/lib/ticker'

export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )
  camera.position.z = 5

  const unsubscribe = subscribe((_time, deltaMs) => {
    update(deltaMs / 1000)
    renderer.render(scene, camera)
  }, TICK_PRIORITY.RENDER)

  function update(_delta: number) {}

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  resize()
  window.addEventListener('resize', resize)

  return {
    scene,
    camera,
    renderer,
    destroy() {
      unsubscribe()
      window.removeEventListener('resize', resize)
      renderer.dispose()
    },
  }
}
