import { useState, useEffect } from 'react';

interface Props {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange: (v: number) => void;
  /** 'sm' = compacto para CartPanel | 'md' = normal para CartReview */
  size?: 'sm' | 'md';
}

function fmt(v: number): string {
  // Elimina ceros decimales innecesarios: 1.50 → "1.5", 2.000 → "2"
  return parseFloat(v.toFixed(3)).toString();
}

export function QuantityInput({ value, onIncrement, onDecrement, onChange, size = 'md' }: Props) {
  const [raw, setRaw] = useState(fmt(value));
  const [focused, setFocused] = useState(false);

  // Sincroniza cuando el valor externo cambia (ej. botones +/-)
  useEffect(() => {
    if (!focused) setRaw(fmt(value));
  }, [value, focused]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    // Solo permite dígitos y un punto decimal
    const limpio = text.replace(/[^0-9.]/g, '').replace(/^(\d*\.?\d*).*$/, '$1');
    setRaw(limpio);
    const num = parseFloat(limpio);
    if (!isNaN(num) && num > 0) onChange(num);
  }

  function handleBlur() {
    setFocused(false);
    const num = parseFloat(raw);
    if (isNaN(num) || num <= 0) {
      setRaw(fmt(value)); // revierte si inválido
    } else {
      setRaw(fmt(num));
      onChange(num);
    }
  }

  const btn = size === 'sm'
    ? 'w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold text-sm transition-colors select-none'
    : 'w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold transition-colors select-none';

  const inp = size === 'sm'
    ? 'w-12 text-center text-xs font-bold text-gray-800 bg-transparent border-0 outline-none py-0'
    : 'w-14 text-center text-sm font-bold text-gray-800 bg-transparent border-0 outline-none';

  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button type="button" onClick={onDecrement} className={btn}>−</button>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min="0.01"
        value={raw}
        onChange={handleChange}
        onFocus={e => { setFocused(true); e.target.select(); }}
        onBlur={handleBlur}
        className={inp}
      />
      <button type="button" onClick={onIncrement} className={btn}>+</button>
    </div>
  );
}
