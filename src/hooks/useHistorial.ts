import { useState, useEffect } from 'react';
import type { ClienteHistorial, PedidoHistorial } from '../types/clients';
import { histAll } from '../utils/db';

export interface ClienteConHistorial {
  nombre: string;
  ubicacion: string;
  totalPedidos: number;
  totalAcumulado: number;
  ultimaFecha: string;
  pedidos: PedidoHistorial[];
}

function parseFechaES(fecha: string): number {
  const [d, m, y] = fecha.split('/').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export async function getClientesConHistorial(): Promise<ClienteConHistorial[]> {
  const registros = await histAll() as (ClienteHistorial & { nombre: string })[];

  const result: ClienteConHistorial[] = [];

  for (const r of registros) {
    try {
      const pedidos = r.pedidos ?? [];
      if (pedidos.length === 0) continue;
      result.push({
        nombre: r.nombre,
        ubicacion: pedidos[0]?.ubicacion ?? '',
        totalPedidos: pedidos.length,
        totalAcumulado: pedidos.reduce((s, p) => s + p.total, 0),
        ultimaFecha: pedidos[0]?.fecha ?? '',
        pedidos,
      });
    } catch { /* ignore entradas malformadas */ }
  }

  return result.sort((a, b) => parseFechaES(b.ultimaFecha) - parseFechaES(a.ultimaFecha));
}

export function useHistorial(): ClienteConHistorial[] {
  const [clientes, setClientes] = useState<ClienteConHistorial[]>([]);

  useEffect(() => {
    getClientesConHistorial().then(setClientes).catch(() => {});
  }, []);

  return clientes;
}
