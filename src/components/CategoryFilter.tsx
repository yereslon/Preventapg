interface Props {
  categorias: string[];
  activa: string;
  onChange: (cat: string) => void;
}

export function CategoryFilter({ categorias, activa, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {categorias.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
            activa === cat
              ? 'bg-[#1a3a6b] border-[#1a3a6b] text-white shadow-sm'
              : 'bg-white border-gray-200 text-gray-600 hover:border-[#2554a0] hover:text-[#2554a0]'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
