import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, Paintbrush, Palette, RotateCw, X } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ROBOT_SKINS, useRobotStore } from '@/store/robotStore';
import type { RobotSkin, RobotSkinId } from '@/types/robot';
import { soundManager } from '@/services/soundManager';
import { RobotModel } from '@/world/Robot/RobotModel';

interface ToyBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Cena 3D isolada para renderizar o robô em tempo real na lateral da Oficina Toy Box
 */
function PreviewScene({ skinId }: { skinId: RobotSkinId }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.75;
    }
  });

  return (
    <>
      <ambientLight intensity={1.8} />
      <directionalLight position={[2.5, 4.0, 3.0]} intensity={2.2} />
      <directionalLight position={[-2.5, 2.0, -2.5]} intensity={0.9} />
      <pointLight position={[0, -0.2, 0.5]} intensity={0.5} color="#FFFDF8" />
      <group ref={groupRef} position={[0, -0.06, 0]}>
        <RobotModel skinId={skinId} expression="happy" />
        {/* Sombra suave de contato no pedestal */}
        <mesh position={[0, -0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.34, 32]} />
          <meshBasicMaterial color="#201004" transparent opacity={0.32} depthWrite={false} />
        </mesh>
      </group>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

/**
 * Fallback visual 2D para ambientes sem suporte a WebGL (testes unitários jsdom)
 */
function Robot2DFallback({ skin }: { skin: RobotSkin }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <svg viewBox="0 0 160 160" className="w-36 h-36 drop-shadow-md" aria-label="Visualização do robô">
        <ellipse cx="80" cy="142" rx="60" ry="14" fill="#2A211B" opacity="0.25" />
        <circle cx="80" cy="80" r="56" fill={skin.shellColor} stroke="#2A211B" strokeWidth="4" />
        <path d="M 28 80 A 52 52 0 0 0 132 80 Z" fill={skin.blueTrimColor} opacity="0.85" />
        <circle cx="80" cy="74" r="28" fill={skin.coralTrimColor} stroke="#2A211B" strokeWidth="3" />
        <circle cx="80" cy="74" r="14" fill="#1C1917" stroke="#2A211B" strokeWidth="2.5" />
        <circle cx="80" cy="74" r="7" fill={skin.eyeColor} />
        <ellipse cx="22" cy="84" rx="6" ry="14" fill={skin.yellowTrimColor} stroke="#2A211B" strokeWidth="2.5" />
        <ellipse cx="138" cy="84" rx="6" ry="14" fill={skin.yellowTrimColor} stroke="#2A211B" strokeWidth="2.5" />
        <rect x="77" y="32" width="6" height="30" rx="3" fill="#2A211B" />
        <ellipse cx="80" cy="32" rx="42" ry="5" fill="#44403C" opacity="0.8" />
        <circle cx="80" cy="32" r="5" fill={skin.yellowTrimColor} stroke="#2A211B" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export const ToyBoxModal = memo(function ToyBoxModal({
  isOpen,
  onClose,
}: ToyBoxModalProps) {
  const currentSkinId = useRobotStore((s) => s.skin);
  const setRobotSkin = useRobotStore((s) => s.setRobotSkin);

  const [previewSkinId, setPreviewSkinId] = useState<RobotSkinId>(currentSkinId);

  // Sincroniza o preview inicial com a skin atualmente equipada
  useEffect(() => {
    setPreviewSkinId(currentSkinId);
  }, [currentSkinId, isOpen]);

  const isWebGL = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  }, []);

  if (!isOpen) return null;

  const handleEquipSkin = (skinId: RobotSkinId) => {
    soundManager.playToyCelebrationChime();
    setRobotSkin(skinId);
    setPreviewSkinId(skinId);
  };

  const previewSkin = ROBOT_SKINS[previewSkinId] ?? ROBOT_SKINS.classic;
  const isPreviewEquipped = currentSkinId === previewSkinId;
  const skinsList = Object.values(ROBOT_SKINS);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Oficina Toy Box de Pinturas e Customização"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2A211B]/60 backdrop-blur-xs select-none pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl border-3 border-[#2A211B] bg-[#FFFDF8] p-5 sm:p-6 shadow-[6px_6px_0px_#2A211B] max-h-[92dvh] overflow-y-auto space-y-4 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho estilo Embalagem de Brinquedo */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#2A211B]/15">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-[#2A211B] bg-[#FBBF24] text-[#2A211B] shadow-[2px_2px_0px_#2A211B]">
              <Palette className="h-5 w-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-lg text-[#2A211B]">
                  Oficina Toy Box
                </span>
                <span className="rounded-md border border-[#2A211B] bg-[#FEF08A] px-1.5 py-0.2 font-mono text-[9px] font-black uppercase tracking-wider text-[#854D0E] shadow-[1px_1px_0px_#2A211B]">
                  LIVRE ESCOLHA
                </span>
              </div>
              <p className="text-xs font-bold text-[#6E5D4F]">
                Escolha a pintura favorita do AspiToy e veja a transformação em tempo real!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            aria-label="Fechar oficina"
            className="rounded-xl border-2 border-[#2A211B] bg-[#F5ECE0] p-1.5 text-[#2A211B] shadow-[2px_2px_0px_#2A211B] hover:bg-[#E8DAC7] active:translate-y-0.5 active:shadow-none transition cursor-pointer"
          >
            <X className="h-4 w-4 stroke-[3]" />
          </button>
        </div>

        {/* Layout Principal: Preview 3D na Lateral + Catálogo de Pinturas */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* PAINEL LATERAL: PREVIEW EM TEMPO REAL DO ROBÔ */}
          <div className="md:col-span-5 flex flex-col justify-between rounded-2xl border-2.5 border-[#2A211B] bg-linear-to-b from-[#FEF9EE] to-[#F5ECE0] p-4 shadow-[3px_3px_0px_#2A211B]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#854D0E] bg-[#FEF08A] px-2 py-0.5 rounded-md border border-[#2A211B]/25 shadow-xs">
                  <Eye className="h-3 w-3 stroke-[2.5]" />
                  Preview 3D
                </span>
                <span className="text-[10px] font-bold text-[#6E5D4F] flex items-center gap-1">
                  <RotateCw className="h-3 w-3 animate-spin" style={{ animationDuration: '6s' }} />
                  Giro 360°
                </span>
              </div>

              {/* Viewport 3D do Robô */}
              <div
                data-testid="robot-3d-preview"
                className="relative w-full h-52 sm:h-56 rounded-xl overflow-hidden border-2 border-[#2A211B] bg-radial from-[#FFFDF8] to-[#E9DAC8] shadow-inner"
              >
                {isWebGL ? (
                  <Canvas
                    camera={{ position: [0.65, 0.45, 0.75], fov: 38 }}
                    dpr={[1, 1.5]}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <PreviewScene skinId={previewSkinId} />
                  </Canvas>
                ) : (
                  <Robot2DFallback skin={previewSkin} />
                )}
                <div className="absolute bottom-1.5 right-2 text-[9px] font-mono font-bold text-[#6E5D4F] bg-[#FFFDF8]/85 px-1.5 py-0.5 rounded border border-[#2A211B]/20 pointer-events-none">
                  Arraste p/ rotacionar
                </div>
              </div>

              {/* Informações da Pintura em Preview */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-display font-black text-base text-[#2A211B]">
                    {previewSkin.name}
                  </h3>
                  {/* Swatches da paleta da skin */}
                  <div className="flex items-center -space-x-1">
                    <span
                      title="Chassi"
                      className="h-4.5 w-4.5 rounded-full border border-[#2A211B] shadow-xs"
                      style={{ backgroundColor: previewSkin.shellColor }}
                    />
                    <span
                      title="Acabamento Coral"
                      className="h-4 w-4 rounded-full border border-[#2A211B] shadow-xs"
                      style={{ backgroundColor: previewSkin.coralTrimColor }}
                    />
                    <span
                      title="Carenagem Frontal"
                      className="h-4 w-4 rounded-full border border-[#2A211B] shadow-xs"
                      style={{ backgroundColor: previewSkin.blueTrimColor }}
                    />
                    <span
                      title="Calotas"
                      className="h-3.5 w-3.5 rounded-full border border-[#2A211B] shadow-xs"
                      style={{ backgroundColor: previewSkin.yellowTrimColor }}
                    />
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#E05A36]">
                  {previewSkin.tagline}
                </p>
                <p className="text-xs text-[#54463B] font-medium leading-snug">
                  {previewSkin.description}
                </p>
              </div>
            </div>

            {/* Ação de Equipar diretamente do Preview */}
            <div className="mt-4 pt-3 border-t border-[#2A211B]/15">
              {isPreviewEquipped ? (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl border-2 border-[#2A211B] bg-[#DCFCE7] py-2 text-xs font-black uppercase tracking-wider text-[#15803D] shadow-[2px_2px_0px_#2A211B] cursor-default flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  Equipada no AspiToy
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleEquipSkin(previewSkinId)}
                  className="w-full rounded-xl border-2 border-[#2A211B] bg-linear-to-b from-[#F2724D] to-[#E05A36] py-2 text-xs font-black uppercase tracking-wider text-white shadow-[0_3px_0px_#9A3412] hover:translate-y-0.5 hover:shadow-[0_1.5px_0px_#9A3412] active:translate-y-1 active:shadow-none transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Paintbrush className="h-4 w-4 stroke-[2.5]" />
                  Equipar Esta Pintura
                </button>
              )}
            </div>
          </div>

          {/* CATÁLOGO DE PINTURAS (DIREITA) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#2A211B]/10">
              <span className="text-xs font-black uppercase tracking-wider text-[#2A211B]">
                Pinturas Disponíveis ({skinsList.length})
              </span>
              <span className="text-[11px] font-bold text-[#6E5D4F]">
                Clique para visualizar no preview
              </span>
            </div>

            {/* Grade de Skins com escolha livre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {skinsList.map((skin) => {
                const isEquipped = currentSkinId === skin.id;
                const isSelected = previewSkinId === skin.id;

                return (
                  <div
                    key={skin.id}
                    onClick={() => {
                      setPreviewSkinId(skin.id);
                      soundManager.playClick();
                    }}
                    className={`relative flex flex-col justify-between rounded-2xl border-2 p-3 transition cursor-pointer ${
                      isSelected
                        ? 'border-[#2A211B] bg-[#FEF3C7] shadow-[3px_3px_0px_#2A211B] ring-2 ring-[#FBBF24]/60'
                        : isEquipped
                        ? 'border-[#2A211B] bg-[#F0FDF4] shadow-[2px_2px_0px_#2A211B]'
                        : 'border-[#2A211B]/30 bg-white shadow-[2px_2px_0px_#2A211B]/15 hover:border-[#2A211B] hover:shadow-[3px_3px_0px_#2A211B]'
                    }`}
                  >
                    <div>
                      {/* Amostras de Cores e Badges */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center -space-x-1">
                          <span
                            className="h-5 w-5 rounded-full border border-[#2A211B] shadow-xs"
                            style={{ backgroundColor: skin.shellColor }}
                          />
                          <span
                            className="h-4.5 w-4.5 rounded-full border border-[#2A211B] shadow-xs"
                            style={{ backgroundColor: skin.coralTrimColor }}
                          />
                          <span
                            className="h-4.5 w-4.5 rounded-full border border-[#2A211B] shadow-xs"
                            style={{ backgroundColor: skin.blueTrimColor }}
                          />
                          <span
                            className="h-4 w-4 rounded-full border border-[#2A211B] shadow-xs"
                            style={{ backgroundColor: skin.yellowTrimColor }}
                          />
                        </div>

                        {isEquipped ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-[#2A211B] bg-[#DCFCE7] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-[#15803D] shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" /> EQUIPADA
                          </span>
                        ) : isSelected ? (
                          <span className="rounded-md border border-[#2A211B] bg-[#FEF08A] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase text-[#854D0E] shadow-xs">
                            NO PREVIEW
                          </span>
                        ) : (
                          <span className="rounded-md border border-[#2A211B]/30 bg-[#F3ECE0] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#6E5D4F]">
                            DISPONÍVEL
                          </span>
                        )}
                      </div>

                      <h4 className="font-display font-black text-sm text-[#2A211B]">
                        {skin.name}
                      </h4>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#E05A36]">
                        {skin.tagline}
                      </p>
                      <p className="mt-1 text-xs text-[#54463B] font-medium leading-snug line-clamp-2">
                        {skin.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#2A211B]/10">
                      {isEquipped ? (
                        <div className="text-center py-1 text-[11px] font-black text-[#15803D]">
                          Pintura Atual
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquipSkin(skin.id);
                          }}
                          className="w-full rounded-xl border-1.5 border-[#2A211B] bg-white hover:bg-[#FEE2E2] py-1 text-xs font-black uppercase text-[#2A211B] shadow-[0_2px_0px_#2A211B] hover:translate-y-0.5 hover:shadow-none active:translate-y-1 transition cursor-pointer"
                        >
                          Equipar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
