import { useState } from 'react';
import { useExcelData } from './hooks/useExcelData';
import { useClients } from './hooks/useClients';
import { useClientRegistry } from './hooks/useClientRegistry';
import { AppHeader } from './components/AppHeader';
import { TabBar } from './components/TabBar';
import { ClientModal } from './components/ClientModal';
import { HistorialView } from './components/HistorialView';
import { LiquidacionView } from './components/LiquidacionView';
import { CatalogoView } from './components/CatalogoView';
import { RevisionView } from './components/RevisionView';
import { ConfirmadoView } from './components/ConfirmadoView';
import type { CatalogItem } from './types/catalog';
import type { OrderSummary } from './types/order';

export default function App() {
  const { data, ubicaciones, whatsapp, loading, error } = useExcelData();
  const { clientes } = useClientRegistry();
  const {
    sesiones, activoId, sesionActiva, modalAbierto, setModalAbierto,
    cart, crearSesion, crearSesionConItems, cerrarSesion, setActivo, confirmarSesion,
    setVista, getPrecioNegociado,
    agregar, sumarUno, quitarUno, cambiarCantidad, cambiarPrecio,
    cambiarNota, eliminar, vaciar, agregarManual,
  } = useClients();

  const [busqueda, setBusqueda] = useState('');
  const [cartBumpKey, setCartBumpKey] = useState(0);
  const [ultimoPedido, setUltimoPedido] = useState<OrderSummary | null>(null);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [liquidacionAbierta, setLiquidacionAbierta] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  const vista = sesionActiva?.vista ?? 'catalogo';
  const enCatalogo = !historialAbierto && !liquidacionAbierta && !ultimoPedido && vista !== 'revision';

  function handleAgregar(
    item: CatalogItem,
    cantidad: number,
    precioOverride?: number,
    unidadOverride?: string,
    opcionIdx?: number,
    nota?: string,
  ) {
    agregar(item, cantidad, precioOverride, unidadOverride, opcionIdx, nota);
    setCartBumpKey(k => k + 1);
  }

  async function handleConfirmar(form: Parameters<typeof confirmarSesion>[0]) {
    const summary = await confirmarSesion(form);
    setUltimoPedido(summary);
  }

  function handleCerrarPestana(id: string) {
    const sesion = sesiones.find(s => s.id === id);
    if (sesion && sesion.items.length > 0) {
      if (!confirm(`¿Cerrar la pestaña de ${sesion.nombre}? Se perderá el pedido en curso.`)) return;
    }
    cerrarSesion(id);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <AppHeader
        busqueda={enCatalogo ? busqueda : ''}
        setBusqueda={enCatalogo ? setBusqueda : () => {}}
        totalUnidades={enCatalogo ? cart.items.length : 0}
        cartBumpKey={enCatalogo ? cartBumpKey : 0}
        onCarritoClick={enCatalogo ? () => setCarritoAbierto(o => !o) : () => {}}
        onRecargar={() => window.location.reload()}
        onHistorial={() => setHistorialAbierto(true)}
        onLiquidacion={() => setLiquidacionAbierta(true)}
      />
      <TabBar
        sesiones={sesiones}
        activoId={activoId}
        onSeleccionar={setActivo}
        onCerrar={handleCerrarPestana}
        onNuevo={() => setModalAbierto(true)}
        onHistorial={() => setHistorialAbierto(true)}
      />

      {liquidacionAbierta && (
        <LiquidacionView onCerrar={() => setLiquidacionAbierta(false)} />
      )}

      {!liquidacionAbierta && historialAbierto && (
        <HistorialView
          onCerrar={() => setHistorialAbierto(false)}
          onAbrirPedido={(nombre, ubicacion, items) => {
            crearSesionConItems(nombre, ubicacion, items);
            setVista('revision');
            setHistorialAbierto(false);
          }}
        />
      )}

      {!liquidacionAbierta && !historialAbierto && ultimoPedido && (
        <ConfirmadoView
          summary={ultimoPedido}
          whatsapp={whatsapp}
          onCerrar={() => {
            setUltimoPedido(null);
            setModalAbierto(true);
          }}
        />
      )}

      {!liquidacionAbierta && !historialAbierto && !ultimoPedido && vista === 'revision' && (
        <RevisionView
          cart={cart}
          ubicaciones={ubicaciones}
          formInicial={sesionActiva?.orderForm}
          onSumarUno={sumarUno}
          onQuitarUno={quitarUno}
          onCambiarCantidad={cambiarCantidad}
          onEliminar={eliminar}
          onCambiarPrecio={cambiarPrecio}
          onCambiarNota={cambiarNota}
          onAgregarManual={agregarManual}
          onVolver={() => setVista('catalogo')}
          onConfirmar={handleConfirmar}
        />
      )}

      {enCatalogo && (
        <CatalogoView
          sesionActiva={sesionActiva}
          data={data}
          loading={loading}
          error={error}
          busqueda={busqueda}
          cart={cart}
          carritoAbierto={carritoAbierto}
          onCerrarCarrito={() => setCarritoAbierto(false)}
          onLimpiarBusqueda={() => setBusqueda('')}
          getPrecioNegociado={getPrecioNegociado}
          onAgregar={handleAgregar}
          onSumarUno={sumarUno}
          onQuitarUno={quitarUno}
          onCambiarCantidad={cambiarCantidad}
          onEliminar={eliminar}
          onVaciar={vaciar}
          onVerPedido={() => setVista('revision')}
          onNuevoCliente={() => setModalAbierto(true)}
        />
      )}

      <ClientModal
        open={modalAbierto}
        clientes={clientes}
        sesionesActivas={sesiones}
        onConfirmar={crearSesion}
        onCancelar={() => setModalAbierto(false)}
        puedeCancelar={true}
      />
    </div>
  );
}
