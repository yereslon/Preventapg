import { useState } from 'react';
import { LiquidacionPanel } from './LiquidacionPanel';
import { LiquidacionHistorial } from './LiquidacionHistorial';

type Tab = 'hoy' | 'historial';

interface Props {
  onCerrar: () => void;
}

export function LiquidacionView({ onCerrar }: Props) {
  const [tab, setTab] = useState<Tab>('hoy');

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Encabezado */}
      <div className="sticky top-0 z-10 bg-[#1a3a6b] shadow">
        <div className="flex items-center gap-3 px-4 py-3 text-white">
          <button
            onClick={onCerrar}
            aria-label="Cerrar liquidacion del dia"
            className="text-white/70 hover:text-white transition-colors font-bold text-lg leading-none"
          >
            ←
          </button>
          <h1 className="font-bold text-base flex-1">Liquidacion del dia</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-white/10">
          <button
            onClick={() => setTab('hoy')}
            className={`flex-1 py-2.5 text-xs font-bold tracking-wide transition-colors ${
              tab === 'hoy'
                ? 'text-white border-b-2 border-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            HOY
          </button>
          <button
            onClick={() => setTab('historial')}
            className={`flex-1 py-2.5 text-xs font-bold tracking-wide transition-colors ${
              tab === 'historial'
                ? 'text-white border-b-2 border-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            HISTORIAL
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {tab === 'hoy'      && <LiquidacionPanel />}
        {tab === 'historial' && <LiquidacionHistorial />}
      </div>
    </div>
  );
}
