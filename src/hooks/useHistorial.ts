import type { ClienteHistorial, PedidoHistorial } from '../types/clients';

export interface ClienteConHistorial {
  nombre: string;
  ubicacion: string;
  totalPedidos: number;
  totalAcumulado: number;
  ultimaFecha: string;
  pedidos: PedidoHistorial[];
}

const HIST_PREFIX = 'pg_hist_';

function parseFechaES(fecha: string): number {
  const [d, m, y] = fecha.split('/').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function getClientesConHistorial(): ClienteConHistorial[] {
  const result: ClienteConHistorial[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(HIST_PREFIX)) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const hist = JSON.parse(raw) as ClienteHistorial;
      const pedidos = hist.pedidos ?? [];
      if (pedidos.length === 0) continue;

      const nombre = key.slice(HIST_PREFIX.length);
      const totalAcumulado = pedidos.reduce((s, p) => s + p.total, 0);

      result.push({
        nombre,
        ubicacion: pedidos[0]?.ubicacion ?? '',
        totalPedidos: pedidos.length,
        totalAcumulado,
        ultimaFecha: pedidos[0]?.fecha ?? '',
        pedidos,
      });
    } catch { /* ignore malformed entries */ }
  }

  return result.sort((a, b) =>
    parseFechaES(b.ultimaFecha) - parseFechaES(a.ultimaFecha)
  );
}

export function useHistorial(): ClienteConHistorial[] {
  return getClientesConHistorial();
}
