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

Hoja adicional `Configuracion` (opcional):

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
