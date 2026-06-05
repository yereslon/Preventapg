# Diseño: Historial Completo de Pedidos por Cliente

**Fecha:** 2026-06-04
**Proyecto:** PreventaPG — Plásticos Guerrero
**Estado:** Aprobado

---

## Contexto

Actualmente `ClienteHistorial` guarda los últimos 10 productos y precios negociados, pero no los pedidos completos. Esta feature añade un historial de los últimos 30 pedidos por cliente, consultable desde el menú de ajustes, con posibilidad de abrir cualquier pedido pasado en la vista de revisión para editarlo y confirmar.

---

## Reglas de repositorio

- Sin `Co-Authored-By:` en ningún commit
- Sin `.claude/`, `.superpowers/`, `~$*.xlsx` en ningún commit

---

## Sección 1 — Tipos de datos

### `PedidoHistorial` (nuevo)

```ts
interface PedidoHistorial {
  numeroPedido: string
  fecha: string
  total: number
  ubicacion: string
  notas: string
  items: CartItem[]
}
```

### `ClienteHistorial` (modificado)

```ts
interface ClienteHistorial {
  ultimosProductos: ProductoHistorial[]
  preciosNegociados: Record<string, number>
  pedidos: PedidoHistorial[]   // NUEVO — máximo 30, ordenados de más reciente a más antiguo
}
```

---

## Sección 2 — Persistencia

### Clave localStorage

Sin cambios: `pg_hist_${normalizarNombreHist(nombre)}`

### `buildHistorial` (modificado en `useClients.ts`)

Al confirmar un pedido, además de `ultimosProductos` y `preciosNegociados`, se añade el pedido completo al array `pedidos`:

```ts
// Leer historial existente del cliente
const historialPrevio = cargarHistorial(sesion.nombre);

// Construir nuevo registro
const nuevoPedido: PedidoHistorial = {
  numeroPedido: summary.numeroPedido,
  fecha: summary.fecha,
  total: summary.total,
  ubicacion: summary.form.ubicacion,
  notas: summary.form.notas,
  items: [...sesion.items],
};

// Prepend + recortar a 30
const pedidos = [nuevoPedido, ...(historialPrevio.pedidos ?? [])].slice(0, 30);
```

---

## Sección 3 — Hook `useHistorial`

**Archivo:** `src/hooks/useHistorial.ts`

Lee todos los `pg_hist_*` de `localStorage` y construye la lista de clientes con historial.

```ts
interface ClienteConHistorial {
  nombre: string
  ubicacion: string
  totalPedidos: number
  totalAcumulado: number
  ultimaFecha: string
  pedidos: PedidoHistorial[]
}
```

- Ordenados por `ultimaFecha` descendente
- Solo incluye clientes que tengan al menos 1 pedido en `pedidos[]`
- Se recalcula cada vez que se llama (no necesita estado reactivo — el historial se lee al abrir la vista)

---

## Sección 4 — Componente `HistorialView`

**Archivo:** `src/components/HistorialView.tsx`

Vista completa de tres niveles. Estado interno:

```ts
type Nivel = 'clientes' | 'pedidos' | 'detalle'
const [nivel, setNivel] = useState<Nivel>('clientes')
const [clienteActivo, setClienteActivo] = useState<ClienteConHistorial | null>(null)
const [pedidoActivo, setPedidoActivo] = useState<PedidoHistorial | null>(null)
```

### Nivel 1 — Lista de clientes

- Header con título "Historial de pedidos" y `←` que llama `onCerrar`
- Input de búsqueda (filtra por nombre en tiempo real, misma normalización que `busqueda.ts`)
- Por cada cliente: nombre, zona, `X pedidos`, total acumulado, `›`
- Si no hay historial: mensaje "Aun no hay pedidos registrados"

### Nivel 2 — Pedidos del cliente

- Header con nombre del cliente, zona, `←` vuelve a nivel 1
- Por cada pedido: número de pedido, fecha, cantidad de items, total en rojo, `›`
- Pedidos ordenados de más reciente a más antiguo

### Nivel 3 — Detalle del pedido

- Header con número de pedido y fecha, `←` vuelve a nivel 2
- Tabla: `#` · `Producto` · `Unidad` · `Cant.` · `P.Unit.` · `Total`
  - Mismo estilo visual que el resumen de `CartReview`
  - Si el item tiene nota, se muestra debajo del nombre en color ámbar
- Total al pie
- Botón **"Abrir y editar pedido"**:
  1. Llama `onAbrirPedido(clienteActivo.nombre, clienteActivo.ubicacion, pedidoActivo.items)`
  2. Cierra la vista de historial

### Props de `HistorialView`

```ts
interface Props {
  onCerrar: () => void
  onAbrirPedido: (nombre: string, ubicacion: string, items: CartItem[]) => void
}
```

### Función `crearSesionConItems` en `useClients`

Nueva función que crea la sesión y pre-carga los items en un solo batch de estado, evitando el problema de closures al llamar `agregar` después de `crearSesion`:

```ts
function crearSesionConItems(nombre: string, ubicacion: string, items: CartItem[]) {
  const id = genId()
  const hist = cargarHistorial(nombre)
  const sesion: ClientSession = {
    id, nombre, ubicacion, esNuevo: false,
    items: items.map(i => ({ ...i, cartKey: `${i.id}_0` })),
    vista: 'catalogo',
    orderForm: { nombre, ubicacion, notas: '' },
    preciosNegociados: hist.preciosNegociados,
    ultimosProductos: hist.ultimosProductos,
  }
  const next = [...sesiones, sesion]
  setSesiones(next)
  setActivoId(id)
  setModalAbierto(false)
}
```

---

## Sección 5 — Integración en `App.tsx`

### Estado nuevo

```ts
const [historialAbierto, setHistorialAbierto] = useState(false)
```

### Vista de historial

```tsx
if (historialAbierto) {
  return (
    <>
      <AppHeader ... />
      <TabBar ... />
      <HistorialView
        onCerrar={() => setHistorialAbierto(false)}
        onAbrirPedido={(nombre, ubicacion, items) => {
          // crearSesionConItems crea la sesión y pre-carga los items
          // en un solo setState para evitar problemas de closures
          crearSesionConItems(nombre, ubicacion, items)
          setVista('revision')
          setHistorialAbierto(false)
        }}
      />
    </>
  )
}
```

### Menú `⚙` — nueva opción

```tsx
// Primera opción del dropdown, antes de Exportar datos
<button onClick={() => { setHistorialAbierto(true); setMenuAbierto(false); }}>
  Historial de pedidos
</button>
<div className="border-t border-gray-100 my-1" />
```

---

## Sección 6 — Modificaciones a archivos existentes

| Archivo | Cambio |
|---|---|
| `src/types/clients.ts` | Añadir `PedidoHistorial`, añadir `pedidos` a `ClienteHistorial` |
| `src/hooks/useClients.ts` | Modificar `buildHistorial` para incluir pedidos completos |
| `src/hooks/useHistorial.ts` | Crear — lector de historial desde localStorage |
| `src/components/HistorialView.tsx` | Crear — vista de tres niveles |
| `src/App.tsx` | Añadir estado `historialAbierto`, opción en menú, vista condicional |

---

## Lo que NO cambia

- `useClientRegistry`, `TabBar`, `ClientModal`, `UltimosProductos` — sin modificaciones
- La clave `pg_hist_*` y su formato de lectura/escritura — compatible hacia atrás
- El flujo normal de pedidos — ningún cambio en `CartReview`, `ConfirmView`, `OrderPDF`
