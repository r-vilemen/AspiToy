export function Lighting() {
  return (
    <group name="ps2-retro-lighting">
      {/* Luz ambiente quente característica de jogos 3D do início dos anos 2000 */}
      <ambientLight intensity={0.62} color="#F7DEC0" />

      {/* Luz hemisférica saturada: topo dourado solar e base âmbar amadeirada */}
      <hemisphereLight
        args={['#FFE8B8', '#7A4419', 0.85]}
        position={[0, 6, 0]}
      />

      {/* Luz direcional principal vinda da janela alta esquerda/fundo (sombras definidas PS2) */}
      <directionalLight
        castShadow
        position={[-5.8, 7.2, -2.2]}
        intensity={2.15}
        color="#FFF0C2"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-camera-left={-6.5}
        shadow-camera-right={6.5}
        shadow-camera-top={6.5}
        shadow-camera-bottom={-6.5}
        shadow-bias={-0.0005}
      />

      {/* Preenchimento quente secundário do interior do quarto/sala */}
      <pointLight
        position={[2.5, 3.4, 1.5]}
        intensity={0.55}
        distance={14}
        color="#FFD699"
      />

      {/* Feixes volumétricos de luz solar (Sunbeams estilo PS2 entrando pela janela alta) */}
      <group position={[-3.6, 2.5, -1.3]} rotation={[0.12, 0, -0.48]}>
        <mesh>
          <cylinderGeometry args={[0.65, 1.55, 4.4, 12, 1, true]} />
          <meshBasicMaterial
            color="#FFF4C2"
            transparent
            opacity={0.11}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
