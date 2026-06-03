import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import type { CatalogItem, ExcelRow, PrecioUnidad } from '../types/catalog';
import { WA_DEFAULT } from '../utils/whatsapp';

export function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul((h << 5) + h, 1) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  return h >>> 0;
}

interface UseExcelDataResult {
  data: CatalogItem[];
  ubicaciones: string[];
  whatsapp: string;
  loading: boolean;
  error: string | null;
}

function parsePrice(val: unknown): number | null {
  if (val === '' || val === null || val === undefined) return null;
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return isFinite(n) && n > 0 ? n : null;
}

function normalizeRow(row: ExcelRow, index: number): CatalogItem {
  const categoria = String(row['Categoría'] ?? row['Categoria'] ?? '').trim();
  const nombre = String(row['Producto'] ?? '').trim();

  const preciosExtra: PrecioUnidad[] = [];
  for (let n = 1; n <= 2; n++) {
    const unidad = String(row[`Unidad ${n}` as keyof ExcelRow] ?? '').trim();
    if (!unidad) continue;
    const precio = parsePrice(row[`Precio ${n}` as keyof ExcelRow]) ?? 0;
    preciosExtra.push({ unidad, precio });
  }

  return {
    id: djb2(nombre + '\0' + categoria),
    nombre,
    categoria,
    precio: preciosExtra[0]?.precio ?? 0,
    unidad: preciosExtra[0]?.unidad ?? '',
    preciosExtra,
  };
}

/**
 * Lee la hoja "Configuracion" con dos formatos soportados:
 *
 * Formato clave-valor (recomendado):
 *   | Tipo       | Valor        |
 *   | Ubicación  | Lima Norte   |
 *   | Ubicación  | Lima Sur     |
 *   | WhatsApp   | 51963243948  |
 *
 * Formato plano (compatibilidad):
 *   | Ubicación  |
 *   | Lima Norte |
 *   | Lima Sur   |
 */
function parseConfiguracion(workbook: XLSX.WorkBook): { ubicaciones: string[]; whatsapp: string } {
  const sheet =
    workbook.Sheets['Configuracion'] ??
    workbook.Sheets['Configuración'] ??
    workbook.Sheets['configuracion'];

  if (!sheet) return { ubicaciones: [], whatsapp: WA_DEFAULT };

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (rows.length === 0) return { ubicaciones: [], whatsapp: WA_DEFAULT };

  const primerasFila = Object.keys(rows[0]).map(k => k.toLowerCase().trim());
  const esClaveValor =
    primerasFila.some(k => ['tipo', 'parametro', 'clave', 'key'].includes(k)) &&
    primerasFila.some(k => ['valor', 'value'].includes(k));

  const ubicaciones: string[] = [];
  let whatsapp = WA_DEFAULT;

  if (esClaveValor) {
    for (const row of rows) {
      const tipo = String(
        row['Tipo'] ?? row['Parametro'] ?? row['Clave'] ?? row['Key'] ?? ''
      ).trim().toLowerCase();
      const valor = String(row['Valor'] ?? row['Value'] ?? '').trim();

      if (!valor) continue;

      if (tipo === 'ubicación' || tipo === 'ubicacion') {
        ubicaciones.push(valor);
      } else if (['whatsapp', 'telefono', 'celular', 'phone'].includes(tipo)) {
        whatsapp = valor.replace(/[^0-9]/g, '') || WA_DEFAULT;
      }
    }
  } else {
    // Formato plano: primera columna = ubicaciones
    for (const row of rows) {
      const val = String(Object.values(row)[0] ?? '').trim();
      if (val) ubicaciones.push(val);
    }
  }

  return { ubicaciones, whatsapp };
}

export function useExcelData(filePath = `${import.meta.env.BASE_URL}catalogo.xlsx`): UseExcelDataResult {
  const [data, setData] = useState<CatalogItem[]>([]);
  const [ubicaciones, setUbicaciones] = useState<string[]>([]);
  const [whatsapp, setWhatsapp] = useState(WA_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExcel() {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(
            `No se encontró el archivo: ${filePath} (${response.status})`
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: '' });
        const items = rows
          .map((row, i) => normalizeRow(row, i))
          .filter(item => item.nombre !== '');

        const config = parseConfiguracion(workbook);

        if (!cancelled) {
          setData(items);
          setUbicaciones(config.ubicaciones);
          setWhatsapp(config.whatsapp);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Error desconocido al leer el archivo.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadExcel();
    return () => {
      cancelled = true;
    };
  }, [filePath]);

  return { data, ubicaciones, whatsapp, loading, error };
}
