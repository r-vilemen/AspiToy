import { forwardRef, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { sharedMaterials, WORLD_PALETTE } from '../Environment/Materials';
import type { RobotExpression, RobotOperationalState, RobotSkinId } from '@/types/robot';
import { ROBOT_SKINS, robotMotionBridge, useRobotStore } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';

interface RobotModelProps {
  wheelSpin?: number;
  pitch?: number;
  roll?: number;
  bobY?: number;
  bumperCompression?: number;
  state?: RobotOperationalState;
  expression?: RobotExpression;
  skinId?: RobotSkinId;
}

/**
 * Protagonista AspiToy — Design Industrial de Personagem de Animação 3D:
 * - Corpo circular com suporte a skins customizáveis da Oficina Toy Box (Clássico, Patrulheiro, Xerife, Cyber)
 * - Faróis ópticos frontais com feixe luminoso no piso para o modo noturno e operações
 * - Para-choque frontal articulado com amortecimento
 * - Compartimento traseiro translúcido de coleta de pó
 * - Torre óptica de sensores ToF/LiDAR com anel luminoso de estado
 * - Visor OLED curvo comunicando 7 estados emocionais distintos
 */
const scratchLensColor = new THREE.Color();

export const RobotModel = forwardRef<THREE.Group, RobotModelProps>(function RobotModel(
  {
    wheelSpin = 0,
    pitch = 0,
    roll = 0,
    bobY = 0,
    bumperCompression = 0,
    state = 'IDLE',
    expression = 'neutral',
    skinId,
  },
  ref
) {
  const currentSkinId = useRobotStore((s) => s.skin);
  const activeSkinId = skinId ?? currentSkinId;

  const mastMeshRef = useRef<THREE.Mesh>(null);
  const rotorHeadRef = useRef<THREE.Group>(null);
  const bladesGroupRef = useRef<THREE.Group>(null);
  const blurRingRef = useRef<THREE.Group>(null);
  const headlightSpotRef = useRef<THREE.SpotLight>(null);
  const headlightFillRef = useRef<THREE.PointLight>(null);
  const headlightLensMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame((_, delta) => {
    const ext = robotMotionBridge.propellerExtension;
    const speed = robotMotionBridge.propellerSpeed;

    // Transição suave dos faróis do robô (acende de noite e apaga de dia sem recompilar shaders)
    const isNightNow = useEnvironmentStore.getState().timeOfDay === 'night';
    const isRechargingNow = useRobotStore.getState().state === 'RECHARGING';
    const isHeadlightOn = isNightNow && !isRechargingNow;

    const targetSpot = isHeadlightOn ? 3.4 : 0;
    const targetFill = isHeadlightOn ? 0.9 : 0;
    const targetLensOpacity = isHeadlightOn ? 0.95 : 0.25;
    const targetLensColorHex = isHeadlightOn ? '#FEF08A' : '#78716C';
    const lensAlpha = 1 - Math.exp(-1.2 * delta);

    if (headlightSpotRef.current) {
      headlightSpotRef.current.intensity = THREE.MathUtils.damp(
        headlightSpotRef.current.intensity,
        targetSpot,
        1.2,
        delta
      );
    }

    if (headlightFillRef.current) {
      headlightFillRef.current.intensity = THREE.MathUtils.damp(
        headlightFillRef.current.intensity,
        targetFill,
        1.2,
        delta
      );
    }

    headlightLensMatRefs.current.forEach((mat) => {
      if (!mat) return;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, targetLensOpacity, 1.2, delta);
      mat.color.lerp(scratchLensColor.set(targetLensColorHex), lensAlpha);
    });

    // Altura total da extensão telescópica (de 0.012m recolhido a 0.138m totalmente estendido)
    const currentMastHeight = 0.012 + ext * 0.126;

    // Atualiza o mastro: a base fica permanentemente ancorada no colar (y=0.005) e o topo atinge o rotor
    if (mastMeshRef.current) {
      if (ext < 0.01) {
        mastMeshRef.current.visible = false;
      } else {
        mastMeshRef.current.visible = true;
        mastMeshRef.current.scale.set(1, currentMastHeight, 1);
        // O cilindro unitário de altura 1 tem centro em currentMastHeight / 2
        mastMeshRef.current.position.y = 0.005 + currentMastHeight / 2;
      }
    }

    // Atualiza a cabeça do rotor no topo exato do mastro telescópico (ZERO gap flutuante!)
    if (rotorHeadRef.current) {
      if (ext < 0.01) {
        rotorHeadRef.current.visible = false;
      } else {
        rotorHeadRef.current.visible = true;
        rotorHeadRef.current.position.y = 0.005 + currentMastHeight;
        // As pás se desdobram suavemente ao erguer o mastro
        const bladeScale = Math.min(1.0, ext * 1.3);
        rotorHeadRef.current.scale.set(bladeScale, bladeScale, bladeScale);
      }
    }

    // Rotação contínua de alta rotação das pás
    if (bladesGroupRef.current && speed > 0.01) {
      bladesGroupRef.current.rotation.y += delta * speed;
    }

    // Vórtice dinâmico de desfoque óptico (motion blur suave, sem parecer um prato branco)
    if (blurRingRef.current) {
      const tipMesh = blurRingRef.current.children[0] as THREE.Mesh | undefined;
      const innerMesh = blurRingRef.current.children[1] as THREE.Mesh | undefined;
      if (tipMesh && innerMesh) {
        const tipMat = tipMesh.material as THREE.MeshBasicMaterial;
        const innerMat = innerMesh.material as THREE.MeshBasicMaterial;
        if (tipMat && innerMat) {
          const blurFactor = Math.min(1.0, speed / 40);
          tipMat.opacity = blurFactor * 0.28;
          innerMat.opacity = blurFactor * 0.12;
        }
      }
    }
  });

  const skin = ROBOT_SKINS[activeSkinId] ?? ROBOT_SKINS.classic;

  // Alvo óptico posicionado na frente (+Z) e rente ao piso (-Y) para o feixe do SpotLight
  const lightTarget = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(0, -0.06, 1.8);
    return obj;
  }, []);

  // Materiais dinâmicos derivados da Skin equipada na Oficina Toy Box
  const skinMaterials = useMemo(() => {
    return {
      shell: new THREE.MeshPhysicalMaterial({
        color: skin.shellColor,
        roughness: skin.isTranslucent ? 0.18 : 0.35,
        metalness: 0.05,
        clearcoat: skin.isTranslucent ? 0.85 : 0.35,
        transparent: !!skin.isTranslucent,
        opacity: skin.isTranslucent ? 0.74 : 1.0,
        transmission: skin.isTranslucent ? 0.45 : 0,
      }),
      coralTrim: new THREE.MeshStandardMaterial({
        color: skin.coralTrimColor,
        roughness: 0.38,
        metalness: 0.1,
      }),
      blueTrim: new THREE.MeshStandardMaterial({
        color: skin.blueTrimColor,
        roughness: 0.4,
        metalness: 0.08,
      }),
      yellowTrim: new THREE.MeshStandardMaterial({
        color: skin.yellowTrimColor,
        roughness: 0.35,
        metalness: 0.08,
      }),
    };
  }, [skin]);

  const statusColor =
    state === 'CLEANING'
      ? skin.coralTrimColor
      : state === 'ORGANIZING'
        ? '#F59E0B'
        : state === 'AVOIDING' || state === 'PAUSED'
          ? WORLD_PALETTE.ledAmber
          : state === 'RETURNING'
            ? '#F97316'
            : state === 'COMPLETED'
              ? WORLD_PALETTE.ledEmerald
              : skin.eyeColor;

  const eyeColor =
    expression === 'alert'
      ? WORLD_PALETTE.ledAmber
      : expression === 'worried'
        ? '#FB923C'
        : expression === 'happy'
          ? '#4ADE80'
          : expression === 'focused'
            ? skin.eyeColor
            : skin.eyeColor;

  // Parametrização das 7 expressões faciais integradas ao visor industrial
  const eyeScaleY =
    expression === 'sleepy'
      ? 0.22
      : expression === 'focused'
        ? 0.68
        : expression === 'happy'
          ? 0.55
          : expression === 'alert'
            ? 1.22
            : 1.0;

  const eyeScaleX =
    expression === 'alert' ? 1.15 : expression === 'curious' ? 1.08 : 1.0;

  const browTilt =
    expression === 'focused'
      ? 0.24
      : expression === 'worried'
        ? -0.28
        : expression === 'alert'
          ? -0.18
          : expression === 'curious'
            ? 0.14
            : 0;

  const leftEyeScaleY =
    expression === 'curious' ? eyeScaleY * 1.18 : eyeScaleY;
  const rightEyeScaleY =
    expression === 'curious' ? eyeScaleY * 0.82 : eyeScaleY;

  return (
    <group ref={ref} name="aspitoy-protagonist-model">
      {/* ======================================================== */}
      {/* SOMBRA DE CONTATO SUAVE EM DUAS CAMADAS                  */}
      {/* ======================================================== */}
      <group position={[0, 0.006, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.32, 32]} />
          <meshBasicMaterial
            color="#1B0C02"
            transparent
            opacity={0.44}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.23, 28]} />
          <meshBasicMaterial
            color="#0F0601"
            transparent
            opacity={0.38}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Corpo articulado com física de suspensão (pitch, roll, bobY) */}
      <group position={[0, 0.098 + bobY, 0]} rotation={[pitch, 0, roll]}>
        {/* 1. CHASSI PRINCIPAL ARREDONDADO DE ACABAMENTO INDUSTRIAL */}
        <mesh castShadow receiveShadow material={skinMaterials.shell}>
          <cylinderGeometry args={[0.268, 0.284, 0.118, 36]} />
        </mesh>

        {/* Cúpula superior suavemente boleada */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 0.058, 0]}
          scale={[1, 0.22, 1]}
          material={skinMaterials.shell}
        >
          <sphereGeometry args={[0.266, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>

        {/* Anel de acabamento superior */}
        <mesh
          castShadow
          position={[0, 0.064, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={skinMaterials.coralTrim}
        >
          <torusGeometry args={[0.22, 0.016, 14, 36]} />
        </mesh>

        {/* Painel de controle superior com botão de acionamento iluminado */}
        <group position={[0, 0.088, 0.095]}>
          <mesh castShadow material={skinMaterials.yellowTrim}>
            <cylinderGeometry args={[0.038, 0.044, 0.016, 24]} />
          </mesh>
          <mesh position={[0, 0.0095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.022, 0.03, 20]} />
            <meshBasicMaterial color={statusColor} />
          </mesh>
        </group>

        {/* 2. PARA-CHOQUE FRONTAL COM FARÓIS ÓPTICOS E AMORTECIMENTO */}
        <group position={[0, -0.004, 0.012 - bumperCompression]}>
          {/* Carenagem frontal do amortecedor */}
          <mesh castShadow material={skinMaterials.blueTrim}>
            <cylinderGeometry
              args={[
                0.292,
                0.292,
                0.092,
                32,
                1,
                false,
                -Math.PI * 0.44,
                Math.PI * 0.88,
              ]}
            />
          </mesh>

          {/* FARÓIS ÓPTICOS FRONTAIS LED (ACESOS À NOITE, PÔR DO SOL OU EM OPERAÇÃO) */}
          <group position={[0, 0.012, 0.286]}>
            {/* Adiciona o alvo local à árvore de cena para que rotacione e se mova perfeitamente com o robô */}
            <primitive object={lightTarget} />

            {[-0.105, 0.105].map((lx, idx) => (
              <group key={idx} position={[lx, 0, 0]}>
                {/* Aro metálico cromado do farol */}
                <mesh rotation={[Math.PI / 2, 0, 0]} material={sharedMaterials.metalChrome}>
                  <torusGeometry args={[0.022, 0.0045, 8, 16]} />
                </mesh>
                {/* Lente convexa iluminada com brilho visual proporcional */}
                <mesh position={[0, 0, 0.003]} rotation={[Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.019, 16]} />
                  <meshBasicMaterial
                    ref={(el) => {
                      headlightLensMatRefs.current[idx] = el;
                    }}
                    color="#78716C"
                    transparent
                    opacity={0.25}
                  />
                </mesh>
              </group>
            ))}

            {/* Feixe direcional cônico iluminando o piso à frente do robô */}
            <group position={[0, 0.02, 0.01]}>
              <spotLight
                ref={headlightSpotRef}
                target={lightTarget}
                intensity={0}
                distance={5.8}
                angle={Math.PI / 4.2}
                penumbra={0.7}
                color="#FFFDF0"
                castShadow={false}
              />
              {/* Luz suave de preenchimento do solo imediato à frente do para-choque */}
              <pointLight
                ref={headlightFillRef}
                position={[0, -0.01, 0.15]}
                intensity={0}
                distance={1.6}
                decay={1.8}
                color="#FEF9C3"
              />
            </group>
          </group>

          {/* Faixa emborrachada de impacto na parte inferior do para-choque */}
          <mesh
            position={[0, -0.026, 0]}
            material={sharedMaterials.robotRubberBumper}
          >
            <cylinderGeometry
              args={[
                0.297,
                0.297,
                0.028,
                32,
                1,
                false,
                -Math.PI * 0.45,
                Math.PI * 0.9,
              ]}
            />
          </mesh>
          {/* Sensores infravermelhos laterais embutidos no para-choque */}
          {[-0.21, 0.21].map((sx, idx) => (
            <mesh
              key={idx}
              position={[sx, 0.01, 0.2]}
              rotation={[0, (idx === 0 ? -1 : 1) * 0.65, 0]}
              material={sharedMaterials.metalChrome}
            >
              <sphereGeometry args={[0.014, 12, 12]} />
            </mesh>
          ))}
        </group>

        {/* 3. COMPARTIMENTO TRASEIRO TRANSLÚCIDO DE LIMPEZA (DUSTBIN) */}
        <group position={[0, 0.012, -0.175]}>
          <RoundedBox
            castShadow
            args={[0.24, 0.086, 0.14]}
            radius={0.025}
            smoothness={3}
            material={sharedMaterials.robotDustBin}
          />
          {/* Filtro HEPA visível dentro do compartimento translúcido */}
          <RoundedBox
            args={[0.14, 0.048, 0.06]}
            radius={0.01}
            smoothness={2}
            position={[0, 0, 0.01]}
            material={skinMaterials.yellowTrim}
          />
          {/* Alça metálica de liberação do reservatório */}
          <RoundedBox
            args={[0.09, 0.016, 0.02]}
            radius={0.005}
            smoothness={2}
            position={[0, 0.046, -0.05]}
            material={sharedMaterials.metalChrome}
          />
          {/* Aletas laterais de exaustão de ar */}
          {[-0.08, -0.04, 0.04, 0.08].map((vx, i) => (
            <mesh
              key={i}
              position={[vx, -0.01, -0.072]}
              material={sharedMaterials.robotRubberBumper}
            >
              <boxGeometry args={[0.018, 0.042, 0.008]} />
            </mesh>
          ))}
        </group>

        {/* 4. TORRE DE SENSORES LIDAR / TOF E INDICADOR LUMINOSO */}
        <group position={[0, 0.088, -0.035]}>
          {/* Base cônica da torre de navegação */}
          <mesh castShadow material={skinMaterials.blueTrim}>
            <cylinderGeometry args={[0.068, 0.086, 0.044, 28]} />
          </mesh>
          {/* Disco óptico giratório cromado */}
          <mesh
            position={[0, 0.026, 0]}
            rotation={[0, wheelSpin * 1.5, 0]}
            material={sharedMaterials.metalChrome}
          >
            <cylinderGeometry args={[0.058, 0.058, 0.016, 24]} />
          </mesh>
          {/* Capô protetor superior da torre com anel de status LED */}
          <mesh
            castShadow
            position={[0, 0.04, 0]}
            material={skinMaterials.coralTrim}
          >
            <cylinderGeometry args={[0.062, 0.066, 0.014, 28]} />
          </mesh>
          <mesh position={[0, 0.049, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.038, 0.054, 24]} />
            <meshBasicMaterial color={statusColor} />
          </mesh>

          {/* HÉLICE RETRÁTIL DO MODO ASPI-HELICÓPTERO (SISTEMA TELESCÓPICO DE ALTA PRECISÃO) */}
          <group position={[0, 0.048, 0]}>
            {/* Colar mecânico fixo no topo da torre LIDAR (porta de saída telescópica) */}
            <mesh position={[0, 0.003, 0]} material={sharedMaterials.robotRubberBumper}>
              <cylinderGeometry args={[0.02, 0.024, 0.008, 24]} />
            </mesh>
            <mesh position={[0, 0.007, 0]} material={sharedMaterials.metalChrome}>
              <cylinderGeometry args={[0.014, 0.015, 0.004, 24]} />
            </mesh>

            {/* Mastro telescópico contínuo ancorado no colar */}
            <mesh
              ref={mastMeshRef}
              position={[0, 0.01, 0]}
              material={sharedMaterials.metalChrome}
            >
              <cylinderGeometry args={[0.008, 0.01, 1, 16]} />
            </mesh>

            {/* Conjunto do Rotor e Pás (posicionado dinamicamente no topo do mastro) */}
            <group ref={rotorHeadRef} position={[0, 0.012, 0]}>
              {/* Hub central do rotor */}
              <mesh position={[0, 0.008, 0]} material={skinMaterials.coralTrim}>
                <cylinderGeometry args={[0.024, 0.02, 0.016, 20]} />
              </mesh>
              {/* Spinner cônico superior aerodinâmico */}
              <mesh position={[0, 0.02, 0]} material={skinMaterials.yellowTrim}>
                <coneGeometry args={[0.014, 0.018, 18]} />
              </mesh>

              {/* Conjunto rotativo de alta velocidade (gira com speed da hélice) */}
              <group ref={bladesGroupRef} position={[0, 0.012, 0]}>
                {/* Barra estabilizadora transversal (Flybar estilo helicóptero de brinquedo Pixar) */}
                <group rotation={[0, Math.PI / 4, 0]}>
                  <mesh material={sharedMaterials.metalChrome} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.003, 0.003, 0.22, 12]} />
                  </mesh>
                  {/* Pesos esferoidais cromados nas extremidades da flybar */}
                  {[-0.11, 0.11].map((fx, i) => (
                    <mesh key={i} position={[fx, 0, 0]} material={sharedMaterials.metalChrome}>
                      <sphereGeometry args={[0.007, 12, 12]} />
                    </mesh>
                  ))}
                </group>

                {/* Duas pás aerodinâmicas principais de alta sustentação (52cm de envergadura) */}
                {[-1, 1].map((dir, i) => (
                  <group key={i} position={[dir * 0.018, 0, 0]} rotation={[0, dir === 1 ? 0 : Math.PI, 0]}>
                    {/* Haste/raiz de fixação da pá no cubo */}
                    <mesh position={[0.02, 0, 0]} material={sharedMaterials.metalChrome}>
                      <boxGeometry args={[0.024, 0.006, 0.012]} />
                    </mesh>
                    {/* Corpo aerodinâmico da pá com passo positivo */}
                    <group position={[0.13, 0, 0]} rotation={[0.12, 0, 0]}>
                      <RoundedBox
                        args={[0.22, 0.004, 0.038]}
                        radius={0.002}
                        smoothness={2}
                        material={sharedMaterials.robotRubberBumper}
                      />
                      {/* Faixa de segurança amarela vibrante na ponta da pá */}
                      <mesh position={[0.095, 0.0005, 0]} material={skinMaterials.yellowTrim}>
                        <boxGeometry args={[0.032, 0.005, 0.038]} />
                      </mesh>
                    </group>
                  </group>
                ))}

                {/* Vórtice dinâmico translúcido de rotação (Motion Blur Arc) */}
                <group ref={blurRingRef} rotation={[-Math.PI / 2, 0, 0]}>
                  {/* Anel de ponta de pá de alta rotação */}
                  <mesh>
                    <ringGeometry args={[0.22, 0.265, 48]} />
                    <meshBasicMaterial
                      color="#E2E8F0"
                      transparent
                      opacity={0}
                      depthWrite={false}
                      side={THREE.DoubleSide}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                  {/* Disco interno aveludado de fluxo de ar */}
                  <mesh>
                    <ringGeometry args={[0.06, 0.22, 36]} />
                    <meshBasicMaterial
                      color="#CBD5E1"
                      transparent
                      opacity={0}
                      depthWrite={false}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* 5. VISOR CURVO OLED INTEGRADO E FACE EXPRESSIVA (7 ESTADOS) */}
        <group position={[0, 0.018, 0.258]}>
          {/* Moldura externa do visor integrada ao chassi */}
          <RoundedBox
            args={[0.246, 0.086, 0.048]}
            radius={0.022}
            smoothness={4}
            material={sharedMaterials.robotRubberBumper}
          />
          {/* Tela vítrea escura de alto brilho (clearcoat) */}
          <RoundedBox
            args={[0.228, 0.072, 0.044]}
            radius={0.018}
            smoothness={4}
            position={[0, 0, 0.005]}
            material={sharedMaterials.robotVisor}
          />

          {/* Olho Esquerdo Expressivo */}
          <group
            position={[-0.054, 0.002, 0.028]}
            scale={[eyeScaleX, leftEyeScaleY, 1]}
          >
            <RoundedBox args={[0.04, 0.044, 0.006]} radius={0.012} smoothness={3}>
              <meshBasicMaterial color={eyeColor} />
            </RoundedBox>
            {/* Brilho especular vivo na pupila */}
            {expression !== 'sleepy' && (
              <mesh position={[0.009, 0.01, 0.004]}>
                <circleGeometry args={[0.006, 12]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            )}
            {/* Sobrancelha luminosa expressiva */}
            {browTilt !== 0 && (
              <mesh
                position={[0, 0.027, 0.002]}
                rotation={[0, 0, -browTilt]}
              >
                <boxGeometry args={[0.046, 0.007, 0.004]} />
                <meshBasicMaterial color={eyeColor} />
              </mesh>
            )}
          </group>

          {/* Olho Direito Expressivo */}
          <group
            position={[0.054, 0.002, 0.028]}
            scale={[eyeScaleX, rightEyeScaleY, 1]}
          >
            <RoundedBox args={[0.04, 0.044, 0.006]} radius={0.012} smoothness={3}>
              <meshBasicMaterial color={eyeColor} />
            </RoundedBox>
            {expression !== 'sleepy' && (
              <mesh position={[0.009, 0.01, 0.004]}>
                <circleGeometry args={[0.006, 12]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            )}
            {browTilt !== 0 && (
              <mesh
                position={[0, 0.027, 0.002]}
                rotation={[0, 0, browTilt]}
              >
                <boxGeometry args={[0.046, 0.007, 0.004]} />
                <meshBasicMaterial color={eyeColor} />
              </mesh>
            )}
          </group>

          {/* Indicador central de boca/status no visor conforme a emoção */}
          {expression === 'happy' && (
            <mesh position={[0, -0.018, 0.029]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.018, 0.004, 8, 16, Math.PI]} />
              <meshBasicMaterial color="#4ADE80" />
            </mesh>
          )}
          {expression === 'alert' && (
            <mesh position={[0, -0.018, 0.029]}>
              <ringGeometry args={[0.006, 0.011, 16]} />
              <meshBasicMaterial color={WORLD_PALETTE.ledAmber} />
            </mesh>
          )}
          {expression === 'worried' && (
            <mesh position={[0, -0.02, 0.029]}>
              <torusGeometry args={[0.015, 0.0035, 8, 16, Math.PI]} />
              <meshBasicMaterial color="#FB923C" />
            </mesh>
          )}
        </group>

        {/* 6. RODAS INTEGRADA COM BANDA DE RODAGEM E CALOTAS */}
        {[-0.258, 0.258].map((wx, idx) => (
          <group key={idx} position={[wx, -0.042, 0]} rotation={[wheelSpin, 0, 0]}>
            <mesh
              castShadow
              rotation={[0, 0, Math.PI / 2]}
              material={sharedMaterials.robotRubberBumper}
            >
              <cylinderGeometry args={[0.056, 0.056, 0.044, 24]} />
            </mesh>
            {/* Calota com acabamento da skin */}
            <mesh
              position={[idx === 0 ? -0.023 : 0.023, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={skinMaterials.yellowTrim}
            >
              <cylinderGeometry args={[0.034, 0.034, 0.008, 18]} />
            </mesh>
            {/* Parafuso central cromado */}
            <mesh
              position={[idx === 0 ? -0.028 : 0.028, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={sharedMaterials.metalChrome}
            >
              <cylinderGeometry args={[0.01, 0.01, 0.006, 12]} />
            </mesh>
          </group>
        ))}

        {/* 7. ESCOVAS LATERAIS FUNCIONAIS DE 3 PONTAS */}
        {[-0.18, 0.18].map((bx, idx) => (
          <group
            key={idx}
            position={[bx, -0.074, 0.185]}
            rotation={[0, (idx === 0 ? -1 : 1) * wheelSpin * 2.4, 0]}
          >
            <mesh material={skinMaterials.yellowTrim}>
              <cylinderGeometry args={[0.022, 0.022, 0.014, 14]} />
            </mesh>
            {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((ang, i) => (
              <mesh
                key={i}
                position={[Math.cos(ang) * 0.044, -0.002, Math.sin(ang) * 0.044]}
                rotation={[0, -ang, 0]}
              >
                <boxGeometry args={[0.068, 0.003, 0.007]} />
                <meshBasicMaterial color="#FFFBEB" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
});
