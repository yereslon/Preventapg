import { useState, useEffect } from 'react';
import type { Liquidacion } from '../types/liquidacion';
import { liqAll } from '../utils/db';

export function useLiquidacionHistorial() {
  const [historial, setHistorial] = useState<Liquidacion[]>([]);
  const [cargando, setCargando]   = useState(true);

  function recargar() {
    setCargando(true);
    liqAll()
      .then(registros => {
        const guardadas = (registros as Liquidacion[])
          .map(r => {
            const l = r as Omit<Liquidacion, 'guardada' | 'preventas'> & { guardada?: boolean; preventas?: Liquidacion['preventas'] };
            return { ...l, guardada: l.guardada ?? false, preventas: l.preventas ?? [] } as Liquidacion;
          })
          .filter(r => r.guardada)
          .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
        setHistorial(guardadas);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }

  useEffect(() => { recargar(); }, []);

  return { historial, cargando, recargar };
}
