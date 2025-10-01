'use client'

interface Field {
  label: string;
  value: string;
}

interface ICPCardProps {
  icon: string;
  title: string;
  confidence: number; // 0-100
  fields: Field[];
}

export function ICPCard({ icon, title, confidence, fields }: ICPCardProps) {
  const confidenceColor = (conf: number) => {
    if (conf >= 80) return 'bg-green-500';
    if (conf >= 50) return 'bg-yellow-500';
    if (conf >= 20) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  const confidenceText = (conf: number) => {
    if (conf >= 80) return 'text-green-700';
    if (conf >= 50) return 'text-yellow-700';
    if (conf >= 20) return 'text-orange-700';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl" aria-hidden>{icon}</span>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500">Confidence</span>
          <span className={`text-xs font-semibold ${confidenceText(confidence)}`}>{confidence}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${confidenceColor(confidence)}`} style={{ width: `${confidence}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((f, idx) => (
          <div key={idx}>
            {f.label && <div className="text-xs font-medium text-gray-500 mb-1">{f.label}</div>}
            <div className={`text-sm ${f.value && f.value !== 'Unknown' ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}`}>
              {f.value || 'No data yet'}
            </div>
          </div>
        ))}
      </div>

      {confidence === 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400 italic">Need more data to analyze</p>
        </div>
      )}
    </div>
  )
}

