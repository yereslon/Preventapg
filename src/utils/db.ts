const DB_NAME = 'preventapg';
const DB_VERSION = 1;

let _db: Promise<IDBDatabase> | null = null;

export function _resetDb(): void {
  _db = null;
}

// ── Conexión ──────────────────────────────────────────────────

function abrirConexion(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv'))
        db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('historial'))
        db.createObjectStore('historial', { keyPath: 'nombre' });
      if (!db.objectStoreNames.contains('liquidaciones'))
        db.createObjectStore('liquidaciones', { keyPath: 'id' });
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => { _db = null; reject(req.error); };
  });
}

// ── Transacciones ─────────────────────────────────────────────

function _tx<T>(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise<T>((res, rej) => {
    const t   = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return getDb().then(db => _tx(db, store, mode, fn));
}

// ── Migración única desde localStorage ───────────────────────

async function migrar(db: IDBDatabase): Promise<void> {
  const yaHecho = await _tx<unknown>(db, 'kv', 'readonly', s => s.get('_migrado_v1'));
  if (yaHecho) return;

  const sesionesRaw = localStorage.getItem('pg_sesiones');
  if (sesionesRaw) {
    try { await _tx(db, 'kv', 'readwrite', s => s.put(JSON.parse(sesionesRaw), 'pg_sesiones')); } catch { /* ignore */ }
    localStorage.removeItem('pg_sesiones');
  } else {
    // Conversión legacy: pg_carrito → sesión "Cliente sin asignar"
    const carritoRaw = localStorage.getItem('pg_carrito');
    if (carritoRaw) {
      try {
        const items = JSON.parse(carritoRaw);
        if (Array.isArray(items) && items.length > 0) {
          const legacySesion = {
            id: 'migrado-' + Date.now().toString(36),
            nombre: 'Cliente sin asignar',
            ubicacion: '',
            esNuevo: true,
            items,
            vista: 'catalogo',
            orderForm: { nombre: '', ubicacion: '', notas: '' },
            preciosNegociados: {},
            ultimosProductos: [],
          };
          await _tx(db, 'kv', 'readwrite', s => s.put([legacySesion], 'pg_sesiones'));
        }
      } catch { /* ignore */ }
      localStorage.removeItem('pg_carrito');
    }
  }

  // Migrar pg_hist_* → tienda historial
  const histKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('pg_hist_')) histKeys.push(k);
  }
  await Promise.all(histKeys.map(async k => {
    const raw = localStorage.getItem(k);
    if (!raw) return;
    try {
      const nombre = k.slice('pg_hist_'.length);
      await _tx(db, 'historial', 'readwrite', s => s.put({ nombre, ...JSON.parse(raw) }));
    } catch { /* ignore */ }
    localStorage.removeItem(k);
  }));

  await _tx(db, 'kv', 'readwrite', s => s.put(true, '_migrado_v1'));
}

function getDb(): Promise<IDBDatabase> {
  if (!_db) {
    _db = (async () => {
      const db = await abrirConexion();
      await migrar(db);
      if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
      return db;
    })();
  }
  return _db;
}

// ── Tienda kv ─────────────────────────────────────────────────
export const kvGet  = (key: string): Promise<unknown>          => tx('kv', 'readonly',  s => s.get(key));
export const kvSet  = (key: string, v: unknown): Promise<void> => tx('kv', 'readwrite', s => s.put(v, key)).then(() => {});
export const kvDel  = (key: string): Promise<void>             => tx('kv', 'readwrite', s => s.delete(key)).then(() => {});
export const kvAll  = (): Promise<unknown[]>                   => tx('kv', 'readonly',  s => s.getAll());

// ── Tienda historial ──────────────────────────────────────────
export const histGet = (nombre: string): Promise<unknown>                  => tx('historial', 'readonly',  s => s.get(nombre));
export const histSet = (r: Record<string, unknown>): Promise<void>         => tx('historial', 'readwrite', s => s.put(r)).then(() => {});
export const histDel = (nombre: string): Promise<void>                     => tx('historial', 'readwrite', s => s.delete(nombre)).then(() => {});
export const histAll = (): Promise<unknown[]>                               => tx('historial', 'readonly',  s => s.getAll());

// ── Tienda liquidaciones ──────────────────────────────────────
export const liqGet = (id: string): Promise<unknown>               => tx('liquidaciones', 'readonly',  s => s.get(id));
export const liqSet = (r: Record<string, unknown>): Promise<void>  => tx('liquidaciones', 'readwrite', s => s.put(r)).then(() => {});
export const liqDel = (id: string): Promise<void>                  => tx('liquidaciones', 'readwrite', s => s.delete(id)).then(() => {});
export const liqAll = (): Promise<unknown[]>                        => tx('liquidaciones', 'readonly',  s => s.getAll());

// ── Información de almacenamiento ─────────────────────────────
export async function estimarAlmacenamiento(): Promise<{ usado: number; disponible: number }> {
  if (!navigator.storage?.estimate) return { usado: 0, disponible: 0 };
  const e = await navigator.storage.estimate();
  return { usado: e.usage ?? 0, disponible: e.quota ?? 0 };
}
