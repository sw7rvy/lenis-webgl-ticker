'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { subscribe, TICK_PRIORITY } from '@/lib/ticker'
import { scrollState } from '@/lib/scroll-state'

function TickerDriver() {
  const advance = useThree((s) => s.advance)
  const size = useThree((s) => s.size)

  useEffect(
    () => subscribe((time) => advance(time / 1000), TICK_PRIORITY.RENDER),
    [advance]
  )

  useEffect(() => {
    if (size.width > 0 && size.height > 0) advance(performance.now() / 1000)
  }, [advance, size.width, size.height])

  return null
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uProgress;
  uniform float uVelocity;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    uv.y += sin(uv.x * 6.2831 + uTime * 0.4) * 0.04 * uVelocity;

    float band = smoothstep(0.0, 0.6, 1.0 - abs(uv.x - uProgress) * 2.4);
    vec3 base = mix(vec3(0.043), vec3(0.09, 0.10, 0.13), uv.y);
    vec3 tint = mix(vec3(0.20, 0.35, 0.95), vec3(0.95, 0.35, 0.20), uProgress);

    gl_FragColor = vec4(base + tint * band * 0.35, 1.0);
  }
`

function RailPlane() {
  const material = useRef<THREE.ShaderMaterial>(null)
  const { viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uVelocity: { value: 0 },
      uTime: { value: 0 },
    }),
    []
  )

  useFrame((_state, delta) => {
    const u = material.current?.uniforms
    if (!u) return
    u.uProgress.value = scrollState.railProgress
    u.uVelocity.value = THREE.MathUtils.damp(
      u.uVelocity.value,
      THREE.MathUtils.clamp(scrollState.railVelocity / 2000, -1, 1),
      6,
      delta
    )
    u.uTime.value += delta
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}

export function Scene() {
  return (
    <Canvas className="scene" frameloop="never" dpr={[1, 2]}>
      <TickerDriver />
      <RailPlane />
    </Canvas>
  )
}
