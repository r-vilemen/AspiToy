import { memo } from 'react';
import { Check, Lock, Palette, Sparkles, X } from 'lucide-react';
import { ROBOT_SKINS, useRobotStore } from '@/store/robotStore';
import type { RobotSkinId } from '@/types/robot';
import { soundManager } from '@/services/soundManager';

interface ToyBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ToyBoxModal = memo(function ToyBoxModal({
  isOpen,
  onClose,
}: ToyBoxModalProps) {
  const currentSkinId = useRobotStore((s) => s.skin);
  const setRobotSkin = useRobotStore((s) => s.setRobotSkin);
  const cleanedAreaM2 = useRobotStore((s) => s.cleanedAreaM2);

  if (!isOpen) return null;

  const handleSelectSkin = (skinId: RobotSkinId, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    soundManager.playToyCelebrationChime();
    setRobotSkin(skinId);
  };

  const skinsList = Object.values(ROBOT_SKINS);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Oficina Toy Box de Pinturas e Customização"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#2A211B]/60 backdrop-blur-xs select-none pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border-3 border-[#2A211B] bg-[#FFFDF8] p-5 sm:p-6 shadow-[6px_6px_0px_#2A211B] max-h-[90dvh] overflow-y-auto space-y-4 animate-bounce-in"
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
                  CUSTOMIZAÇÃO
                </span>
              </div>
              <p className="text-xs font-bold text-[#6E5D4F]">
                Desbloqueie pinturas personalizadas aspirando a residência!
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

        {/* Barra de Progresso de Metragem Limpa */}
        <div className="rounded-2xl border-2 border-[#2A211B] bg-[#F5ECE0] p-3 flex items-center justify-between shadow-[2px_2px_0px_#2A211B]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#E05A36] stroke-[2.4]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#2A211B]">
              Área Total Higienizada:
            </span>
          </div>
          <span className="font-mono text-sm font-black tabular-nums text-[#0F766E] rounded-lg border border-[#2A211B]/25 bg-white px-2.5 py-0.5 shadow-xs">
            {cleanedAreaM2} m²
          </span>
        </div>

        {/* Grade de Skins Disponíveis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {skinsList.map((skin) => {
            const isUnlocked = cleanedAreaM2 >= skin.requiredM2;
            const isEquipped = currentSkinId === skin.id;

            return (
              <div
                key={skin.id}
                className={`relative flex flex-col justify-between rounded-2xl border-2.5 p-3.5 transition ${
                  isEquipped
                    ? 'border-[#2A211B] bg-[#FEF3C7] shadow-[3px_3px_0px_#2A211B]'
                    : isUnlocked
                    ? 'border-[#2A211B]/35 bg-white shadow-[2px_2px_0px_#2A211B]/15 hover:border-[#2A211B] hover:shadow-[3px_3px_0px_#2A211B]'
                    : 'border-[#2A211B]/20 bg-[#F5ECE0]/60 opacity-75'
                }`}
              >
                <div>
                  {/* Pré-visualização de Cores da Skin */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center -space-x-1.5">
                      <span
                        title="Cor do Chassi"
                        className="h-6 w-6 rounded-full border-2 border-[#2A211B] shadow-xs"
                        style={{ backgroundColor: skin.shellColor }}
                      />
                      <span
                        title="Acabamento Coral"
                        className="h-5 w-5 rounded-full border-1.5 border-[#2A211B] shadow-xs"
                        style={{ backgroundColor: skin.coralTrimColor }}
                      />
                      <span
                        title="Carenagem Frontal"
                        className="h-5 w-5 rounded-full border-1.5 border-[#2A211B] shadow-xs"
                        style={{ backgroundColor: skin.blueTrimColor }}
                      />
                      <span
                        title="Calotas"
                        className="h-4 w-4 rounded-full border border-[#2A211B] shadow-xs"
                        style={{ backgroundColor: skin.yellowTrimColor }}
                      />
                    </div>

                    {isEquipped ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#2A211B] bg-[#DCFCE7] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-[#15803D] shadow-xs">
                        <Check className="h-3 w-3 stroke-[3]" /> EQUIPADA
                      </span>
                    ) : isUnlocked ? (
                      <span className="rounded-md border border-[#2A211B]/30 bg-[#F3ECE0] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase text-[#0F766E]">
                        DISPONÍVEL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#2A211B]/30 bg-[#F5ECE0] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#6E5D4F]">
                        <Lock className="h-2.5 w-2.5" /> {skin.requiredM2} m²
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-black text-sm text-[#2A211B]">
                    {skin.name}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#E05A36]">
                    {skin.tagline}
                  </p>
                  <p className="mt-1 text-xs text-[#54463B] font-medium leading-snug line-clamp-2">
                    {skin.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#2A211B]/15">
                  {isEquipped ? (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl border-1.5 border-[#2A211B]/30 bg-[#DCFCE7] py-1.5 text-xs font-black uppercase text-[#15803D] cursor-default"
                    >
                      Em Uso
                    </button>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => handleSelectSkin(skin.id, true)}
                      className="w-full rounded-xl border-2 border-[#2A211B] bg-linear-to-b from-[#F2724D] to-[#E05A36] py-1.5 text-xs font-black uppercase text-white shadow-[0_2.5px_0px_#9A3412] hover:translate-y-0.5 hover:shadow-none active:translate-y-1 transition cursor-pointer"
                    >
                      Equipar
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1 py-1 text-[11px] font-bold text-[#6E5D4F]">
                      <Lock className="h-3 w-3" />
                      <span>Faltam {(skin.requiredM2 - cleanedAreaM2).toFixed(1)} m²</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
