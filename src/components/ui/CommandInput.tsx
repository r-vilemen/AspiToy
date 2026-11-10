import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { useCommandStore } from '@/store/commandStore';

/**
 * Caixa de entrada de comandos de linguagem natural e atalhos rápidos do usuário.
 */
export function CommandInput() {
  const [inputVal, setInputVal] = useState('');
  const dispatchCommand = useCommandStore((s) => s.dispatchCommand);
  const pushNotification = useCommandStore((s) => s.pushNotification);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = inputVal.trim().toLowerCase();
    if (!query) return;

    if (query.includes('limp') || query.includes('inici') || query.includes('começ')) {
      dispatchCommand('START_CLEANING');
    } else if (query.includes('paus') || query.includes('par')) {
      dispatchCommand('PAUSE_CLEANING');
    } else if (query.includes('retom') || query.includes('continu')) {
      dispatchCommand('RESUME_CLEANING');
    } else if (query.includes('base') || query.includes('volt') || query.includes('carreg')) {
      dispatchCommand('RETURN_TO_BASE');
    } else if (query.includes('quarto') || query.includes('cama')) {
      dispatchCommand('CLEAN_REGION', { regionId: 'bedroom' });
    } else if (query.includes('corredor')) {
      dispatchCommand('CLEAN_REGION', { regionId: 'hallway' });
    } else if (query.includes('sala') || query.includes('sofa') || query.includes('tv')) {
      dispatchCommand('CLEAN_REGION', { regionId: 'living-room' });
    } else if (query.includes('cozinha') || query.includes('fogao') || query.includes('geladeira')) {
      dispatchCommand('CLEAN_REGION', { regionId: 'kitchen' });
    } else if (query.includes('banheiro') || query.includes('chuveiro') || query.includes('sanitario')) {
      dispatchCommand('CLEAN_REGION', { regionId: 'bathroom' });
    } else if (query.includes('casa') || query.includes('tudo') || query.includes('completa')) {
      dispatchCommand('CLEAN_REGION', { regionId: 'all' });
    } else {
      pushNotification(
        'Comando interpretado',
        `Compreendido "${inputVal}". Executando varredura direcionada.`,
        'info'
      );
      dispatchCommand('START_CLEANING');
    }

    setInputVal('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative mt-2">
      <input
        type="text"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        placeholder="Instruir o AspiToy (ex: 'limpar tapete', 'ir à base')..."
        className="w-full rounded-xl border border-[#8C6D4F]/25 bg-[#FDFBF7] px-3 py-2 pr-9 text-xs text-[#2A211B] placeholder:text-[#8C7A6B] focus:border-[#E05A36] focus:outline-none focus:ring-1 focus:ring-[#E05A36]"
      />
      <button
        type="submit"
        aria-label="Enviar comando"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#6E5D4F] hover:bg-[#EAE0D0] hover:text-[#E05A36] transition cursor-pointer"
      >
        <Send className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </form>
  );
}

