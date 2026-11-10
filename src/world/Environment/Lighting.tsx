import { ContactShadows } from '@react-three/drei';

export function Lighting() {
  return (
    <group name="cinematic-lighting">
      {/* Iluminação hemisférica natural: céu matinal quente + rebote de madeira */}
      <hemisphereLight
        args={['#FFF8EB', '#9C734B', 0.85]}
        position={[0, 6, 0]}
      />

      {/* Luz solar principal entrando pela janela lateral direita */}
      <directionalLight
        castShadow
        position={[6.5, 7.5, 3.5]}
        intensity={2.1}
        color="#FFF1D6"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-camera-left={-6.5}
        shadow-camera-right={6.5}
        shadow-camera-top={6.5}
        shadow-camera-bottom={-6.5}
        shadow-bias={-0.0004}
      />

      {/* Preenchimento indireto suave do interior da sala */}
      <pointLight
        position={[-3.2, 2.8, -1.8]}
        intensity={0.65}
        distance={11}
        color="#FFE4B8"
      />

      {/* Sombras de contato suaves junto ao piso para ancorar os objetos */}
      <ContactShadows
        position={[0, 0.005, 0]}
        opacity={0.32}
        scale={13}
        blur={2.1}
        far={2.5}
        resolution={512}
        color="#3D2614"
      />
    </group>
  );
}

