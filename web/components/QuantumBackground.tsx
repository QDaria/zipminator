'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function QuantumParticles() {
  const ref = useRef<THREE.Points>(null!)

  const particlesCount = 5000
  const positions = useMemo(() => {
    // Ensure consistent generation or client-side only
    if (typeof window === 'undefined') return new Float32Array(0)

    const positions = new Float32Array(particlesCount * 3)
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 10
      positions[i3 + 1] = (Math.random() - 0.5) * 10
      positions[i3 + 2] = (Math.random() - 0.5) * 10
    }
    return positions
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (ref.current) {
      ref.current.rotation.x = time * 0.05
      ref.current.rotation.y = time * 0.075
    }
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#6366f1"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

function QuantumLines() {
  const ref = useRef<THREE.LineSegments>(null!)

  const { positions, connections } = useMemo(() => {
    const nodeCount = 100
    const positions = new Float32Array(nodeCount * 3)
    const connections = []

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      const i3 = i * 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 3 + Math.random() * 2

      positions[i3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = r * Math.cos(phi)
    }

    // Create connections between nearby nodes
    for (let i = 0; i < nodeCount; i++) {
      const i3 = i * 3
      const x1 = positions[i3]
      const y1 = positions[i3 + 1]
      const z1 = positions[i3 + 2]

      for (let j = i + 1; j < nodeCount; j++) {
        const j3 = j * 3
        const x2 = positions[j3]
        const y2 = positions[j3 + 1]
        const z2 = positions[j3 + 2]

        const distance = Math.sqrt(
          Math.pow(x2 - x1, 2) +
          Math.pow(y2 - y1, 2) +
          Math.pow(z2 - z1, 2)
        )

        if (distance < 1.5) {
          connections.push(x1, y1, z1, x2, y2, z2)
        }
      }
    }

    return { positions, connections: new Float32Array(connections) }
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (ref.current) {
      ref.current.rotation.y = time * 0.05
      ref.current.rotation.x = Math.sin(time * 0.1) * 0.2
    }
  })

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={connections.length / 3}
          array={connections}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#6366f1"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  )
}

const QuantumBackground = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <QuantumParticles />
        <QuantumLines />
      </Canvas>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/50 to-gray-950 pointer-events-none" />
    </div>
  )
}

export default QuantumBackground
