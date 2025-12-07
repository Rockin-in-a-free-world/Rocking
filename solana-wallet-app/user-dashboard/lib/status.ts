import { TransactionMetrics, Status } from './types';

/**
 * Calculate dashboard status from metrics (on-chain data only)
 * 
 * - Grand: All transactions finalized (no failures)
 * - Good: All transactions confirmed (no failures, but not all finalized)
 * - Gutted: Any failed transaction (permanent - user can't recover)
 */
export function calculateStatus(metrics: TransactionMetrics): Status {
  const { submitted, confirmed, finalized, failed } = metrics;
  
  if (submitted === 0) {
    return 'Good'; // No transactions yet
  }
  
  // Gutted: Any failed transaction (permanent status)
  if (failed > 0) {
    return 'Gutted';
  }
  
  // Grand: All transactions finalized (no failures)
  if (finalized === submitted) {
    return 'Grand';
  }
  
  // Good: All transactions confirmed (no failures, but not all finalized)
  if (confirmed === submitted) {
    return 'Good';
  }
  
  // Default: Some transactions still pending (not all confirmed yet)
  return 'Good';
}

/**
 * Get status configuration (icons, colors, messages)
 */
export function getStatusConfig(status: Status) {
  const configs = {
    Grand: {
      icon: '😊',
      color: 'bg-green-100 text-green-800',
      message: 'All transactions finalized!',
    },
    Good: {
      icon: '😃',
      color: 'bg-yellow-100 text-yellow-800',
      message: 'All transactions confirmed (some may still be finalizing)',
    },
    Gutted: {
      icon: '😢',
      color: 'bg-red-100 text-red-800',
      message: 'One or more transactions failed (permanent status)',
    },
  };
  
  return configs[status];
}

