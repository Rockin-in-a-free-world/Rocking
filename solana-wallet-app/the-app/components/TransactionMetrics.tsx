'use client';

import { TransactionMetrics as Metrics } from '@/lib/types';

interface TransactionMetricsProps {
  metrics: Metrics | null;
  isLoading: boolean;
  balance?: number | null; // Balance in SOL
}

export default function TransactionMetrics({ metrics, isLoading, balance }: TransactionMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-8 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const metricItems = [
    { label: 'Balance', value: balance !== null && balance !== undefined ? `${balance.toFixed(4)} SOL` : 'Loading...', highlight: true },
    { label: 'Submitted', value: metrics?.submitted ?? 0 },
    { label: 'Broadcasting', value: metrics?.broadcast ?? 0 },
    { label: 'Confirmed', value: metrics?.confirmed ?? 0 },
    { label: 'Finalized', value: metrics?.finalized ?? 0 },
    { label: 'Failed', value: metrics?.failed ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metricItems.map((item) => (
        <div 
          key={item.label} 
          className={`p-4 rounded-lg shadow ${item.highlight ? 'bg-blue-50 border-2 border-blue-200' : 'bg-white'}`}
        >
          <div className="text-sm text-gray-600 mb-1">{item.label}</div>
          <div className={`text-2xl font-bold ${item.highlight ? 'text-blue-800' : ''}`}>
            {isLoading ? <span className="animate-pulse">...</span> : item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

