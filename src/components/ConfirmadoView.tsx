import { lazy, Suspense } from 'react';
import type { OrderSummary } from '../types/order';

const ConfirmView = lazy(() =>
  import('./ConfirmView').then(m => ({ default: m.ConfirmView }))
);

interface Props {
  summary: OrderSummary;
  whatsapp: string;
  onCerrar: () => void;
}

export function ConfirmadoView({ summary, whatsapp, onCerrar }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm">Preparando confirmación...</span>
        </div>
      }
    >
      <ConfirmView
        summary={summary}
        whatsapp={whatsapp}
        onCerrar={onCerrar}
      />
    </Suspense>
  );
}
