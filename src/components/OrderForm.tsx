import type { OrderFormData } from '../types/catalog';

interface Props {
  form: OrderFormData;
  ubicaciones: string[];
  onChange: (form: OrderFormData) => void;
  errors: Partial<Record<keyof OrderFormData, string>>;
  readOnlyDatos?: boolean;
}

export function OrderForm({ form, ubicaciones, onChange, errors, readOnlyDatos = false }: Props) {
  function set(field: keyof OrderFormData, value: string) {
    onChange({ ...form, [field]: value });
  }

  return (
    <div className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nombre del cliente <span className="text-red-500">*</span>
        </label>
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
        {errors.nombre && (
          <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>
        )}
      </div>

      {/* Ubicación */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Ubicación / Zona de entrega <span className="text-red-500">*</span>
        </label>
        {ubicaciones.length > 0 && !readOnlyDatos ? (
          <select
            value={form.ubicacion}
            onChange={e => set('ubicacion', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition bg-white appearance-none cursor-pointer
              ${errors.ubicacion
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              }`}
          >
            <option value="">— Selecciona una ubicación —</option>
            {ubicaciones.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
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
        {errors.ubicacion && (
          <p className="text-xs text-red-600 mt-1">{errors.ubicacion}</p>
        )}
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Notas adicionales
          <span className="text-gray-400 font-normal ml-1">(opcional)</span>
        </label>
        <textarea
          value={form.notas}
          onChange={e => set('notas', e.target.value)}
          rows={3}
          placeholder="Instrucciones de entrega, referencias, etc."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
        />
      </div>
    </div>
  );
}
