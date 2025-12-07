'use client';

import { TransactionMetrics as Metrics } from '@/lib/types';

interface TransactionMetricsProps {
  metrics: Metrics;
  isLoading?: boolean;
}

export default function TransactionMetrics({ metrics, isLoading }: TransactionMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-8 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const metricItems = [
    { label: 'Submitted', value: metrics.submitted },
    { label: 'Broadcast', value: metrics.broadcast },
    { label: 'Confirmed', value: metrics.confirmed },
    { label: 'Finalized', value: metrics.finalized },
    { label: 'Failed', value: metrics.failed },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metricItems.map((item) => (
        <div key={item.label} className="p-4 bg-white rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">{item.label}</div>
          <div className="text-2xl font-bold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

