export function formatRange(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(1)} m`;
}

export function formatVelocity(ms: number): string {
  return `${ms.toFixed(1)} m/s`;
}

export function formatConfidence(conf: number): string {
  return `${(conf * 100).toFixed(1)}%`;
}

export function formatTimestamp(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoStr;
  }
}

export function formatFullDateTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  } catch {
    return isoStr;
  }
}

export function getTargetBadgeColor(type: string): { bg: string; text: string; border: string; dot: string } {
  switch (type?.toUpperCase()) {
    case 'DRONE':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
        dot: 'bg-red-500'
      };
    case 'BIRD':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
        dot: 'bg-cyan-400'
      };
    case 'UNKNOWN':
    default:
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400'
      };
  }
}
