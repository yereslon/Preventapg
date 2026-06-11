import { useState, useEffect } from 'react';
import type { Liquidacion } from '../types/liquidacion';
import { liqAll } from '../utils/db';

export function useLiquidacionHistorial() {
  const [historial, setHistorial] = useState<Liquidacion[]>([]);
  const [cargando, setCargando]   = useState(true);

  function recargar() {
    setCargando(true);
    const hoy = new Date().toISOString().slice(0, 10);
    liqAll()
      .then(registros => {
        const pasados = (registros as Liquidacion[])
          .map(r => { const l = r as Omit<Liquidacion, 'guardada'> & { guardada?: boolean }; return { ...l, guardada: l.guardada ?? false } as Liquidacion; })          // backward compat
          .filter(r => r.fecha !== hoy)
          .sort((a, b) => b.fecha.localeCompare(a.fecha));
        setHistorial(pasados);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }

  useEffect(() => { recargar(); }, []);

  return { historial, cargando, recargar };
}
