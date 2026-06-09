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
            className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 text-white shadow bg-[#1a3a6b]"
          >
            <button
              onClick={onCerrar}
              aria-label="Cerrar historial"
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
                    <div className="flex items-center gap-2 flex-shrink-0">
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
            className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 text-white shadow bg-[#1a3a6b]"
          >
            <button
              onClick={volverAClientes}
              aria-label="Volver a la lista de clientes"
              className="text-white/70 hover:text-white transition-colors font-bold text-lg leading-none"
            >
              ←
            </button>
            <div>
              <h1 className="font-bold text-base leading-tight">
                {formatNombreCliente(clienteActivo.nombre)}
              </h1>
              <p className="text-white/60 text-xs">
                {clienteActivo.ubicacion} · {clienteActivo.totalPedidos} {clienteActivo.totalPedidos === 1 ? 'pedido' : 'pedidos'}
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
                <div className="flex items-center gap-2 flex-shrink-0">
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
            className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 text-white shadow bg-[#1a3a6b]"
          >
            <button
              onClick={volverAPedidos}
              aria-label={`Volver a los pedidos de ${formatNombreCliente(clienteActivo.nombre)}`}
              className="text-white/70 hover:text-white transition-colors font-bold text-lg leading-none"
            >
              ←
            </button>
            <div>
              <h1 className="font-bold text-base leading-tight">{pedidoActivo.numeroPedido}</h1>
              <p className="text-white/60 text-xs">
                {pedidoActivo.fecha} · {formatNombreCliente(clienteActivo.nombre)}
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <div className="overflow-x-auto -mx-1">
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
                            <span className="block text-[10px] text-amber-600 font-normal">
                              {item.nota}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-2 text-center text-gray-500">{item.unidad}</td>
                        <td className="py-2 pr-2 text-center text-gray-700 font-semibold">
                          {item.cantidad}
                        </td>
                        <td className="py-2 pr-2 text-right text-gray-500">
                          {formatSoles(item.precio)}
                        </td>
                        <td className="py-2 text-right font-bold text-gray-800">
                          {formatSoles(item.precio * item.cantidad)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-2">
                <span className="font-bold text-sm text-gray-700">Total</span>
                <span className="text-xl font-extrabold text-red-600">
                  {formatSoles(pedidoActivo.total)}
                </span>
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
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors bg-[#1a3a6b] hover:bg-[#2554a0]"
            >
              Abrir y editar pedido
            </button>
          </div>
        </>
      )}
    </div>
  );
}
