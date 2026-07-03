'use client';

// Simple time formatter for demo — replaces the main app's FormattedDateTime
export function FormattedTime({ date }: { date: Date | string }) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const mins = m.toString().padStart(2, '0');
  return <span>{`${hour12}:${mins} ${ampm}`}</span>;
}

export function FormattedDate({ date }: { date: Date | string }) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return <span>{d.toLocaleDateString()}</span>;
}
