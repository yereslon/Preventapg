import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import type { ClienteRegistrado } from '../types/clients';

export function parseClientesSheet(rows: Record<string, unknown>[]): ClienteRegistrado[] {
  return rows
    .map(row => ({
      nombre: String(row['Cliente'] ?? '').trim(),
      ubicacion: String(row['Ubicación'] ?? row['Ubicacion'] ?? '').trim(),
    }))
    .filter(c => c.nombre !== '');
}

interface UseClientRegistryResult {
  clientes: ClienteRegistrado[];
  loading: boolean;
}

export function useClientRegistry(
  filePath = `${import.meta.env.BASE_URL}clientes.xlsx`
): UseClientRegistryResult {
  const [clientes, setClientes] = useState<ClienteRegistrado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(filePath);
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        if (!cancelled) setClientes(parseClientesSheet(rows));
      } catch { /* archivo no disponible */ }
      finally { if (!cancelled) setLoading(false); }
    }

    load();
    return () => { cancelled = true; };
  }, [filePath]);

  return { clientes, loading };
}
