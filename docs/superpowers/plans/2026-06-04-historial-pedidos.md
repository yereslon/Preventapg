# Historial de Pedidos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir una vista de historial completo de pedidos por cliente, accesible desde el menú ⚙, con navegación en tres niveles y opción de abrir cualquier pedido anterior para editarlo.

**Architecture:** Se añade `PedidoHistorial[]` a `ClienteHistorial` en localStorage. Un nuevo hook `useHistorial` lee todos los `pg_hist_*`. El componente `HistorialView` navega en tres niveles (clientes → pedidos → detalle). `useClients` expone `crearSesionConItems` para cargar un pedido histórico en la vista de revisión.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, Vitest 3, localStorage

---

## Reglas de commits
- Sin `Co-Authored-By:` en ningún commit

---

## File Map

| Archivo | Acción |
|---|---|
| `src/types/clients.ts` | Modificar — añadir `PedidoHistorial`, añadir `pedidos` a `ClienteHistorial` |
| `src/hooks/useClients.ts` | Modificar — `buildHistorial` guarda pedidos, añadir `crearSesionConItems` |
| `src/hooks/useHistorial.ts` | Crear — lector de historial desde localStorage |
| `src/hooks/__tests__/useClients.test.ts` | Modificar — tests para pedidos en historial y `crearSesionConItems` |
| `src/hooks/__tests__/useHistorial.test.ts` | Crear — tests para el hook |
| `src/components/HistorialView.tsx` | Crear — vista de tres niveles |
| `src/App.tsx` | Modificar — estado `historialAbierto`, opción en menú, vista condicional |

---

## Task 1: Nuevos tipos — PedidoHistorial y ClienteHistorial

**Files:**
- Modify: `src/types/clients.ts`

- [ ] **Step 1: Añadir `PedidoHistorial` e importar `CartItem`**

Reemplazar el contenido completo de `src/types/clients.ts`:

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

export interface PedidoHistorial {
  numeroPedido: string;
  fecha: string;
  total: number;
  ubicacion: string;
  notas: string;
  items: CartItem[];
}

export interface ClienteHistorial {
  ultimosProductos: ProductoHistorial[];
  preciosNegociados: Record<string, number>;
  pedidos: PedidoHistorial[];
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

- [ ] **Step 2: Verificar que compila**

```bash
npm run build
```

Resultado esperado: `built in Xms` sin errores TS. Si hay errores en `useClients.ts` por el nuevo tipo `ClienteHistorial`, es esperado — se arreglan en la siguiente tarea.

- [ ] **Step 3: Commit**

```bash
git add src/types/clients.ts
git commit -m "feat: add PedidoHistorial type and pedidos[] to ClienteHistorial"
```

---

## Task 2: Actualizar buildHistorial y confirmarSesion en useClients

**Files:**
- Modify: `src/hooks/useClients.ts:23-48` (función `buildHistorial`)
- Modify: `src/hooks/useClients.ts:142-163` (función `confirmarSesion`)
- Modify: `src/hooks/__tests__/useClients.test.ts`

- [ ] **Step 1: Escribir tests que fallan**

Añadir al final del describe `useClients — confirmarSesion` en `src/hooks/__tests__/useClients.test.ts`:

```ts
it('guarda pedido completo con items en el historial al confirmar', () => {
  const { result } = renderHook(() => useClients());
  act(() => { result.current.crearSesion('Ana Rios', 'San Isidro', false); });
  act(() => { result.current.agregar(PRODUCTO, 3, 12.5); });
  act(() => {
    result.current.confirmarSesion({ nombre: 'Ana Rios', ubicacion: 'San Isidro', notas: '' });
  });
  const raw = localStorage.getItem('pg_hist_ana_rios');
  const hist = JSON.parse(raw!);
  expect(hist.pedidos).toHaveLength(1);
  expect(hist.pedidos[0].items).toHaveLength(1);
  expect(hist.pedidos[0].items[0].nombre).toBe('Bolsa Negra 5kg');
  expect(hist.pedidos[0].items[0].cantidad).toBe(3);
  expect(hist.pedidos[0].total).toBe(37.5);
});

it('acumula pedidos en historial — mas reciente primero', () => {
  const { result } = renderHook(() => useClients());
  // Primer pedido
  act(() => { result.current.crearSesion('Ana Rios', 'San Isidro', false); });
  act(() => { result.current.agregar(PRODUCTO, 2); });
  act(() => {
    result.current.confirmarSesion({ nombre: 'Ana Rios', ubicacion: 'San Isidro', notas: '' });
  });
  // Segundo pedido
  act(() => { result.current.crearSesion('Ana Rios', 'San Isidro', false); });
  act(() => { result.current.agregar(PRODUCTO, 5); });
  act(() => {
    result.current.confirmarSesion({ nombre: 'Ana Rios', ubicacion: 'San Isidro', notas: '' });
  });
  const hist = JSON.parse(localStorage.getItem('pg_hist_ana_rios')!);
  expect(hist.pedidos).toHaveLength(2);
  // El mas reciente (5 items) va primero
  expect(hist.pedidos[0].items[0].cantidad).toBe(5);
  expect(hist.pedidos[1].items[0].cantidad).toBe(2);
});

it('limita pedidos a 30 entradas', () => {
  const { result } = renderHook(() => useClients());
  // Simular 31 pedidos guardados en localStorage previamente
  const pedidosPrevios = Array.from({ length: 30 }, (_, i) => ({
    numeroPedido: `PED-${i}`,
    fecha: '01/01/2026',
    total: 10,
    ubicacion: 'Lima',
    notas: '',
    items: [],
  }));
  localStorage.setItem('pg_hist_luis_torres', JSON.stringify({
    ultimosProductos: [],
    preciosNegociados: {},
    pedidos: pedidosPrevios,
  }));
  act(() => { result.current.crearSesion('Luis Torres', 'Lima', false); });
  act(() => { result.current.agregar(PRODUCTO, 1); });
  act(() => {
    result.current.confirmarSesion({ nombre: 'Luis Torres', ubicacion: 'Lima', notas: '' });
  });
  const hist = JSON.parse(localStorage.getItem('pg_hist_luis_torres')!);
  expect(hist.pedidos).toHaveLength(30);
  // El nuevo pedido (con items) es el primero
  expect(hist.pedidos[0].items).toHaveLength(1);
});
```

- [ ] **Step 2: Ejecutar para confirmar que fallan**

```bash
npm test -- src/hooks/__tests__/useClients.test.ts 2>&1 | tail -8
```

Resultado esperado: 3 tests nuevos FAIL.

- [ ] **Step 3: Actualizar `buildHistorial` en `useClients.ts`**

Añadir `PedidoHistorial` al import de tipos (línea 4):

```ts
import type { ClientSession, ClienteHistorial, ProductoHistorial, PedidoHistorial } from '../types/clients';
```

Reemplazar la función `buildHistorial` (líneas 31-49) y añadir el parámetro `summary`:

```ts
function buildHistorial(
  items: CartItem[],
  historialPrevio: ClienteHistorial,
  nuevoPedido: PedidoHistorial,
): ClienteHistorial {
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

  const pedidos = [nuevoPedido, ...(historialPrevio.pedidos ?? [])].slice(0, 30);

  return { ultimosProductos, preciosNegociados, pedidos };
}
```

- [ ] **Step 4: Actualizar `confirmarSesion` para pasar el pedido completo**

Reemplazar el bloque `try { localStorage.setItem(...) }` dentro de `confirmarSesion` (líneas 154-156):

```ts
try {
  const historialPrevio = cargarHistorial(sesion.nombre);
  const nuevoPedido: PedidoHistorial = {
    numeroPedido: summary.numeroPedido,
    fecha: summary.fecha,
    total: summary.total,
    ubicacion: summary.form.ubicacion,
    notas: summary.form.notas,
    items: [...sesion.items],
  };
  localStorage.setItem(
    histKey(sesion.nombre),
    JSON.stringify(buildHistorial(sesion.items, historialPrevio, nuevoPedido))
  );
} catch { /* quota */ }
```

- [ ] **Step 5: Actualizar `cargarHistorial` para manejar historiales sin `pedidos`**

Reemplazar la función `cargarHistorial` (líneas 23-29):

```ts
function cargarHistorial(nombre: string): ClienteHistorial {
  try {
    const raw = localStorage.getItem(histKey(nombre));
    if (raw) {
      const parsed = JSON.parse(raw) as ClienteHistorial;
      return { pedidos: [], ...parsed };
    }
  } catch { /* ignore */ }
  return { ultimosProductos: [], preciosNegociados: {}, pedidos: [] };
}
```

- [ ] **Step 6: Ejecutar tests**

```bash
npm test -- src/hooks/__tests__/useClients.test.ts 2>&1 | tail -8
```

Resultado esperado: todos los tests pasan (19 total).

- [ ] **Step 7: Commit**

```bash
git add src/types/clients.ts src/hooks/useClients.ts src/hooks/__tests__/useClients.test.ts
git commit -m "feat: save full pedidos array in ClienteHistorial on confirm"
```

---

## Task 3: Añadir crearSesionConItems a useClients

**Files:**
- Modify: `src/hooks/useClients.ts`
- Modify: `src/hooks/__tests__/useClients.test.ts`

- [ ] **Step 1: Escribir test que falla**

Añadir nuevo describe al final de `src/hooks/__tests__/useClients.test.ts`:

```ts
describe('useClients — crearSesionConItems', () => {
  it('crea una sesión con items pre-cargados', () => {
    const { result } = renderHook(() => useClients());
    const items = [{ ...PRODUCTO, cartKey: '123_0', cantidad: 4 }];
    act(() => { result.current.crearSesionConItems('Pedro Lima', 'Callao', items); });
    expect(result.current.sesionActiva?.nombre).toBe('Pedro Lima');
    expect(result.current.sesionActiva?.items).toHaveLength(1);
    expect(result.current.sesionActiva?.items[0].cantidad).toBe(4);
    expect(result.current.modalAbierto).toBe(false);
  });

  it('carga historial de precios del cliente al crear sesión con items', () => {
    localStorage.setItem('pg_hist_pedro_lima', JSON.stringify({
      ultimosProductos: [],
      preciosNegociados: { 'Bolsa Negra 5kg_paq': 9.00 },
      pedidos: [],
    }));
    const { result } = renderHook(() => useClients());
    const items = [{ ...PRODUCTO, cartKey: '123_0', cantidad: 2 }];
    act(() => { result.current.crearSesionConItems('Pedro Lima', 'Callao', items); });
    expect(result.current.sesionActiva?.preciosNegociados['Bolsa Negra 5kg_paq']).toBe(9.00);
  });
});
```

- [ ] **Step 2: Ejecutar para confirmar que fallan**

```bash
npm test -- src/hooks/__tests__/useClients.test.ts 2>&1 | tail -6
```

Resultado esperado: 2 tests FAIL — `crearSesionConItems is not a function`.

- [ ] **Step 3: Implementar `crearSesionConItems` en `useClients.ts`**

Añadir después de la función `crearSesion` (después de la línea `setModalAbierto(false);` del cierre de `crearSesion`):

```ts
function crearSesionConItems(nombre: string, ubicacion: string, items: CartItem[]) {
  const id = genId();
  const hist = cargarHistorial(nombre);
  const sesion: ClientSession = {
    id, nombre, ubicacion, esNuevo: false,
    items: items.map((i, idx) => ({ ...i, cartKey: `${i.id}_${idx}` })),
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
```

Añadir `crearSesionConItems` al objeto retornado por `useClients` (junto a `crearSesion`):

```ts
return {
  // ... todas las props existentes ...
  crearSesionConItems,
  // ...
};
```

- [ ] **Step 4: Ejecutar tests**

```bash
npm test -- src/hooks/__tests__/useClients.test.ts 2>&1 | tail -8
```

Resultado esperado: todos los tests pasan (21 total).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useClients.ts src/hooks/__tests__/useClients.test.ts
git commit -m "feat: add crearSesionConItems to useClients"
```

---

## Task 4: Hook useHistorial

**Files:**
- Create: `src/hooks/useHistorial.ts`
- Create: `src/hooks/__tests__/useHistorial.test.ts`

- [ ] **Step 1: Escribir tests que fallan**

Crear `src/hooks/__tests__/useHistorial.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getClientesConHistorial } from '../useHistorial';
import type { ClienteHistorial } from '../../types/clients';

beforeEach(() => localStorage.clear());

const HIST_JUAN: ClienteHistorial = {
  ultimosProductos: [],
  preciosNegociados: {},
  pedidos: [
    {
      numeroPedido: 'PED-AAA',
      fecha: '03/06/2026',
      total: 85.00,
      ubicacion: 'Lima Norte',
      notas: '',
      items: [{ id: 1, nombre: 'Bolsa', categoria: 'Bolsas', precio: 10, unidad: 'paq', cartKey: '1_0', cantidad: 5, preciosExtra: [{ unidad: 'paq', precio: 10 }] }],
    },
    {
      numeroPedido: 'PED-BBB',
      fecha: '01/06/2026',
      total: 42.50,
      ubicacion: 'Lima Norte',
      notas: '',
      items: [],
    },
  ],
};

const HIST_MARIA: ClienteHistorial = {
  ultimosProductos: [],
  preciosNegociados: {},
  pedidos: [
    {
      numeroPedido: 'PED-CCC',
      fecha: '02/06/2026',
      total: 30.00,
      ubicacion: 'Miraflores',
      notas: '',
      items: [],
    },
  ],
};

describe('getClientesConHistorial', () => {
  it('devuelve array vacío cuando no hay historial en localStorage', () => {
    expect(getClientesConHistorial()).toEqual([]);
  });

  it('lee clientes de claves pg_hist_* con pedidos', () => {
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    const result = getClientesConHistorial();
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('juan_garcia');
  });

  it('ignora claves sin pedidos o con pedidos vacíos', () => {
    localStorage.setItem('pg_hist_sin_pedidos', JSON.stringify({
      ultimosProductos: [],
      preciosNegociados: {},
      pedidos: [],
    }));
    expect(getClientesConHistorial()).toHaveLength(0);
  });

  it('calcula totalPedidos y totalAcumulado correctamente', () => {
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    const result = getClientesConHistorial();
    expect(result[0].totalPedidos).toBe(2);
    expect(result[0].totalAcumulado).toBe(127.50);
  });

  it('extrae ultimaFecha del primer pedido', () => {
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    const result = getClientesConHistorial();
    expect(result[0].ultimaFecha).toBe('03/06/2026');
  });

  it('extrae ubicacion del primer pedido', () => {
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    const result = getClientesConHistorial();
    expect(result[0].ubicacion).toBe('Lima Norte');
  });

  it('ordena clientes por ultimaFecha descendente', () => {
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    localStorage.setItem('pg_hist_maria_perez', JSON.stringify(HIST_MARIA));
    const result = getClientesConHistorial();
    expect(result[0].nombre).toBe('juan_garcia'); // 03/06 > 02/06
    expect(result[1].nombre).toBe('maria_perez');
  });

  it('ignora claves que no empiezan con pg_hist_', () => {
    localStorage.setItem('pg_sesiones', JSON.stringify([]));
    localStorage.setItem('pg_hist_juan_garcia', JSON.stringify(HIST_JUAN));
    expect(getClientesConHistorial()).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Ejecutar para confirmar que fallan**

```bash
npm test -- src/hooks/__tests__/useHistorial.test.ts 2>&1 | tail -6
```

Resultado esperado: `Cannot find module '../useHistorial'`.

- [ ] **Step 3: Implementar `useHistorial.ts`**

Crear `src/hooks/useHistorial.ts`:

```ts
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
  // Convierte "dd/mm/yyyy" → timestamp para ordenar
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
```

- [ ] **Step 4: Ejecutar tests**

```bash
npm test -- src/hooks/__tests__/useHistorial.test.ts 2>&1 | tail -8
```

Resultado esperado: 8 tests pasan.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useHistorial.ts src/hooks/__tests__/useHistorial.test.ts
git commit -m "feat: add useHistorial hook with getClientesConHistorial"
```

---

## Task 5: Componente HistorialView

**Files:**
- Create: `src/components/HistorialView.tsx`

- [ ] **Step 1: Crear `src/components/HistorialView.tsx`**

```tsx
import { useState, useMemo } from 'react';
import { useHistorial } from '../hooks/useHistorial';
import type { ClienteConHistorial } from '../hooks/useHistorial';
import type { PedidoHistorial } from '../types/clients';
import type { CartItem } from '../types/cart';
import { formatSoles } from '../utils/format';

interface Props {
  onCerrar: () => void;
  onAbrirPedido: (nombre: string, ubicacion: string, items: CartItem[]) => void;
}

type Nivel = 'clientes' | 'pedidos' | 'detalle';

function normBusqueda(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function formatNombreCliente(nombreClave: string): string {
  return nombreClave.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function HistorialView({ onCerrar, onAbrirPedido }: Props) {
  const clientes = useHistorial();
  const [nivel, setNivel] = useState<Nivel>('clientes');
  const [clienteActivo, setClienteActivo] = useState<ClienteConHistorial | null>(null);
  const [pedidoActivo, setPedidoActivo] = useState<PedidoHistorial | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const clientesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return clientes;
    const q = normBusqueda(busqueda);
    return clientes.filter(c => normBusqueda(c.nombre).includes(q));
  }, [clientes, busqueda]);

  function abrirCliente(c: ClienteConHistorial) {
    setClienteActivo(c);
    setNivel('pedidos');
  }

  function abrirPedido(p: PedidoHistorial) {
    setPedidoActivo(p);
    setNivel('detalle');
  }

  function volverAClientes() {
    setNivel('clientes');
    setClienteActivo(null);
    setPedidoActivo(null);
    setBusqueda('');
  }

  function volverAPedidos() {
    setNivel('pedidos');
    setPedidoActivo(null);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Nivel 1: Clientes ── */}
      {nivel === 'clientes' && (
        <>
          <div
            className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 text-white shadow"
            style={{ background: '#1a3a6b' }}
          >
            <button
              onClick={onCerrar}
              className="text-white/70 hover:text-white transition-colors font-bold text-lg leading-none"
            >
              ←
            </button>
            <h1 className="font-bold text-base">Historial de pedidos</h1>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-4">
            <input
              type="search"
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition mb-4"
            />

            {clientesFiltrados.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                {clientes.length === 0
                  ? 'Aun no hay pedidos registrados.'
                  : 'No se encontraron clientes.'}
              </div>
            ) : (
              <div className="space-y-2">
                {clientesFiltrados.map(c => (
                  <button
                    key={c.nombre}
                    onClick={() => abrirCliente(c)}
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between hover:border-blue-200 hover:bg-blue-50 transition text-left"
                  >
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        {formatNombreCliente(c.nombre)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.ubicacion} · {c.totalPedidos} {c.totalPedidos === 1 ? 'pedido' : 'pedidos'} · ultimo {c.ultimaFecha}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1a3a6b] bg-blue-50 px-2 py-1 rounded-lg">
                        {formatSoles(c.totalAcumulado)}
                      </span>
                      <span className="text-gray-400 text-sm">›</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Nivel 2: Pedidos del cliente ── */}
      {nivel === 'pedidos' && clienteActivo && (
        <>
          <div
            className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 text-white shadow"
            style={{ background: '#1a3a6b' }}
          >
            <button
              onClick={volverAClientes}
              className="text-white/70 hover:text-white transition-colors font-bold text-lg leading-none"
            >
              ←
            </button>
            <div>
              <h1 className="font-bold text-base leading-tight">
                {formatNombreCliente(clienteActivo.nombre)}
              </h1>
              <p className="text-white/60 text-xs">
                {clienteActivo.ubicacion} · {clienteActivo.totalPedidos} pedidos
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
            {clienteActivo.pedidos.map(p => (
              <button
                key={p.numeroPedido}
                onClick={() => abrirPedido(p)}
                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between hover:border-blue-200 hover:bg-blue-50 transition text-left"
              >
                <div>
                  <p className="font-semibold text-sm text-gray-800">{p.numeroPedido}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.fecha} · {p.items.length} {p.items.length === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-600">{formatSoles(p.total)}</span>
                  <span className="text-gray-400 text-sm">›</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Nivel 3: Detalle del pedido ── */}
      {nivel === 'detalle' && pedidoActivo && clienteActivo && (
        <>
          <div
            className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 text-white shadow"
            style={{ background: '#1a3a6b' }}
          >
            <button
              onClick={volverAPedidos}
              className="text-white/70 hover:text-white transition-colors font-bold text-lg leading-none"
            >
              ←
            </button>
            <div>
              <h1 className="font-bold text-base leading-tight">{pedidoActivo.numeroPedido}</h1>
              <p className="text-white/60 text-xs">{pedidoActivo.fecha} · {formatNombreCliente(clienteActivo.nombre)}</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wide">
                      <th className="text-center pb-2 pr-2 font-semibold w-6">#</th>
                      <th className="text-left pb-2 pr-2 font-semibold">Producto</th>
                      <th className="text-center pb-2 pr-2 font-semibold">Unidad</th>
                      <th className="text-center pb-2 pr-2 font-semibold">Cant.</th>
                      <th className="text-right pb-2 pr-2 font-semibold">P. Unit.</th>
                      <th className="text-right pb-2 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidoActivo.items.map((item, idx) => (
                      <tr key={item.cartKey} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 pr-2 text-center text-gray-400">{idx + 1}</td>
                        <td className="py-2 pr-2 text-gray-800 font-medium leading-tight">
                          {item.nombre}
                          {item.nota && (
                            <span className="block text-[10px] text-amber-600 font-normal">{item.nota}</span>
                          )}
                        </td>
                        <td className="py-2 pr-2 text-center text-gray-500">{item.unidad}</td>
                        <td className="py-2 pr-2 text-center text-gray-700 font-semibold">{item.cantidad}</td>
                        <td className="py-2 pr-2 text-right text-gray-500">{formatSoles(item.precio)}</td>
                        <td className="py-2 text-right font-bold text-gray-800">{formatSoles(item.precio * item.cantidad)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-2">
                <span className="font-bold text-sm text-gray-700">Total</span>
                <span className="text-xl font-extrabold text-red-600">{formatSoles(pedidoActivo.total)}</span>
              </div>
            </div>

            {pedidoActivo.notas.trim() && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
                <span className="font-semibold">Notas: </span>{pedidoActivo.notas}
              </div>
            )}

            <button
              onClick={() => onAbrirPedido(
                formatNombreCliente(clienteActivo.nombre),
                pedidoActivo.ubicacion,
                pedidoActivo.items,
              )}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
              style={{ background: '#1a3a6b' }}
            >
              Abrir y editar pedido
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar que compila**

```bash
npm run build 2>&1 | grep -E "error TS|built in"
```

Resultado esperado: `built in Xms` sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/HistorialView.tsx
git commit -m "feat: add HistorialView component with three-level navigation"
```

---

## Task 6: Integrar en App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Añadir import de `HistorialView` y `crearSesionConItems`**

Al inicio de `src/App.tsx`, añadir el import:

```ts
import { HistorialView } from './components/HistorialView';
```

- [ ] **Step 2: Añadir estado `historialAbierto` y destructurar `crearSesionConItems`**

En la sección donde se desestructura `useClients`, añadir `crearSesionConItems`:

```ts
const {
  sesiones, activoId, sesionActiva, modalAbierto, setModalAbierto,
  cart, crearSesion, cerrarSesion, setActivo, confirmarSesion,
  setVista, getPrecioNegociado,
  agregar, sumarUno, quitarUno, cambiarCantidad, cambiarPrecio,
  cambiarNota, eliminar, vaciar, agregarManual,
  crearSesionConItems,   // NUEVO
} = useClients();
```

Añadir el estado justo después de `ultimoPedido`:

```ts
const [historialAbierto, setHistorialAbierto] = useState(false);
```

- [ ] **Step 3: Añadir prop `onHistorial` a `AppHeader`**

`AppHeader` es un componente con sus propias props — `setHistorialAbierto` no está en su scope. Añadir la prop en la interfaz inline de `AppHeader` (buscar `onRecargar: () => void;`):

```ts
// Añadir al bloque de props de AppHeader:
onHistorial: () => void;
```

Añadir también en la desestructuración de props de `AppHeader`:

```ts
function AppHeader({
  busqueda, setBusqueda, totalUnidades, cartBumpKey,
  onCarritoClick, onRecargar, onHistorial,  // añadir onHistorial
}: { ... onHistorial: () => void; }) {
```

En el dropdown del menú (`{menuAbierto && ...}`), añadir como primera opción antes del bloque `{puedeInstalar && ...}`:

```tsx
<button
  onClick={() => { onHistorial(); setMenuAbierto(false); }}
  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
>
  <span>◷</span> Historial de pedidos
</button>
<div className="border-t border-gray-100 my-1" />
```

- [ ] **Step 3b: Pasar `onHistorial` desde App a todos los usos de `AppHeader`**

Hay tres lugares en `App.tsx` donde se renderiza `AppHeader`. Añadir `onHistorial={() => setHistorialAbierto(true)}` a los tres:

```tsx
// En la vista de confirmado:
<AppHeader ... onHistorial={() => setHistorialAbierto(true)} />

// En la vista de revisión:
<AppHeader ... onHistorial={() => setHistorialAbierto(true)} />

// En la vista del catálogo:
<AppHeader ... onHistorial={() => setHistorialAbierto(true)} />
```

- [ ] **Step 4: Añadir la vista condicional de historial**

Añadir el bloque de la vista de historial justo antes del bloque `// ── Vista: confirmado`:

```tsx
// ── Vista: historial ────────────────────────────────
if (historialAbierto) {
  return (
    <>
      <AppHeader
        busqueda=""
        setBusqueda={() => {}}
        totalUnidades={0}
        cartBumpKey={0}
        onCarritoClick={() => {}}
        onRecargar={() => window.location.reload()}
      />
      <TabBar
        sesiones={sesiones}
        activoId={activoId}
        onSeleccionar={setActivo}
        onCerrar={handleCerrarPestana}
        onNuevo={() => setModalAbierto(true)}
      />
      <HistorialView
        onCerrar={() => setHistorialAbierto(false)}
        onAbrirPedido={(nombre, ubicacion, items) => {
          crearSesionConItems(nombre, ubicacion, items);
          setVista('revision');
          setHistorialAbierto(false);
        }}
      />
      {clientModal}
    </>
  );
}
```

- [ ] **Step 5: Verificar que compila**

```bash
npm run build 2>&1 | grep -E "error TS|built in"
```

Resultado esperado: `built in Xms` sin errores.

- [ ] **Step 6: Ejecutar todos los tests**

```bash
npm test 2>&1 | tail -10
```

Resultado esperado:

```
Test Files  4 passed (4)
Tests       29 passed (29)
```

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate HistorialView into App with gear menu access"
```

---

## Task 7: Push final

- [ ] **Step 1: Push a origin**

```bash
git push
```

- [ ] **Step 2: Verificacion manual**

1. Abrir la app en `http://localhost:5173`
2. Confirmar un pedido de prueba para un cliente
3. Abrir menu ⚙ → "Historial de pedidos"
4. Verificar que aparece el cliente con el pedido
5. Hacer clic en el pedido → ver detalle con tabla
6. Hacer clic en "Abrir y editar pedido" → verifica que se abre la revision con los items cargados
