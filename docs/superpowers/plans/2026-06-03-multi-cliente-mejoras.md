# Multi-Cliente + Historial por Cliente + Mejoras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir sistema de pestañas por cliente con historial de precios negociados y últimos productos, más mejoras de inconsistencias del codebase.

**Architecture:** Hook `useClients` centraliza todas las sesiones de cliente (carrito, vista, historial de precios). `App.tsx` consume `useClients` en lugar de `useCart` directamente. Nuevos componentes `TabBar`, `ClientModal`, `UltimosProductos` se insertan sobre el catálogo sin romper `ProductCard`, `CartPanel`, `CartReview`, `OrderPDF`.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, Vite 8, XLSX 0.18, Vitest 3, jsdom

---

## Reglas de commits (obligatorio)
- **Sin** `Co-Authored-By:` en ningún commit
- **Sin** `.claude/`, `.superpowers/`, `~$*.xlsx` en ningún commit

---

## File Map

| Archivo | Acción |
|---|---|
| `.gitignore` | Modificar |
| `vite.config.ts` | Modificar — añadir config de tests |
| `package.json` | Modificar — añadir vitest |
| `src/test-setup.ts` | Crear |
| `src/types/clients.ts` | Crear |
| `src/hooks/useExcelData.ts` | Modificar — id con hash djb2 |
| `src/hooks/useClientRegistry.ts` | Crear |
| `src/hooks/useClients.ts` | Crear |
| `src/hooks/__tests__/djb2.test.ts` | Crear |
| `src/hooks/__tests__/useClientRegistry.test.ts` | Crear |
| `src/hooks/__tests__/useClients.test.ts` | Crear |
| `src/components/TabBar.tsx` | Crear |
| `src/components/ClientModal.tsx` | Crear |
| `src/components/UltimosProductos.tsx` | Crear |
| `src/components/ProductCard.tsx` | Modificar — prop `precioNegociado` |
| `src/components/OrderForm.tsx` | Modificar — campos nombre/ubicacion solo-lectura |
| `src/components/ConfirmView.tsx` | Modificar — reemplazar `onNuevoPedido` por `onCerrar` |
| `src/App.tsx` | Modificar — wiring completo con useClients |
| `src/hooks/useCart.ts` | Eliminar |
| `README.md` | Reemplazar |

---

## Task 1: Limpieza de repositorio (.gitignore)

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Actualizar .gitignore**

Reemplazar el contenido de `.gitignore` con:

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Excel lock files (archivo abierto en Excel)
~$*.xlsx

# Claude Code tooling — nunca al repo
.claude/
.superpowers/

# El Excel DEBE estar en el repo para que funcione en GitHub Pages
# Si no quieres que los precios sean públicos, considera otra estrategia de despliegue
# public/catalogo.xlsx

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: update .gitignore — add .claude/, .superpowers/, ~\$*.xlsx"
```

---

## Task 2: Infraestructura de tests (Vitest)

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/test-setup.ts`

- [ ] **Step 1: Instalar dependencias de test**

```bash
npm install -D vitest@^3 @vitest/coverage-v8@^3 @testing-library/react@^16 @testing-library/user-event@^14 @testing-library/jest-dom@^6 jsdom@^26
```

- [ ] **Step 2: Añadir scripts de test a package.json**

En la sección `"scripts"` de `package.json`, añadir:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 3: Actualizar vite.config.ts para tests**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const enCI = process.env.GITHUB_ACTIONS === 'true';
const repo  = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const base  = enCI && repo ? `/${repo}/` : '/';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base,
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['node_modules', 'dist'],
  },
})
```

- [ ] **Step 4: Crear src/test-setup.ts**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Verificar que el runner funciona**

```bash
npm test
```

Resultado esperado: `No test files found` (sin error de configuración).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/test-setup.ts
git commit -m "chore: add vitest + testing-library test infrastructure"
```

---

## Task 3: ID estable con hash djb2 en useExcelData (TDD)

**Files:**
- Create: `src/hooks/__tests__/djb2.test.ts`
- Modify: `src/hooks/useExcelData.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/hooks/__tests__/djb2.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

// djb2 se exportará desde useExcelData como named export interno
// Aquí probamos el comportamiento esperado mediante la función auxiliar
// que añadiremos en el siguiente paso.
import { djb2 } from '../useExcelData';

describe('djb2', () => {
  it('devuelve un número no-negativo', () => {
    expect(djb2('Bolsa Negra')).toBeGreaterThanOrEqual(0);
  });

  it('es determinista — misma entrada, mismo resultado', () => {
    expect(djb2('Bolsa Negra')).toBe(djb2('Bolsa Negra'));
  });

  it('produce valores distintos para entradas distintas', () => {
    expect(djb2('Bolsa Negra')).not.toBe(djb2('Tubo PVC'));
  });

  it('no produce cero para string vacío', () => {
    expect(djb2('')).toBe(5381); // valor inicial del algoritmo
  });

  it('combina nombre y categoria para evitar colisiones entre productos', () => {
    expect(djb2('ProductoXCategoria A')).not.toBe(djb2('Producto XCategoria A'));
  });
});
```

- [ ] **Step 2: Ejecutar para confirmar que falla**

```bash
npm test -- --reporter=verbose src/hooks/__tests__/djb2.test.ts
```

Resultado esperado: `Cannot find module '../useExcelData'` o `djb2 is not exported`.

- [ ] **Step 3: Añadir djb2 a useExcelData.ts y actualizar normalizeRow**

Al inicio de `src/hooks/useExcelData.ts`, después de los imports, añadir:

```ts
export function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul((h << 5) + h, 1) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  return h >>> 0;
}
```

Luego en `normalizeRow`, cambiar la línea `id: index + 1` por:

```ts
id: djb2(nombre + '\0' + categoria),
```

El separador `\0` evita que `"AB" + "C"` y `"A" + "BC"` produzcan el mismo hash.

- [ ] **Step 4: Ejecutar tests para confirmar que pasan**

```bash
npm test -- --reporter=verbose src/hooks/__tests__/djb2.test.ts
```

Resultado esperado: `5 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useExcelData.ts src/hooks/__tests__/djb2.test.ts
git commit -m "feat: use djb2 hash for stable CatalogItem.id in useExcelData"
```

---

## Task 4: Nuevos tipos en src/types/clients.ts

**Files:**
- Create: `src/types/clients.ts`

- [ ] **Step 1: Crear src/types/clients.ts**

```ts
import type { CartItem } from './cart';
import type { OrderFormData } from './catalog';

export interface ClienteRegistrado {
  nombre: string;
  ubicacion: string;
}

export interface ProductoHistorial {
  nombre: string;
  precio: number;
  precioBase: number;
  unidad: string;
  categoria: string;
}

export interface ClienteHistorial {
  ultimosProductos: ProductoHistorial[];
  preciosNegociados: Record<string, number>; // `${nombre}_${unidad}` → precio negociado
}

export interface ClientSession {
  id: string;
  nombre: string;
  ubicacion: string;
  esNuevo: boolean;
  items: CartItem[];
  vista: 'catalogo' | 'revision' | 'confirmado';
  orderForm: OrderFormData;
  preciosNegociados: Record<string, number>;
  ultimosProductos: ProductoHistorial[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/clients.ts
git commit -m "feat: add ClienteRegistrado, ClientSession, ClienteHistorial types"
```

---

## Task 5: Hook useClientRegistry (TDD)

**Files:**
- Create: `src/hooks/__tests__/useClientRegistry.test.ts`
- Create: `src/hooks/useClientRegistry.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/hooks/__tests__/useClientRegistry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseClientesSheet } from '../useClientRegistry';

describe('parseClientesSheet', () => {
  it('parsea filas con columnas Cliente y Ubicacion', () => {
    const rows = [
      { Cliente: 'Juan García', Ubicacion: 'Lima Norte' },
      { Cliente: 'María Pérez', Ubicacion: 'Miraflores' },
    ];
    const result = parseClientesSheet(rows);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ nombre: 'Juan García', ubicacion: 'Lima Norte' });
    expect(result[1]).toEqual({ nombre: 'María Pérez', ubicacion: 'Miraflores' });
  });

  it('acepta columna Ubicación con tilde', () => {
    const rows = [{ Cliente: 'Ana Torres', 'Ubicación': 'San Isidro' }];
    const result = parseClientesSheet(rows);
    expect(result[0].ubicacion).toBe('San Isidro');
  });

  it('ignora filas sin nombre', () => {
    const rows = [
      { Cliente: '', Ubicacion: 'Lima' },
      { Cliente: 'Pedro López', Ubicacion: 'Surco' },
    ];
    expect(parseClientesSheet(rows)).toHaveLength(1);
  });

  it('tolera ubicacion vacía', () => {
    const rows = [{ Cliente: 'Luis', Ubicacion: '' }];
    expect(parseClientesSheet(rows)[0].ubicacion).toBe('');
  });

  it('devuelve array vacío para input vacío', () => {
    expect(parseClientesSheet([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Ejecutar para confirmar que falla**

```bash
npm test -- src/hooks/__tests__/useClientRegistry.test.ts
```

Resultado esperado: `Cannot find module '../useClientRegistry'`.

- [ ] **Step 3: Implementar useClientRegistry.ts**

Crear `src/hooks/useClientRegistry.ts`:

```ts
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
```

- [ ] **Step 4: Ejecutar tests para confirmar que pasan**

```bash
npm test -- src/hooks/__tests__/useClientRegistry.test.ts
```

Resultado esperado: `5 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useClientRegistry.ts src/hooks/__tests__/useClientRegistry.test.ts
git commit -m "feat: add useClientRegistry hook with parseClientesSheet"
```

---

## Task 6: Hook useClients (TDD)

**Files:**
- Create: `src/hooks/__tests__/useClients.test.ts`
- Create: `src/hooks/useClients.ts`

- [ ] **Step 1: Escribir tests que fallan**

Crear `src/hooks/__tests__/useClients.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClients } from '../useClients';

// Mock localStorage
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

const PRODUCTO = {
  id: 123,
  nombre: 'Bolsa Negra 5kg',
  categoria: 'Bolsas',
  precio: 12.5,
  unidad: 'paq',
  preciosExtra: [{ unidad: 'paq', precio: 12.5 }],
};

describe('useClients — sesiones', () => {
  it('inicia sin sesiones ni modal abierto si no hay localStorage', () => {
    const { result } = renderHook(() => useClients());
    expect(result.current.sesiones).toHaveLength(0);
    expect(result.current.modalAbierto).toBe(true); // se abre si no hay sesiones
  });

  it('crearSesion añade una sesión y la activa', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan García', 'Lima Norte', false); });
    expect(result.current.sesiones).toHaveLength(1);
    expect(result.current.sesionActiva?.nombre).toBe('Juan García');
    expect(result.current.sesionActiva?.ubicacion).toBe('Lima Norte');
  });

  it('crearSesion cierra el modal', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Pedro', 'Surco', true); });
    expect(result.current.modalAbierto).toBe(false);
  });

  it('cerrarSesion elimina la sesión', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Ana', 'Surco', true); });
    const id = result.current.sesionActiva!.id;
    act(() => { result.current.cerrarSesion(id); });
    expect(result.current.sesiones).toHaveLength(0);
  });

  it('cerrarSesion activa la siguiente sesión disponible', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Ana', 'Surco', true); });
    act(() => { result.current.crearSesion('Luis', 'Miraflores', true); });
    const primeraId = result.current.sesiones[0].id;
    act(() => { result.current.setActivo(primeraId); });
    act(() => { result.current.cerrarSesion(primeraId); });
    expect(result.current.sesionActiva?.nombre).toBe('Luis');
  });
});

describe('useClients — carrito', () => {
  it('agregar añade producto al carrito de la sesión activa', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 3); });
    expect(result.current.cart.items).toHaveLength(1);
    expect(result.current.cart.items[0].cantidad).toBe(3);
  });

  it('agregar suma cantidad si el mismo cartKey ya existe', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 2); });
    act(() => { result.current.agregar(PRODUCTO, 3); });
    expect(result.current.cart.items[0].cantidad).toBe(5);
  });

  it('agregar usa precioOverride si se proporciona', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 1, 10.00); });
    expect(result.current.cart.items[0].precio).toBe(10.00);
  });

  it('cart.total calcula correctamente', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 2, 10); });
    expect(result.current.cart.total).toBe(20);
  });

  it('vaciar limpia el carrito de la sesión activa', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima', true); });
    act(() => { result.current.agregar(PRODUCTO, 2); });
    act(() => { result.current.vaciar(); });
    expect(result.current.cart.items).toHaveLength(0);
  });
});

describe('useClients — migración pg_carrito', () => {
  it('migra pg_carrito legacy como sesión "Cliente sin asignar"', () => {
    const legacyItems = [{ ...PRODUCTO, cartKey: '123_0', cantidad: 2, nota: undefined }];
    localStorage.setItem('pg_carrito', JSON.stringify(legacyItems));
    const { result } = renderHook(() => useClients());
    expect(result.current.sesiones).toHaveLength(1);
    expect(result.current.sesiones[0].nombre).toBe('Cliente sin asignar');
    expect(result.current.sesiones[0].items).toHaveLength(1);
    expect(localStorage.getItem('pg_carrito')).toBeNull();
  });
});

describe('useClients — confirmarSesion', () => {
  it('cierra la sesión activa y devuelve OrderSummary', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan', 'Lima Norte', false); });
    act(() => { result.current.agregar(PRODUCTO, 2, 10); });
    let summary: ReturnType<typeof result.current.confirmarSesion>;
    act(() => {
      summary = result.current.confirmarSesion({ nombre: 'Juan', ubicacion: 'Lima Norte', notas: '' });
    });
    expect(result.current.sesiones).toHaveLength(0);
    expect(summary!.items).toHaveLength(1);
    expect(summary!.total).toBe(20);
    expect(summary!.numeroPedido).toMatch(/^PED-/);
  });

  it('guarda historial en localStorage al confirmar', () => {
    const { result } = renderHook(() => useClients());
    act(() => { result.current.crearSesion('Juan García', 'Lima Norte', false); });
    act(() => { result.current.agregar(PRODUCTO, 2, 10); });
    act(() => {
      result.current.confirmarSesion({ nombre: 'Juan García', ubicacion: 'Lima Norte', notas: '' });
    });
    const key = 'pg_hist_juan_garcia';
    expect(localStorage.getItem(key)).not.toBeNull();
    const hist = JSON.parse(localStorage.getItem(key)!);
    expect(hist.ultimosProductos[0].nombre).toBe('Bolsa Negra 5kg');
  });
});
```

- [ ] **Step 2: Ejecutar para confirmar que fallan**

```bash
npm test -- src/hooks/__tests__/useClients.test.ts
```

Resultado esperado: `Cannot find module '../useClients'`.

- [ ] **Step 3: Implementar useClients.ts**

Crear `src/hooks/useClients.ts`:

```ts
import { useState, useMemo } from 'react';
import type { CatalogItem, OrderFormData } from '../types/catalog';
import type { CartItem, CartState } from '../types/cart';
import type { ClientSession, ClienteHistorial, ProductoHistorial } from '../types/clients';
import type { OrderSummary } from '../types/order';

const SESIONES_KEY = 'pg_sesiones';
const LEGACY_KEY = 'pg_carrito';

function normalizarNombreHist(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_');
}

function histKey(nombre: string): string {
  return `pg_hist_${normalizarNombreHist(nombre)}`;
}

function cargarHistorial(nombre: string): ClienteHistorial {
  try {
    const raw = localStorage.getItem(histKey(nombre));
    if (raw) return JSON.parse(raw) as ClienteHistorial;
  } catch { /* ignore */ }
  return { ultimosProductos: [], preciosNegociados: {} };
}

function buildHistorial(items: CartItem[]): ClienteHistorial {
  const ultimosProductos: ProductoHistorial[] = items.slice(0, 10).map(i => ({
    nombre: i.nombre,
    precio: i.precio,
    precioBase: i.preciosExtra.find(p => p.unidad === i.unidad)?.precio ?? i.precio,
    unidad: i.unidad,
    categoria: i.categoria,
  }));

  const preciosNegociados: Record<string, number> = {};
  items.forEach(i => {
    const catalogPrice = i.preciosExtra.find(p => p.unidad === i.unidad)?.precio ?? i.precio;
    if (i.precio !== catalogPrice) {
      preciosNegociados[`${i.nombre}_${i.unidad}`] = i.precio;
    }
  });

  return { ultimosProductos, preciosNegociados };
}

function cargarSesiones(): ClientSession[] {
  try {
    const raw = localStorage.getItem(SESIONES_KEY);
    if (raw) return JSON.parse(raw) as ClientSession[];

    // Migración desde pg_carrito legacy
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const items = JSON.parse(legacy) as CartItem[];
      localStorage.removeItem(LEGACY_KEY);
      if (items.length > 0) {
        return [{
          id: 'migrado-' + Date.now().toString(36),
          nombre: 'Cliente sin asignar',
          ubicacion: '',
          esNuevo: true,
          items,
          vista: 'catalogo',
          orderForm: { nombre: '', ubicacion: '', notas: '' },
          preciosNegociados: {},
          ultimosProductos: [],
        }];
      }
    }
  } catch { /* ignore */ }
  return [];
}

function guardar(sesiones: ClientSession[]) {
  try { localStorage.setItem(SESIONES_KEY, JSON.stringify(sesiones)); } catch { /* quota */ }
}

export function useClients() {
  const [sesiones, setSesionesRaw] = useState<ClientSession[]>(cargarSesiones);
  const [activoId, setActivoId] = useState<string | null>(
    () => cargarSesiones()[0]?.id ?? null
  );
  const [modalAbierto, setModalAbierto] = useState<boolean>(
    () => cargarSesiones().length === 0
  );

  function setSesiones(next: ClientSession[]) {
    setSesionesRaw(next);
    guardar(next);
  }

  const sesionActiva = useMemo(
    () => sesiones.find(s => s.id === activoId) ?? null,
    [sesiones, activoId]
  );

  const cart: CartState = useMemo(() => {
    const items = sesionActiva?.items ?? [];
    return {
      items,
      total: items.reduce((s, i) => s + i.precio * i.cantidad, 0),
      totalUnidades: items.reduce((s, i) => s + i.cantidad, 0),
    };
  }, [sesionActiva]);

  // ── Session management ──────────────────────────────

  function crearSesion(nombre: string, ubicacion: string, esNuevo: boolean) {
    const id = 'ses-' + Date.now().toString(36);
    const hist = esNuevo ? { ultimosProductos: [], preciosNegociados: {} } : cargarHistorial(nombre);
    const sesion: ClientSession = {
      id, nombre, ubicacion, esNuevo,
      items: [],
      vista: 'catalogo',
      orderForm: { nombre, ubicacion, notas: '' },
      preciosNegociados: hist.preciosNegociados,
      ultimosProductos: hist.ultimosProductos,
    };
    const next = [...sesiones, sesion];
    setSesiones(next);
    setActivoId(id);
    setModalAbierto(false);
  }

  function cerrarSesion(id: string) {
    const next = sesiones.filter(s => s.id !== id);
    setSesiones(next);
    if (activoId === id) {
      setActivoId(next[0]?.id ?? null);
      if (next.length === 0) setModalAbierto(true);
    }
  }

  function setActivo(id: string) {
    setActivoId(id);
  }

  function confirmarSesion(form: OrderFormData): OrderSummary {
    const sesion = sesiones.find(s => s.id === activoId);
    if (!sesion) throw new Error('No hay sesión activa');

    const summary: OrderSummary = {
      numeroPedido: 'PED-' + Date.now().toString(36).toUpperCase(),
      fecha: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      form,
      items: [...sesion.items],
      total: sesion.items.reduce((s, i) => s + i.precio * i.cantidad, 0),
    };

    try {
      localStorage.setItem(histKey(sesion.nombre), JSON.stringify(buildHistorial(sesion.items)));
    } catch { /* quota */ }

    const next = sesiones.filter(s => s.id !== activoId);
    setSesiones(next);
    setActivoId(next[0]?.id ?? null);
    if (next.length === 0) setModalAbierto(true);

    return summary;
  }

  function setVista(vista: ClientSession['vista']) {
    if (!activoId) return;
    setSesiones(sesiones.map(s => s.id === activoId ? { ...s, vista } : s));
  }

  function setOrderForm(form: OrderFormData) {
    if (!activoId) return;
    setSesiones(sesiones.map(s => s.id === activoId ? { ...s, orderForm: form } : s));
  }

  // ── Cart operations (apply to active session) ────────

  function _updateItems(updater: (items: CartItem[]) => CartItem[]) {
    if (!activoId) return;
    setSesiones(sesiones.map(s =>
      s.id === activoId ? { ...s, items: updater(s.items) } : s
    ));
  }

  function getPrecioNegociado(nombre: string, unidad: string): number | undefined {
    return sesionActiva?.preciosNegociados[`${nombre}_${unidad}`];
  }

  function agregar(
    producto: CatalogItem,
    cantidad: number,
    precioOverride?: number,
    unidadOverride?: string,
    opcionIdx?: number,
    nota?: string,
  ) {
    if (cantidad <= 0) return;
    const unidad = unidadOverride ?? producto.unidad;
    const precio = precioOverride ?? getPrecioNegociado(producto.nombre, unidad) ?? producto.precio;
    const cartKey = `${producto.id}_${opcionIdx ?? 0}`;
    _updateItems(items => {
      const idx = items.findIndex(i => i.cartKey === cartKey);
      if (idx >= 0) {
        const next = [...items];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + cantidad };
        return next;
      }
      return [...items, { ...producto, precio, unidad, cartKey, cantidad, nota }];
    });
  }

  function sumarUno(cartKey: string) {
    _updateItems(items => items.map(i =>
      i.cartKey === cartKey ? { ...i, cantidad: i.cantidad + 1 } : i
    ));
  }

  function quitarUno(cartKey: string) {
    _updateItems(items => {
      const idx = items.findIndex(i => i.cartKey === cartKey);
      if (idx < 0) return items;
      const next = [...items];
      if (next[idx].cantidad <= 1) next.splice(idx, 1);
      else next[idx] = { ...next[idx], cantidad: next[idx].cantidad - 1 };
      return next;
    });
  }

  function cambiarCantidad(cartKey: string, cantidad: number) {
    const val = Math.round(cantidad * 1000) / 1000;
    if (!isFinite(val) || val <= 0) {
      _updateItems(items => items.filter(i => i.cartKey !== cartKey));
      return;
    }
    _updateItems(items => items.map(i =>
      i.cartKey === cartKey ? { ...i, cantidad: val } : i
    ));
  }

  function cambiarPrecio(cartKey: string, precio: number) {
    if (!isFinite(precio) || precio <= 0) return;
    _updateItems(items => items.map(i =>
      i.cartKey === cartKey ? { ...i, precio } : i
    ));
  }

  function cambiarNota(cartKey: string, nota: string) {
    _updateItems(items => items.map(i =>
      i.cartKey === cartKey ? { ...i, nota: nota.trim() || undefined } : i
    ));
  }

  function eliminar(cartKey: string) {
    _updateItems(items => items.filter(i => i.cartKey !== cartKey));
  }

  function vaciar() {
    _updateItems(() => []);
  }

  function agregarManual(nombre: string, categoria: string, unidad: string, precio: number, cantidad: number) {
    const item: CatalogItem = {
      id: -Date.now(),
      nombre, categoria, precio, unidad,
      preciosExtra: [{ unidad, precio }],
    };
    agregar(item, cantidad, precio, unidad, 0);
  }

  return {
    sesiones,
    activoId,
    sesionActiva,
    modalAbierto,
    setModalAbierto,
    cart,
    crearSesion,
    cerrarSesion,
    setActivo,
    confirmarSesion,
    setVista,
    setOrderForm,
    getPrecioNegociado,
    agregar,
    sumarUno,
    quitarUno,
    cambiarCantidad,
    cambiarPrecio,
    cambiarNota,
    eliminar,
    vaciar,
    agregarManual,
  };
}
```

- [ ] **Step 4: Ejecutar tests**

```bash
npm test -- src/hooks/__tests__/useClients.test.ts
```

Resultado esperado: todos los tests pasan.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useClients.ts src/hooks/__tests__/useClients.test.ts
git commit -m "feat: add useClients hook with multi-session cart and history"
```

---

## Task 7: Componente TabBar

**Files:**
- Create: `src/components/TabBar.tsx`

- [ ] **Step 1: Crear src/components/TabBar.tsx**

```tsx
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

      {/* Espaciador para que las pestañas no queden pegadas al borde derecho */}
      <div className="flex-1 min-w-2" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TabBar.tsx
git commit -m "feat: add TabBar component"
```

---

## Task 8: Componente ClientModal

**Files:**
- Create: `src/components/ClientModal.tsx`

- [ ] **Step 1: Crear src/components/ClientModal.tsx**

```tsx
import { useState, useMemo } from 'react';
import type { ClienteRegistrado } from '../types/clients';

interface Props {
  clientes: ClienteRegistrado[];
  sesionesActivas: { nombre: string }[];
  onConfirmar: (nombre: string, ubicacion: string, esNuevo: boolean) => void;
  onCancelar?: () => void;
  puedeCancelar: boolean;
}

type Modo = 'registrado' | 'nuevo';

function buscarClientes(clientes: ClienteRegistrado[], q: string): ClienteRegistrado[] {
  if (!q.trim()) return clientes;
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const qn = norm(q);
  return clientes.filter(c => norm(c.nombre).includes(qn));
}

export function ClientModal({ clientes, sesionesActivas, onConfirmar, onCancelar, puedeCancelar }: Props) {
  const [modo, setModo] = useState<Modo>('registrado');
  const [busqueda, setBusqueda] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');
  const [error, setError] = useState('');

  const nombresActivos = new Set(sesionesActivas.map(s => s.nombre.toLowerCase()));

  const resultados = useMemo(() => {
    const filtered = buscarClientes(clientes, busqueda);
    return filtered;
  }, [clientes, busqueda]);

  function handleSeleccionar(cliente: ClienteRegistrado) {
    if (nombresActivos.has(cliente.nombre.toLowerCase())) {
      setError(`${cliente.nombre} ya tiene una pestaña abierta.`);
      return;
    }
    onConfirmar(cliente.nombre, cliente.ubicacion, false);
  }

  function handleNuevo() {
    if (!nuevoNombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!nuevaUbicacion.trim()) { setError('La ubicación es obligatoria.'); return; }
    onConfirmar(nuevoNombre.trim(), nuevaUbicacion.trim(), true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={puedeCancelar ? onCancelar : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ background: '#1a3a6b' }}>
          <span className="text-white font-bold text-sm">Seleccionar cliente</span>
          {puedeCancelar && (
            <button onClick={onCancelar} className="text-white/50 hover:text-white text-lg leading-none transition-colors">✕</button>
          )}
        </div>

        {/* Toggle */}
        <div className="px-4 pt-4">
          <div className="flex gap-1 bg-blue-50 rounded-lg p-1">
            {(['registrado', 'nuevo'] as Modo[]).map(m => (
              <button
                key={m}
                onClick={() => { setModo(m); setError(''); }}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
                  modo === m ? 'bg-[#1a3a6b] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'registrado' ? 'Cliente registrado' : 'Nuevo cliente'}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="px-4 py-3 space-y-3">
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {modo === 'registrado' ? (
            <>
              <input
                type="search"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setError(''); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                autoFocus
              />
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {resultados.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">No se encontraron clientes.</p>
                )}
                {resultados.map(c => {
                  const activo = nombresActivos.has(c.nombre.toLowerCase());
                  return (
                    <button
                      key={c.nombre}
                      onClick={() => handleSeleccionar(c)}
                      disabled={activo}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${
                        activo
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer'
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{c.nombre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">📍 {c.ubicacion || '—'}</p>
                      {activo && <p className="text-[10px] text-blue-500 mt-0.5">Ya tiene pestaña abierta</p>}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre *</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={e => { setNuevoNombre(e.target.value); setError(''); }}
                  placeholder="Ej: Roberto Sánchez"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ubicación *</label>
                <input
                  type="text"
                  value={nuevaUbicacion}
                  onChange={e => { setNuevaUbicacion(e.target.value); setError(''); }}
                  placeholder="Ej: Los Olivos"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />
              </div>
              <button
                onClick={handleNuevo}
                className="w-full py-2.5 bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-bold rounded-xl transition-colors"
              >
                Crear pestaña
              </button>
            </div>
          )}
        </div>

        {modo === 'registrado' && <div className="pb-4" />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ClientModal.tsx
git commit -m "feat: add ClientModal with registered/new client toggle"
```

---

## Task 9: Componente UltimosProductos

**Files:**
- Create: `src/components/UltimosProductos.tsx`

- [ ] **Step 1: Crear src/components/UltimosProductos.tsx**

```tsx
import type { ProductoHistorial } from '../types/clients';
import type { CatalogItem } from '../types/catalog';
import { formatSoles } from '../utils/format';

interface Props {
  productos: ProductoHistorial[];
  catalogData: CatalogItem[];
  onAgregar: (item: CatalogItem, cantidad: number, precioOverride: number, unidadOverride: string, opcionIdx: number) => void;
  clienteNombre: string;
}

export function UltimosProductos({ productos, catalogData, onAgregar, clienteNombre }: Props) {
  if (productos.length === 0) return null;

  function findCatalogItem(nombre: string, unidad: string): CatalogItem | undefined {
    return catalogData.find(c => c.nombre === nombre);
  }

  return (
    <div className="border-b-2 border-amber-200" style={{ background: '#fffbeb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
          <span>⏱</span>
          Últimos productos de {clienteNombre}
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {productos.map((p, i) => {
            const catalogItem = findCatalogItem(p.nombre, p.unidad);
            const disponible = Boolean(catalogItem);
            const opcionIdx = catalogItem?.preciosExtra.findIndex(pe => pe.unidad === p.unidad) ?? 0;
            const esNegociado = p.precio !== p.precioBase;

            return (
              <div
                key={i}
                className="bg-white border border-amber-200 rounded-xl p-3 flex-shrink-0 w-36 flex flex-col gap-1.5"
              >
                <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-2 min-h-[2rem]">
                  {p.nombre}
                </p>
                <div className="flex-1">
                  <p className="text-sm font-black text-red-600">{formatSoles(p.precio)}</p>
                  {esNegociado && (
                    <p className="text-[10px] text-gray-400 line-through">{formatSoles(p.precioBase)}</p>
                  )}
                  <p className="text-[10px] text-gray-400">{p.unidad}</p>
                </div>
                <button
                  disabled={!disponible}
                  onClick={() => catalogItem && onAgregar(catalogItem, 1, p.precio, p.unidad, Math.max(0, opcionIdx))}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    disponible
                      ? 'bg-[#1a3a6b] hover:bg-[#2554a0] text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {disponible ? '+ Agregar' : 'No disponible'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/UltimosProductos.tsx
git commit -m "feat: add UltimosProductos component with negotiated price display"
```

---

## Task 10: ProductCard — precio negociado

**Files:**
- Modify: `src/components/ProductCard.tsx`

- [ ] **Step 1: Añadir prop `precioNegociado` a la interfaz Props**

En `src/components/ProductCard.tsx`, cambiar la interfaz `Props`:

```ts
interface Props {
  item: CatalogItem;
  precioNegociado?: number;
  onAgregar: (item: CatalogItem, cantidad: number, precioOverride?: number, unidadOverride?: string, opcionIdx?: number, nota?: string) => void;
}
```

- [ ] **Step 2: Usar precioNegociado en ProductCard**

Cambiar la firma de `ProductCard`:

```tsx
export function ProductCard({ item, precioNegociado, onAgregar }: Props) {
```

Y en el bloque del nombre del producto (antes del botón Agregar), añadir indicador de precio negociado:

```tsx
{/* Precio negociado */}
{precioNegociado !== undefined && (
  <div className="px-4 pb-2 -mt-1">
    <p className="text-sm font-black text-red-600">
      {formatSoles(precioNegociado)}
      <span className="text-xs text-gray-400 line-through ml-1.5 font-normal">
        {formatSoles(item.precio)}
      </span>
    </p>
  </div>
)}
```

Añadir este bloque justo antes del bloque `{/* Botón agregar */}`.

- [ ] **Step 3: Pasar precioNegociado al ProductModal**

Cambiar la llamada a `ProductModal` dentro de `ProductCard`:

```tsx
{modalOpen && (
  <ProductModal
    item={item}
    color={color}
    precioNegociado={precioNegociado}
    onClose={() => setModalOpen(false)}
    onAgregar={(it, cant, precio, unidad, idx) => {
      onAgregar(it, cant, precio, unidad, idx);
      setModalOpen(false);
    }}
  />
)}
```

- [ ] **Step 4: Actualizar ModalProps y ProductModal**

Añadir `precioNegociado?: number` a `ModalProps` y en `ProductModal`, cambiar el `useEffect` que sincroniza `precioInput`:

```tsx
useEffect(() => {
  const base = selectedOpcion.precio > 0 ? selectedOpcion.precio : 0;
  const negociado = precioNegociado !== undefined ? precioNegociado : base;
  setPrecioInput(negociado > 0 ? String(negociado) : '');
}, [selectedIdx, selectedOpcion.precio, precioNegociado]);
```

- [ ] **Step 5: Importar formatSoles en ProductCard** (si no está)

Añadir al inicio de `ProductCard.tsx`:

```ts
import { formatSoles } from '../utils/format';
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ProductCard.tsx
git commit -m "feat: show negotiated price in ProductCard and pre-fill modal"
```

---

## Task 11: OrderForm — nombre y ubicación pre-llenados (solo-lectura)

**Files:**
- Modify: `src/components/OrderForm.tsx`

- [ ] **Step 1: Añadir prop `readOnlyDatos` a OrderForm**

Cambiar la interfaz Props:

```ts
interface Props {
  form: OrderFormData;
  ubicaciones: string[];
  onChange: (form: OrderFormData) => void;
  errors: Partial<Record<keyof OrderFormData, string>>;
  readOnlyDatos?: boolean;
}
```

- [ ] **Step 2: Aplicar readOnly a campos nombre y ubicación**

Cambiar la firma:

```tsx
export function OrderForm({ form, ubicaciones, onChange, errors, readOnlyDatos = false }: Props) {
```

En el campo nombre, cambiar el `<input>` para que sea solo-lectura cuando `readOnlyDatos`:

```tsx
<input
  type="text"
  value={form.nombre}
  onChange={readOnlyDatos ? undefined : e => set('nombre', e.target.value)}
  readOnly={readOnlyDatos}
  placeholder="Ej: Juan Pérez"
  className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition
    ${readOnlyDatos
      ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-default'
      : errors.nombre
        ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
        : 'border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
    }`}
/>
```

En el campo ubicación, cuando `readOnlyDatos`, siempre mostrar `<input readOnly>` en lugar del select:

```tsx
{ubicaciones.length > 0 && !readOnlyDatos ? (
  <select ...>...</select>
) : (
  <input
    type="text"
    value={form.ubicacion}
    onChange={readOnlyDatos ? undefined : e => set('ubicacion', e.target.value)}
    readOnly={readOnlyDatos}
    placeholder="Escribe tu distrito o zona"
    className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition
      ${readOnlyDatos
        ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-default'
        : errors.ubicacion
          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
          : 'border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
      }`}
  />
)}
{!readOnlyDatos && ubicaciones.length === 0 && (
  <p className="text-xs text-amber-600 mt-1">
    Agrega una hoja "Configuracion" con columna "Ubicación" en el Excel para habilitar el selector.
  </p>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/OrderForm.tsx
git commit -m "feat: add readOnlyDatos prop to OrderForm for pre-filled client data"
```

---

## Task 12: ConfirmView — callback onCerrar

**Files:**
- Modify: `src/components/ConfirmView.tsx`

- [ ] **Step 1: Leer el componente actual**

```bash
# Solo verificar la prop actual onNuevoPedido en ConfirmView
```

- [ ] **Step 2: Renombrar onNuevoPedido → onCerrar en Props**

En `src/components/ConfirmView.tsx`, buscar la interfaz Props y cambiar:

```ts
// Antes:
onNuevoPedido: () => void;
// Después:
onCerrar: () => void;
```

Actualizar también el uso del prop en el botón "Hacer otro pedido":

```tsx
// Antes:
onClick={onNuevoPedido}
// Después:
onClick={onCerrar}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ConfirmView.tsx
git commit -m "refactor: rename onNuevoPedido to onCerrar in ConfirmView"
```

---

## Task 13: App.tsx — wiring completo

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/hooks/useCart.ts`

- [ ] **Step 1: Eliminar useCart.ts**

```bash
git rm src/hooks/useCart.ts
```

- [ ] **Step 2: Reemplazar App.tsx completo**

```tsx
import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useExcelData } from './hooks/useExcelData';
import { useClients } from './hooks/useClients';
import { useClientRegistry } from './hooks/useClientRegistry';
import { ProductCard } from './components/ProductCard';
import { CartPanel } from './components/CartPanel';
import { CartReview } from './components/CartReview';
import { CategoryFilter } from './components/CategoryFilter';
import { TabBar } from './components/TabBar';
import { ClientModal } from './components/ClientModal';
import { UltimosProductos } from './components/UltimosProductos';
import type { CatalogItem, OrderFormData } from './types/catalog';
import type { OrderSummary } from './types/order';
import { buscarProductos } from './utils/busqueda';

const ConfirmView = lazy(() =>
  import('./components/ConfirmView').then(m => ({ default: m.ConfirmView }))
);

export default function App() {
  const { data, ubicaciones, whatsapp, loading, error } = useExcelData();
  const { clientes } = useClientRegistry();
  const {
    sesiones, activoId, sesionActiva, modalAbierto, setModalAbierto,
    cart, crearSesion, cerrarSesion, setActivo, confirmarSesion,
    setVista, setOrderForm, getPrecioNegociado,
    agregar, sumarUno, quitarUno, cambiarCantidad, cambiarPrecio,
    cambiarNota, eliminar, vaciar, agregarManual,
  } = useClients();

  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaFiltro, setBusquedaFiltro] = useState('');
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [cartBumpKey, setCartBumpKey] = useState(0);
  const [ultimoPedido, setUltimoPedido] = useState<OrderSummary | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setBusquedaFiltro(busqueda), 220);
    return () => clearTimeout(t);
  }, [busqueda]);

  const vista = sesionActiva?.vista ?? 'catalogo';

  const categorias = useMemo(() => {
    const set = new Set(data.map(i => i.categoria).filter(Boolean));
    return ['Todas', ...Array.from(set).sort()];
  }, [data]);

  const productosFiltrados = useMemo(() => {
    const porCategoria = categoriaActiva === 'Todas'
      ? data
      : data.filter(i => i.categoria === categoriaActiva);
    if (!busquedaFiltro.trim()) {
      return [...porCategoria].sort((a, b) => {
        const cat = a.categoria.localeCompare(b.categoria, 'es');
        return cat !== 0 ? cat : a.nombre.localeCompare(b.nombre, 'es');
      });
    }
    return buscarProductos(porCategoria, busquedaFiltro);
  }, [data, categoriaActiva, busquedaFiltro]);

  function handleAgregar(item: CatalogItem, cantidad: number, precioOverride?: number, unidadOverride?: string, opcionIdx?: number, nota?: string) {
    agregar(item, cantidad, precioOverride, unidadOverride, opcionIdx, nota);
    setCartBumpKey(k => k + 1);
  }

  function handleConfirmar(form: OrderFormData) {
    const summary = confirmarSesion(form);
    setUltimoPedido(summary);
  }

  function handleCerrarConfirmacion() {
    setUltimoPedido(null);
  }

  function handleCerrarPestana(id: string) {
    const sesion = sesiones.find(s => s.id === id);
    if (sesion && sesion.items.length > 0) {
      if (!confirm(`¿Cerrar la pestaña de ${sesion.nombre}? Se perderá el pedido en curso.`)) return;
    }
    cerrarSesion(id);
  }

  // ── Vista: confirmado (modal overlay) ──────────────
  const confirmOverlay = ultimoPedido && (
    <Suspense fallback={null}>
      <ConfirmView
        summary={ultimoPedido}
        whatsapp={whatsapp}
        onCerrar={handleCerrarConfirmacion}
      />
    </Suspense>
  );

  // ── Vista: revisión ──────────────────────────────────
  if (vista === 'revision') {
    return (
      <>
        <AppHeader busqueda="" setBusqueda={() => {}} totalUnidades={0} cartBumpKey={0} onCarritoClick={() => {}} />
        <TabBar
          sesiones={sesiones}
          activoId={activoId}
          onSeleccionar={setActivo}
          onCerrar={handleCerrarPestana}
          onNuevo={() => setModalAbierto(true)}
        />
        <CartReview
          cart={cart}
          ubicaciones={ubicaciones}
          onSumarUno={sumarUno}
          onQuitarUno={quitarUno}
          onCambiarCantidad={cambiarCantidad}
          onEliminar={eliminar}
          onCambiarPrecio={cambiarPrecio}
          onCambiarNota={cambiarNota}
          onAgregarManual={agregarManual}
          onVolver={() => setVista('catalogo')}
          onConfirmar={handleConfirmar}
          readOnlyDatos
        />
        {confirmOverlay}
        {modalAbierto && (
          <ClientModal
            clientes={clientes}
            sesionesActivas={sesiones}
            onConfirmar={crearSesion}
            onCancelar={() => setModalAbierto(false)}
            puedeCancelar={sesiones.length > 0}
          />
        )}
      </>
    );
  }

  // ── Vista: catálogo (principal) ──────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <AppHeader
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        totalUnidades={cart.totalUnidades}
        cartBumpKey={cartBumpKey}
        onCarritoClick={() => setCarritoAbierto(o => !o)}
      />

      <TabBar
        sesiones={sesiones}
        activoId={activoId}
        onSeleccionar={setActivo}
        onCerrar={handleCerrarPestana}
        onNuevo={() => setModalAbierto(true)}
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex gap-6">
        <main className="flex-1 min-w-0">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm">Cargando catálogo...</p>
            </div>
          )}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-2">
              <p className="text-3xl">⚠️</p>
              <p className="font-bold text-red-800">No se pudo cargar el catálogo</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {!loading && !error && sesionActiva && (
            <>
              <UltimosProductos
                productos={sesionActiva.ultimosProductos}
                catalogData={data}
                onAgregar={(item, cant, precio, unidad, idx) => {
                  handleAgregar(item, cant, precio, unidad, idx);
                }}
                clienteNombre={sesionActiva.nombre}
              />
              <div className="mt-5 mb-4">
                <CategoryFilter
                  categorias={categorias}
                  activa={categoriaActiva}
                  onChange={setCategoriaActiva}
                />
              </div>
              <p className="text-xs text-gray-400 mb-4">
                {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
                {categoriaActiva !== 'Todas' && ` en "${categoriaActiva}"`}
                {busquedaFiltro && ` · "${busquedaFiltro}"`}
                {busqueda !== busquedaFiltro && (
                  <span className="text-[10px] text-gray-300 animate-pulse ml-2">buscando…</span>
                )}
              </p>
              {productosFiltrados.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-sm">No se encontraron productos.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productosFiltrados.map(item => {
                    const negociado = getPrecioNegociado(item.nombre, item.unidad);
                    return (
                      <ProductCard
                        key={item.id}
                        item={item}
                        precioNegociado={negociado}
                        onAgregar={handleAgregar}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
          {!loading && !error && !sesionActiva && (
            <div className="text-center py-24 text-gray-400">
              <p className="text-4xl mb-4">👤</p>
              <p className="text-sm">No hay cliente activo. Crea una nueva pestaña para comenzar.</p>
            </div>
          )}
        </main>

        {/* Panel carrito desktop */}
        <aside className="hidden lg:flex flex-col w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-[calc(100vh-8rem)] sticky top-20">
          <CartPanel
            cart={cart}
            onSumarUno={sumarUno}
            onQuitarUno={quitarUno}
            onCambiarCantidad={cambiarCantidad}
            onEliminar={eliminar}
            onVaciar={vaciar}
            onVerPedido={() => setVista('revision')}
          />
        </aside>
      </div>

      {/* Drawer móvil */}
      {carritoAbierto && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setCarritoAbierto(false)} />
          <div className="w-80 bg-white h-full shadow-2xl flex flex-col p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-800">Pedido — {sesionActiva?.nombre ?? '—'}</span>
              <button onClick={() => setCarritoAbierto(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
            </div>
            <CartPanel
              cart={cart}
              onSumarUno={sumarUno}
              onQuitarUno={quitarUno}
              onCambiarCantidad={cambiarCantidad}
              onEliminar={eliminar}
              onVaciar={vaciar}
              onVerPedido={() => { setCarritoAbierto(false); setVista('revision'); }}
            />
          </div>
        </div>
      )}

      {confirmOverlay}

      {modalAbierto && (
        <ClientModal
          clientes={clientes}
          sesionesActivas={sesiones}
          onConfirmar={crearSesion}
          onCancelar={() => setModalAbierto(false)}
          puedeCancelar={sesiones.length > 0}
        />
      )}
    </div>
  );
}

/* ── Header compartido ─────────────────────────────── */
function AppHeader({
  busqueda, setBusqueda, totalUnidades, cartBumpKey, onCarritoClick,
}: {
  busqueda: string;
  setBusqueda: (v: string) => void;
  totalUnidades: number;
  cartBumpKey: number;
  onCarritoClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 shadow-lg" style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #2554a0 60%, #c0392b 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ background: '#c0392b' }}>PG</span>
          <div className="min-w-0">
            <p className="text-white font-extrabold text-base leading-tight truncate">Plásticos Guerrero</p>
            <p className="text-white/60 text-xs uppercase tracking-wide hidden sm:block">Catálogo de Productos</p>
          </div>
        </div>
        <div className="flex-1 max-w-md hidden sm:block relative">
          <input
            type="search"
            placeholder="Buscar por nombre, categoría…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-4 pr-8 py-2 rounded-lg bg-white/15 text-white placeholder-white/60 border border-white/20 outline-none focus:bg-white/25 focus:border-white/50 transition text-sm"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-base leading-none transition-colors">✕</button>
          )}
        </div>
        <button
          onClick={onCarritoClick}
          className="relative flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-2 rounded-lg transition text-sm font-semibold flex-shrink-0"
        >
          <span key={cartBumpKey} className={cartBumpKey > 0 ? 'cart-bump' : ''}>🛒</span>
          <span className="hidden sm:inline">Pedido</span>
          {totalUnidades > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">{totalUnidades}</span>
          )}
        </button>
      </div>
      <div className="sm:hidden px-4 pb-3 relative">
        <input
          type="search"
          placeholder="Buscar por nombre, categoría…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-4 pr-8 py-2 rounded-lg bg-white/15 text-white placeholder-white/60 border border-white/20 outline-none focus:bg-white/25 transition text-sm"
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-base leading-none transition-colors">✕</button>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Añadir readOnlyDatos a CartReview**

En `src/components/CartReview.tsx`, añadir la prop a la interfaz (línea ~29) y a la desestructuración:

```ts
// En la interfaz Props, después de onConfirmar:
readOnlyDatos?: boolean;
```

```tsx
// En la firma de CartReview, después de onConfirmar:
export function CartReview({
  cart, ubicaciones, onSumarUno, onQuitarUno, onCambiarCantidad,
  onEliminar, onCambiarPrecio, onCambiarNota, onAgregarManual,
  onVolver, onConfirmar, readOnlyDatos = false,
}: Props) {
```

Luego buscar el `<OrderForm` dentro de CartReview y añadir la prop:

```tsx
<OrderForm
  form={form}
  ubicaciones={ubicaciones}
  onChange={setForm}
  errors={errores}
  readOnlyDatos={readOnlyDatos}
/>
```

- [ ] **Step 4: Ejecutar la app y verificar**

```bash
npm run dev
```

Verificar:
- La app abre sin errores de compilación TypeScript
- Se muestra el `ClientModal` al cargar (sin sesiones)
- Crear una sesión → aparece la pestaña y el catálogo
- Agregar productos → el total en la pestaña se actualiza
- Crear segunda sesión → dos pestañas, cambio entre ellas es independiente
- Confirmar pedido → pestaña desaparece, `ConfirmView` aparece como overlay

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/hooks/useCart.ts src/components/CartReview.tsx
git commit -m "feat: wire multi-client tabs, ClientModal, UltimosProductos into App"
```

---

## Task 14: README.md

**Files:**
- Replace: `README.md`

- [ ] **Step 1: Reemplazar README.md**

```markdown
# PreventaPG — Catálogo de Pedidos

App de gestión de pedidos para el equipo de ventas de **Plásticos Guerrero**. Permite atender múltiples clientes en simultáneo, generar PDFs de pedido y enviarlos por WhatsApp.

## Características

- **Múltiples clientes en simultáneo** — pestañas independientes por cliente
- **Historial de precios** — carga automáticamente los precios negociados de pedidos anteriores
- **Últimos productos** — acceso rápido a los productos del último pedido de cada cliente
- **PDF + WhatsApp** — confirmación de pedido descargable y enviable
- **Sin backend** — todo corre en el navegador, datos en `localStorage`

## Archivos Excel

Coloca los siguientes archivos en la carpeta `/public`:

### `catalogo.xlsx`
Primera hoja con las columnas:

| Categoría | Producto | Unidad 1 | Precio 1 | Unidad 2 | Precio 2 |
|-----------|----------|----------|----------|----------|----------|
| Bolsas | Bolsa Negra 5kg | paq | 12.50 | und | 0.85 |

Hoja adicional `Configuracion`:

| Tipo | Valor |
|------|-------|
| Ubicación | Lima Norte |
| WhatsApp | 51963243948 |

### `clientes.xlsx`
Primera hoja con la lista de clientes registrados:

| Cliente | Ubicacion |
|---------|-----------|
| Juan García | Lima Norte |
| María Pérez | Miraflores |

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitarios
npm run build      # build de producción
```

## Deploy (GitHub Pages)

El deploy a GitHub Pages es automático al hacer push a `main` si tienes configurado el workflow de GitHub Actions. La app detecta la variable `GITHUB_REPOSITORY` para configurar el `base` path automáticamente.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: replace generic README with actual project documentation"
```

---

## Verificación final

- [ ] `npm test` — todos los tests pasan sin errores
- [ ] `npm run build` — build sin errores TypeScript
- [ ] `npm run dev` — flujo completo funcional: crear cliente → agregar productos → confirmar → historial en siguiente sesión del mismo cliente
