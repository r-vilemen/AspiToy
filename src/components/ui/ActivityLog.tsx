import { History, CheckCircle2, XCircle } from 'lucide-react';
import { useCommandStore } from '@/store/commandStore';

/**
 * Painel colapsável de histórico de atividades e logs operacionais do robô.
 */
export function ActivityLog() {
  const commandHistory = useCommandStore((s) => s.commandHistory);

  if (commandHistory.length === 0) return null;

  return (
    <section aria-label="Histórico de atividades" className="space-y-1.5 pt-2 border-t border-[#8C6D4F]/12">
      <div className="flex items-center justify-between text-xs text-[#54463B] font-medium">
        <span className="flex items-center gap-1">
          <History className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />
          Últimas instruções
        </span>
        <span className="font-mono text-[10px] text-[#8C7A6B]">
          {commandHistory.length} registros
        </span>
      </div>

      <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
        {commandHistory.slice(0, 4).map((cmd) => (
          <div
            key={cmd.id}
            className="flex items-center justify-between gap-1.5 rounded-lg bg-[#EFE6D6]/60 px-2 py-1 text-[11px] text-[#443830]"
          >
            <span className="flex items-center gap-1 truncate">
              {cmd.accepted ? (
                <CheckCircle2 className="h-3 w-3 text-[#10B981] shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="h-3 w-3 text-[#DC2626] shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{cmd.label}</span>
            </span>
            <span className="font-mono text-[10px] text-[#7A695B] shrink-0">
              {cmd.timestamp}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

