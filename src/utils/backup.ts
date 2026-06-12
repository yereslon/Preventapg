import { kvGet, kvSet, kvDel, histAll, histSet, histDel, liqAll, liqSet, liqDel } from './db';

const BACKUP_VERSION = 2;

export async function exportarDatos(): Promise<void> {
  const [sesiones, historial, liquidaciones] = await Promise.all([
    kvGet('pg_sesiones'),
    histAll(),
    liqAll(),
  ]);

  const backup = {
    version: BACKUP_VERSION,
    exportado: new Date().toISOString(),
    datos: { sesiones, historial, liquidaciones },
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `preventapg-backup-${new Date().toLocaleDateString('es-PE').replace(/\//g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importarDatos(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async e => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        if (!backup?.datos || typeof backup.datos !== 'object') {
          reject(new Error('Archivo inválido — no contiene datos de PreventaPG.'));
          return;
        }

        if (backup.version === 1) {
          await _importarV1(backup.datos as Record<string, unknown>);
        } else {
          await _importarV2(backup.datos as BackupV2Datos);
        }
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error('No se pudo leer el archivo. ¿Es un backup válido?'));
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsText(file);
  });
}

interface BackupV2Datos {
  sesiones?: unknown;
  historial?: Record<string, unknown>[];
  liquidaciones?: Record<string, unknown>[];
}

async function _importarV1(datos: Record<string, unknown>): Promise<void> {
  await kvDel('pg_sesiones');
  const todosHist = await histAll() as { nombre: string }[];
  await Promise.all(todosHist.map(h => histDel(h.nombre)));

  await Promise.all(
    Object.entries(datos).map(([key, value]) => {
      if (key === 'pg_sesiones') return kvSet('pg_sesiones', value);
      if (key.startsWith('pg_hist_')) {
        const nombre = key.slice('pg_hist_'.length);
        return histSet({ nombre, ...(value as Record<string, unknown>) });
      }
      return Promise.resolve();
    })
  );
}

async function _importarV2(datos: BackupV2Datos): Promise<void> {
  await kvDel('pg_sesiones');

  const todosHist = await histAll() as { nombre: string }[];
  await Promise.all(todosHist.map(h => histDel(h.nombre)));

  const todosLiq = await liqAll() as { id: string }[];
  await Promise.all(todosLiq.map(l => liqDel(l.id)));

  if (datos.sesiones !== undefined) await kvSet('pg_sesiones', datos.sesiones);

  await Promise.all([
    ...(datos.historial     ?? []).map(h => histSet(h)),
    ...(datos.liquidaciones ?? []).map(l => liqSet(l)),
  ]);
}
