'use client';

import { Status } from '@/lib/types';
import { getStatusConfig } from '@/lib/status';

interface StatusAlertProps {
  status: Status;
  isLoading?: boolean;
}

export default function StatusAlert({ status, isLoading }: StatusAlertProps) {
  if (isLoading) {
    return (
      <div className="p-4 rounded-lg bg-gray-100 animate-pulse">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔄</span>
          <span className="text-gray-600">Loading status...</span>
        </div>
      </div>
    );
  }

  const config = getStatusConfig(status);

  return (
    <div className={`p-4 rounded-lg ${config.color}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <div className="font-bold">Status: {status}</div>
          <div className="text-sm">{config.message}</div>
        </div>
      </div>
    </div>
  );
}

