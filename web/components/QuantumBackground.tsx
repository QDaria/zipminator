'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface QuantumProps {
  securityLevel?: number; // 1 to 5
}

function SuperpositionParticles({ securityLevel = 1 }: QuantumProps) {
  const ref = useRef<THREE.Points>(null!)
  const ghostRef = useRef<THREE.Points>(null!)

  const particlesCount = 5000 + (securityLevel * 1000)
  const { positions, ghostPositions } = useMemo(() => {
    // Client-side only check
    if (typeof window === 'undefined') return { positions: new Float32Array(0), ghostPositions: new Float32Array(0) }

    const pos = new Float32Array(particlesCount * 3)
    const ghost = new Float32Array(particlesCount * 3)
    for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3
        const x = (Math.random() - 0.5) * 12
        const y = (Math.random() - 0.5) * 12
        const z = (Math.random() - 0.5) * 12
        pos[i3] = x; pos[i3 + 1] = y; pos[i3 + 2] = z;
        
        // Superposition ghost slightly off
        ghost[i3] = x + 0.1; ghost[i3 + 1] = y + 0.1; ghost[i3 + 2] = z + 0.1;
    }
    return { positions: pos, ghostPositions: ghost }
  }, [particlesCount])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const speed = 0.05 * securityLevel
    
    if (ref.current) {
        ref.current.rotation.x = time * speed
        ref.current.rotation.y = time * speed * 1.5
    }
    if (ghostRef.current) {
        ghostRef.current.rotation.x = time * speed + Math.sin(time) * 0.02
        ghostRef.current.rotation.y = time * speed * 1.5 + Math.cos(time) * 0.02
        
        // Ghost opacity pulses to visualize superposition collapse
        if(ghostRef.current.material) {
            (ghostRef.current.material as THREE.PointsMaterial).opacity = (Math.sin(time * 3) * 0.5 + 0.5) * 0.3 * securityLevel
        }
    }
  })

  // Dynamic colors based on security (BMAD logic)
  const baseColor = securityLevel >= 4 ? '#b24bf3' : securityLevel >= 2 ? '#00e5ff' : '#6366f1' // Reward purple vs Action Cyan vs Default Base Indigo

  return (
    <group>
        <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
            <PointMaterial
                transparent
                color={baseColor}
                size={0.02}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.6}
                blending={THREE.AdditiveBlending}
            />
        </Points>
        {/* Superposition Ghosts appear at security level > 1 */}
        {securityLevel > 1 && (
            <Points ref={ghostRef} positions={ghostPositions} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#ff3366" // BMAD Trigger color
                    size={0.03}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.2}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        )}
    </group>
  )
}

function EntangledLines({ securityLevel = 1 }: QuantumProps) {
  const ref = useRef<THREE.LineSegments>(null!)

  const { connections } = useMemo(() => {
    const nodeCount = 80 + (securityLevel * 20)
    const positions = new Float32Array(nodeCount * 3)
    const connectionsArr = []

    // Sphere distribution
    for (let i = 0; i < nodeCount; i++) {
        const i3 = i * 3
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const r = 3 + Math.random() * 2

        positions[i3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        positions[i3 + 2] = r * Math.cos(phi)
    }

    // Increased threshold for higher entanglement links
    const threshold = 1.5 + (securityLevel * 0.2)
    for (let i = 0; i < nodeCount; i++) {
        const i3 = i * 3
        const x1 = positions[i3], y1 = positions[i3 + 1], z1 = positions[i3 + 2]
        for (let j = i + 1; j < nodeCount; j++) {
            const j3 = j * 3
            const x2 = positions[j3], y2 = positions[j3 + 1], z2 = positions[j3 + 2]
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2))

            if (distance < threshold) {
                connectionsArr.push(x1, y1, z1, x2, y2, z2)
            }
        }
    }

    return { connections: new Float32Array(connectionsArr) }
  }, [securityLevel])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (ref.current) {
        ref.current.rotation.y = time * (0.05 + securityLevel * 0.01)
        ref.current.rotation.x = Math.sin(time * 0.1) * 0.2
        
        // Intense entanglement strobing for high security connections
        if(securityLevel >= 3 && ref.current.material) {
            (ref.current.material as THREE.LineBasicMaterial).opacity = 0.15 + Math.sin(time * 5) * 0.1
        }
    }
  })

  // Security 4/5 = Investment Green. Security 2/3 = Trigger Red. Default = Indigo.
  const lineColor = securityLevel >= 4 ? '#39ff14' : securityLevel >= 2 ? '#ff3366' : '#6366f1'

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
            color={lineColor}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
        />
    </lineSegments>
  )
}

const QuantumBackground = ({ securityLevel = 1 }: QuantumProps) => {
  return (
    <div className="absolute inset-0 z-0">
        <Canvas
            camera={{ position: [0, 0, 5 + securityLevel * 0.5], fov: 75 }}
            className="w-full h-full block"
        >
            <ambientLight intensity={0.5} />
            <SuperpositionParticles securityLevel={securityLevel} />
            <EntangledLines securityLevel={securityLevel} />
        </Canvas>

        {/* Gradient Overlay matching BMAD themes */}
        <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${
           securityLevel >= 4 ? 'bg-gradient-to-b from-transparent via-obsidian-900/80 to-obsidian-950/95' :
           'bg-gradient-to-b from-transparent via-gray-950/50 to-gray-950'
        }`} />
    </div>
  )
}

export default QuantumBackground
