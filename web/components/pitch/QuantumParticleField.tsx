'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COLOR = new THREE.Color('#6366f1')
const LINE_COLOR = new THREE.Color('#6366f1')
const CONNECTION_DISTANCE = 2
const DRIFT_SPEED = 0.08
const ROTATION_SPEED = 0.03
const BOUNDS = 8

function Particles({ count = 150 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const groupRef = useRef<THREE.Group>(null)

  const dummy = useMemo(() => new THREE.Object3D(), [])

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      pos[i3] = (Math.random() - 0.5) * BOUNDS * 2
      pos[i3 + 1] = (Math.random() - 0.5) * BOUNDS * 2
      pos[i3 + 2] = (Math.random() - 0.5) * BOUNDS
      vel[i3] = (Math.random() - 0.5) * DRIFT_SPEED
      vel[i3 + 1] = (Math.random() - 0.5) * DRIFT_SPEED
      vel[i3 + 2] = (Math.random() - 0.5) * DRIFT_SPEED * 0.5
    }
    return { positions: pos, velocities: vel }
  }, [count])

  // Pre-allocate line geometry buffer (max possible connections)
  const maxLines = count * 6
  const linePositions = useMemo(() => new Float32Array(maxLines * 6), [maxLines])
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    geo.setDrawRange(0, 0)
    return geo
  }, [linePositions])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const dt = Math.min(delta, 0.05)

    // Update particle positions
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] += velocities[i3] * dt * 60
      positions[i3 + 1] += velocities[i3 + 1] * dt * 60
      positions[i3 + 2] += velocities[i3 + 2] * dt * 60

      // Wrap around bounds
      for (let a = 0; a < 3; a++) {
        const bound = a === 2 ? BOUNDS * 0.5 : BOUNDS
        if (positions[i3 + a] > bound) positions[i3 + a] = -bound
        if (positions[i3 + a] < -bound) positions[i3 + a] = bound
      }

      dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2])
      dummy.scale.setScalar(0.04 + Math.sin(Date.now() * 0.001 + i) * 0.01)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true

    // Calculate connections
    let lineIdx = 0
    for (let i = 0; i < count && lineIdx < maxLines; i++) {
      const i3 = i * 3
      for (let j = i + 1; j < count && lineIdx < maxLines; j++) {
        const j3 = j * 3
        const dx = positions[i3] - positions[j3]
        const dy = positions[i3 + 1] - positions[j3 + 1]
        const dz = positions[i3 + 2] - positions[j3 + 2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < CONNECTION_DISTANCE) {
          const li = lineIdx * 6
          linePositions[li] = positions[i3]
          linePositions[li + 1] = positions[i3 + 1]
          linePositions[li + 2] = positions[i3 + 2]
          linePositions[li + 3] = positions[j3]
          linePositions[li + 4] = positions[j3 + 1]
          linePositions[li + 5] = positions[j3 + 2]
          lineIdx++
        }
      }
    }

    if (linesRef.current) {
      const attr = lineGeometry.getAttribute('position') as THREE.BufferAttribute
      attr.needsUpdate = true
      lineGeometry.setDrawRange(0, lineIdx * 2)
    }

    // Slow orbit rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEED * dt
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.0002) * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={PARTICLE_COLOR} transparent opacity={0.7} />
      </instancedMesh>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.08} />
      </lineSegments>
    </group>
  )
}

export default function QuantumParticleField() {
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsMobile(window.innerWidth < 768)
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: false }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={['#000000', 12, 25]} />
        <Particles count={isMobile ? 80 : 150} />
      </Canvas>
    </div>
  )
}
