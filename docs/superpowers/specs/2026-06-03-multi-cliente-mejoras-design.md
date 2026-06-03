# Diseño: Multi-cliente + Historial por cliente + Mejoras

**Fecha:** 2026-06-03  
**Proyecto:** PreventaPG — Plásticos Guerrero  
**Estado:** Aprobado

---

## Contexto

PreventaPG es una app de gestión de pedidos para vendedores de Plásticos Guerrero. El vendedor atiende varios clientes en simultáneo — necesita pestañas independientes por cliente, con precios negociados e historial de productos persistentes por cliente.

---

## Reglas de repositorio

- **Jamás subir al repo:** `.claude/`, `.superpowers/`, `~$*.xlsx`
- **Commits sin** footer `Co-Authored-By: Claude` en ningún commit

---

## Sección 1 — Arquitectura

### Hook `useClients`

Reemplaza el uso directo de `useCart` en `App.tsx`. Gestiona un array de sesiones de cliente.

```ts
interface ClientSession {
  id: string            // uuid generado al crear la pestaña
  nombre: string
  ubicacion: string
  items: CartItem[]
  vista: 'catalogo' | 'revision' | 'confirmado'
  orderForm: OrderFormData
}
```

- Persistencia activa: `localStorage` key `pg_sesiones`
- `App.tsx` extrae el cliente activo y pasa sus datos a los componentes existentes como props — cambios mínimos a componentes actuales

### Hook `useClientRegistry`

Lee `public/clientes.xlsx` — columnas `Cliente` y `Ubicacion`. Devuelve `ClienteRegistrado[]`. Se carga una vez al arrancar, independiente de `useExcelData`.

```ts
interface ClienteRegistrado {
  nombre: string
  ubicacion: string
}
```

### Persistencia de historial por cliente

- Key: `pg_hist_{clienteId}` en `localStorage`
- Se escribe al confirmar cada pedido
- Contiene: lista de productos (con precio final negociado) de los últimos pedidos
- Estructura:
```ts
interface ClienteHistorial {
  ultimosProductos: { productoNombre: string; precio: number; unidad: string }[]
  preciosNegociados: Record<string, number> // cartKey → precio
}
```

---

## Sección 2 — Features nuevas

### 1. `TabBar` (nuevo componente)

Barra entre el header y la búsqueda. Cada pestaña muestra:
- Nombre del cliente
- Total del carrito en badge
- Botón `×` para cerrar (solo si hay más de una pestaña, con confirmación si tiene items)

Pestaña activa: fondo blanco, texto azul oscuro.  
Pestañas inactivas: fondo `#243f5e`, texto apagado.  
Botón `＋ Nuevo`: abre `ClientModal`.  
Scroll horizontal si hay 3+ pestañas en pantalla pequeña.

### 2. `ClientModal` (nuevo componente)

Modal con toggle **Cliente registrado / Nuevo cliente**.

**Modo "Cliente registrado":**
- Input de búsqueda filtra `ClienteRegistrado[]` en tiempo real (mismo algoritmo que `buscarProductos`)
- Lista con nombre + ubicación por cada resultado
- Si el cliente ya tiene una pestaña abierta → activa esa pestaña en lugar de crear una duplicada (no se permiten dos pestañas del mismo cliente registrado)
- Al seleccionar → crea sesión con datos pre-llenados + carga historial de precios

**Modo "Nuevo cliente":**
- Dos campos: Nombre (requerido), Ubicación (texto libre, requerido)
- Al confirmar → crea sesión sin historial previo

### 3. Sección `UltimosProductos` (nuevo componente)

Aparece encima del grid del catálogo solo cuando el cliente activo tiene historial. Muestra máximo 10 productos del último pedido confirmado, ordenados por frecuencia de aparición en pedidos anteriores.  
Fondo amarillo claro (`#fffbeb`), borde inferior dorado.  
Scroll horizontal. Por cada producto:
- Nombre
- Precio negociado (con precio de catálogo tachado si difiere)
- Botón `+ Agregar` (agrega directamente al carrito con el precio negociado)

### 4. Precios pre-cargados por cliente

Al crear sesión para un cliente con historial:
- `useClients` carga `pg_hist_{clienteId}`
- Pre-carga mapa `productoNombre → precioNegociado`
- Cuando el vendedor agrega un producto, si existe precio negociado para ese producto, se aplica como valor inicial del campo precio en el carrito
- En el grid del catálogo, productos con precio negociado muestran el precio negociado + precio original tachado

### 5. Cierre automático de pestaña al confirmar pedido

Al llegar a la vista `confirmado` y hacer clic en "Enviar" o "Hacer otro pedido":
- Se guarda el historial del pedido en `pg_hist_{clienteId}`
- La sesión se elimina del array
- Si quedan otras pestañas, se activa la primera; si no quedan, se abre `ClientModal` automáticamente

---

## Sección 3 — Mejoras e inconsistencias

### Inconsistencias a corregir

**1. `~$clientes.xlsx` en `public/`**  
Archivo de bloqueo de Excel. Se añade `~$*.xlsx` a `.gitignore` para que nunca llegue a `dist/`.

**2. `id` basado en índice del array (`useExcelData.ts:32`)**  
`id: index + 1` es frágil si se filtra antes de normalizar. Se reemplaza por hash estable: `djb2(nombre + categoria)` como número. Garantiza que el mismo producto siempre tenga el mismo id sin depender del orden del array.

**3. Campo ubicación en `OrderForm` pasa a solo-lectura**  
Con el nuevo flujo, la ubicación viene del cliente seleccionado. El campo queda visible pero no editable — el vendedor ve de dónde es el cliente sin poder introducir errores accidentalmente. Si necesita corregirlo, puede hacerlo desde ahí igualmente (toggle editable con un ícono de lápiz).

**4. Migración de `pg_carrito` → `pg_sesiones`**  
Al arrancar, si `useClients` detecta `pg_carrito` en `localStorage`, migra su contenido como sesión "Cliente sin asignar" y elimina la clave antigua. Migración one-time, sin pérdida de datos.

### Mejoras puntuales

**5. `.gitignore`**  
Añadir: `.claude/`, `.superpowers/`, `~$*.xlsx`

**6. `README.md`**  
Reemplazar el template genérico de Vite con documentación real:
- Qué es la app y para qué sirve
- Cómo actualizar `catalogo.xlsx` y `clientes.xlsx`
- Cómo correr en desarrollo (`npm run dev`)
- Cómo hacer deploy a GitHub Pages

**7. Tab bar con scroll horizontal en móvil**  
Si hay 3+ pestañas, `overflow-x: auto` en la barra. Nombres de cliente truncados con ellipsis a max 12 caracteres para no deformar el layout.

---

## Archivos afectados

| Archivo | Acción |
|---|---|
| `src/hooks/useClients.ts` | Crear |
| `src/hooks/useClientRegistry.ts` | Crear |
| `src/hooks/useCart.ts` | Deprecar — la lógica del carrito se reimplementa dentro de `useClients`; `useCart` queda sin uso y se elimina |
| `src/hooks/useExcelData.ts` | Modificar — hash estable para `id` |
| `src/components/TabBar.tsx` | Crear |
| `src/components/ClientModal.tsx` | Crear |
| `src/components/UltimosProductos.tsx` | Crear |
| `src/components/OrderForm.tsx` | Modificar — ubicación solo-lectura con toggle editable |
| `src/components/ConfirmView.tsx` | Modificar — cierre de sesión al confirmar |
| `src/App.tsx` | Modificar — consume useClients en lugar de useCart directamente |
| `src/types/catalog.ts` | Modificar — añadir `ClienteRegistrado`, `ClienteHistorial` |
| `src/types/cart.ts` | Modificar — añadir `ClientSession` |
| `.gitignore` | Modificar — añadir `.claude/`, `.superpowers/`, `~$*.xlsx` |
| `README.md` | Reemplazar |
| `public/clientes.xlsx` | Existente — se usa tal cual |

---

## Lo que NO cambia

- `ProductCard`, `CartPanel`, `CartReview`, `OrderPDF`, `CategoryFilter`, `QuantityInput` — sin modificaciones o cambios mínimos de props
- `useExcelData` — solo se toca la generación de `id`
- `busqueda.ts`, `format.ts`, `whatsapp.ts` — sin cambios
- Flujo completo de pedido (catálogo → revisión → confirmado) — idéntico por cliente
