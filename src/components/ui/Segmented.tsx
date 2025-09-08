export default function Segmented({
  options, 
  value, 
  onChange
}: { 
  options: string[]; 
  value: string; 
  onChange: (v: string) => void; 
}) {
  return (
    <div className="inline-flex rounded-lg border bg-white p-1">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            value === opt 
              ? 'bg-gray-100 font-medium text-gray-900' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          type="button"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}



