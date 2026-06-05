const BACKUP_PREFIX = 'pg_';
const BACKUP_VERSION = 1;

export function exportarDatos(): void {
  const datos: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BACKUP_PREFIX)) {
      try {
        datos[key] = JSON.parse(localStorage.getItem(key)!);
      } catch {
        datos[key] = localStorage.getItem(key);
      }
    }
  }

  const backup = { version: BACKUP_VERSION, exportado: new Date().toISOString(), datos };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `preventapg-backup-${new Date().toLocaleDateString('es-PE').replace(/\//g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importarDatos(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        if (!backup?.datos || typeof backup.datos !== 'object') {
          reject(new Error('Archivo inválido — no contiene datos de PreventaPG.'));
          return;
        }
        // Limpiar claves pg_ existentes antes de restaurar
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(BACKUP_PREFIX)) keysToRemove.push(k);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // Restaurar
        for (const [key, value] of Object.entries(backup.datos)) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch { /* quota */ }
        }
        resolve();
      } catch {
        reject(new Error('No se pudo leer el archivo. ¿Es un backup válido?'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsText(file);
  });
}
