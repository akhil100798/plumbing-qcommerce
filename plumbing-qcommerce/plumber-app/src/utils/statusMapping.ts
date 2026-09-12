import { colors } from '../theme';

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'muted';

export interface StatusSchema {
  tone: StatusTone;
  label: string;
}

const schema: StatusSchema = {
  tone: 'muted',
  label: 'Unknown',
};

export function mapJobStatus(status?: string): StatusSchema {
  const s = (status || '').toUpperCase();
  if (['ASSIGNED', 'ACCEPTED', 'CONFIRMED'].includes(s)) {
    return { tone: 'primary', label: titleCase(s) };
  }
  if (['STARTED', 'IN_PROGRESS', 'ON_THE_WAY', 'REACHED'].includes(s)) {
    return { tone: 'success', label: titleCase(s) };
  }
  if (['COMPLETED', 'DELIVERED', 'COLLECTED', 'PAID'].includes(s)) {
    return { tone: 'success', label: titleCase(s) };
  }
  if (['CANCELLED', 'REJECTED', 'FAILED'].includes(s)) {
    return { tone: 'error', label: titleCase(s) };
  }
  if (['PENDING', 'PENDING_APPROVAL', 'REQUESTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(s)) {
    return { tone: 'warning', label: titleCase(s) };
  }
  return schema;
}

export function mapMaterialStatus(status?: string): StatusSchema {
  const s = (status || '').toUpperCase();
  if (['PENDING_APPROVAL', 'PENDING', 'REQUESTED'].includes(s)) {
    return { tone: 'warning', label: statusLabel(s) };
  }
  if (['APPROVED', 'READY_FOR_PICKUP', 'COLLECTED', 'DELIVERED', 'DELIVERING', 'STORE_ACCEPTED'].includes(s)) {
    return { tone: s === 'DELIVERING' ? 'info' : 'success', label: statusLabel(s) };
  }
  if (['REJECTED', 'CANCELLED', 'FAILED'].includes(s)) {
    return { tone: 'error', label: statusLabel(s) };
  }
  return { tone: 'muted', label: statusLabel(s) || 'Unknown' };
}

function statusLabel(s: string): string {
  return s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
