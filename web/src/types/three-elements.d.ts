import { Object3DNode } from '@react-three/fiber'
import { LineSegments, BufferGeometry, BufferAttribute, Points, PointsMaterial, Mesh, SphereGeometry, MeshStandardMaterial, Group, PerspectiveCamera } from 'three'

declare module '@react-three/fiber' {
    interface ThreeElements {
        lineSegments: Object3DNode<LineSegments, typeof LineSegments>
        bufferGeometry: Object3DNode<BufferGeometry, typeof BufferGeometry>
        bufferAttribute: Object3DNode<BufferAttribute, typeof BufferAttribute>
        points: Object3DNode<Points, typeof Points>
        pointsMaterial: Object3DNode<PointsMaterial, typeof PointsMaterial>
        mesh: Object3DNode<Mesh, typeof Mesh>
        sphereGeometry: Object3DNode<SphereGeometry, typeof SphereGeometry>
        meshStandardMaterial: Object3DNode<MeshStandardMaterial, typeof MeshStandardMaterial>
        group: Object3DNode<Group, typeof Group>
        perspectiveCamera: Object3DNode<PerspectiveCamera, typeof PerspectiveCamera>
    }
}
