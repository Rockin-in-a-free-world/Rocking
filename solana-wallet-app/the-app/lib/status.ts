import { TransactionMetrics, Status } from './types';

/**
 * Calculate dashboard status from metrics
 * 
 * - Grand: Finalized + AcknowledgedFailures = Submitted
 * - Good: Confirmed + AcknowledgedFailures = Submitted
 * - Gutted: Confirmed + AcknowledgedFailures < Submitted
 */
export function calculateStatus(metrics: TransactionMetrics): Status {
  const { submitted, confirmed, finalized, acknowledgedFailures } = metrics;
  
  if (submitted === 0) {
    return 'Good'; // No transactions yet
  }
  
  // Grand: All transactions finalized OR acknowledged as failed
  if (finalized + acknowledgedFailures === submitted) {
    return 'Grand';
  }
  
  // Good: All transactions confirmed OR acknowledged as failed
  if (confirmed + acknowledgedFailures === submitted) {
    return 'Good';
  }
  
  // Gutted: Some transactions failed and NOT acknowledged
  return 'Gutted';
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
      message: 'All transactions confirmed',
    },
    Gutted: {
      icon: '😢',
      color: 'bg-red-100 text-red-800',
      message: 'Some transactions need attention',
    },
  };
  
  return configs[status];
}

