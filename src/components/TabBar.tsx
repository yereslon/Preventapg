import { formatSoles } from '../utils/format';
import type { ClientSession } from '../types/clients';

interface Props {
  sesiones: ClientSession[];
  activoId: string | null;
  onSeleccionar: (id: string) => void;
  onCerrar: (id: string) => void;
  onNuevo: () => void;
}

export function TabBar({ sesiones, activoId, onSeleccionar, onCerrar, onNuevo }: Props) {
  return (
    <div
      className="flex items-end gap-1 px-3 pt-1.5 overflow-x-auto"
      style={{ background: '#162d4a', scrollbarWidth: 'none' }}
    >
      {sesiones.map(s => {
        const activa = s.id === activoId;
        const total = s.items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

        return (
          <button
            key={s.id}
            onClick={() => onSeleccionar(s.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs font-semibold
              whitespace-nowrap flex-shrink-0 max-w-[160px] transition-colors
              ${activa
                ? 'bg-white text-[#1a3a6b]'
                : 'bg-[#243f5e] text-[#8ab0cc] hover:bg-[#2d5070]'}
            `}
          >
            <span className="truncate max-w-[80px]">{s.nombre}</span>
            <span
              className={`
                rounded-full px-1.5 py-0.5 text-[10px] font-bold flex-shrink-0
                ${activa ? 'bg-blue-100 text-blue-700' : 'bg-white/10 text-[#8ab0cc]'}
              `}
            >
              {formatSoles(total)}
            </span>
            <span
              role="button"
              aria-label={`Cerrar pestaña de ${s.nombre}`}
              onClick={e => { e.stopPropagation(); onCerrar(s.id); }}
              className={`
                ml-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[11px]
                flex-shrink-0 leading-none transition-colors
                ${activa ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-[#4a6a88] hover:text-[#8ab0cc]'}
              `}
            >
              ×
            </span>
          </button>
        );
      })}

      <button
        onClick={onNuevo}
        className="px-3 py-2 rounded-t-lg text-xs font-semibold text-[#6ab0aa] hover:text-white bg-white/5 hover:bg-white/10 flex-shrink-0 whitespace-nowrap transition-colors"
      >
        ＋ Nuevo
      </button>

      <div className="flex-1 min-w-2" />
    </div>
  );
}
