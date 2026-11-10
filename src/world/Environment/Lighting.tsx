import { ContactShadows } from '@react-three/drei';

export function Lighting() {
  return (
    <group name="cinematic-lighting">
      {/* 1. Iluminação hemisférica natural: sol matinal quente + rebote da madeira */}
      <hemisphereLight
        args={['#FFF7EB', '#8F6642', 0.95]}
        position={[0, 6, 0]}
      />

      {/* 2. Luz solar direta principal entrando pelas janelas laterais */}
      <directionalLight
        castShadow
        position={[7.2, 7.8, 3.8]}
        intensity={2.35}
        color="#FFF2D9"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0003}
      />

      {/* 3. Luz suave de preenchimento indireto no interior */}
      <pointLight
        position={[-3.5, 3.0, -1.8]}
        intensity={0.55}
        distance={12}
        color="#FFE5BF"
      />

      {/* 4. Luz de realce quente da luminária de piso */}
      <pointLight
        position={[-2.2, 1.6, 2.7]}
        intensity={0.4}
        distance={4.5}
        color="#FFDA9E"
      />

      {/* 5. Sombras de contato suaves junto ao piso */}
      <ContactShadows
        position={[0, 0.005, 0]}
        opacity={0.35}
        scale={14}
        blur={2.0}
        far={2.8}
        resolution={512}
        color="#342010"
      />
    </group>
  );
}
