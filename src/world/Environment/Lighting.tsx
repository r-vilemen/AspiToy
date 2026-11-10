import { DustParticles } from './DustParticles';

/**
 * Iluminação Cinematográfica de Animação 3D (Seção 5 da Direção de Arte):
 * - Atmosfera aconchegante de fim de tarde entrando pelas janelas
 * - Contraste equilibrado com preenchimento suave para manter o AspiToy sempre legível
 * - Sombras suaves de alta definição (2048x2048) e feixes de luz natural com partículas
 */
export function Lighting() {
  return (
    <group name="cinematic-animation-lighting">
      {/* Luz ambiente suave para evitar sombras excessivamente duras */}
      <ambientLight intensity={0.52} color="#FBE6C8" />

      {/* Luz hemisférica: céu dourado solar e rebatedor quente do piso de madeira */}
      <hemisphereLight
        args={['#FFF0CC', '#7D4920', 0.92]}
        position={[0, 6.5, 0]}
      />

      {/* Luz direcional solar principal entrando pela janela alta (sombras suaves) */}
      <directionalLight
        castShadow
        position={[-6.2, 7.6, -2.4]}
        intensity={2.25}
        color="#FFF2C8"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-camera-left={-6.5}
        shadow-camera-right={6.5}
        shadow-camera-top={6.5}
        shadow-camera-bottom={-6.5}
        shadow-bias={-0.0003}
        shadow-radius={2.5}
      />

      {/* Luz complementar quente da área de leitura/estante (destaca volumes e mantém o robô legível) */}
      <pointLight
        position={[2.6, 3.2, 1.2]}
        intensity={0.75}
        distance={13}
        decay={1.6}
        color="#FFD9A0"
      />

      {/* Feixe volumétrico principal vindo da janela oeste */}
      <group position={[-3.5, 2.45, -1.25]} rotation={[0.1, 0, -0.46]}>
        <mesh>
          <cylinderGeometry args={[0.68, 1.65, 4.5, 18, 1, true]} />
          <meshBasicMaterial
            color="#FFF5C8"
            transparent
            opacity={0.09}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Feixe volumétrico secundário vindo da janela norte (atrás da poltrona) */}
      <group position={[1.85, 2.35, -2.85]} rotation={[0.38, 0, 0.08]}>
        <mesh>
          <cylinderGeometry args={[0.45, 1.05, 3.8, 16, 1, true]} />
          <meshBasicMaterial
            color="#FFF5C8"
            transparent
            opacity={0.065}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Poeira sutil flutuando nos feixes de luz solar */}
      <DustParticles />
    </group>
  );
}
