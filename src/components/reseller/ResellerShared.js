import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const resellerStatuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'waiting', label: 'Menunggu Aktivasi' },
  { value: 'active', label: 'Aktif' },
  { value: 'disabled', label: 'Dinonaktifkan' },
];

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  waiting: 'bg-amber-50 text-amber-700',
  active: 'bg-green-50 text-green-700',
  disabled: 'bg-red-50 text-red-700',
};

export function ResellerStatus({ status, label }) {
  return <Badge variant="outline" className={`whitespace-nowrap ${statusColors[status] || ''}`}>{label || resellerStatuses.find(item => item.value === status)?.label || '-'}</Badge>;
}

export function formatResellerDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function InvitationLink({ href }) {
  if (!href || !/^https?:\/\//i.test(href)) return <span className="text-muted-foreground">Belum tersedia</span>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">Lihat undangan<ExternalLink className="h-3.5 w-3.5" /></a>;
}

export function ResellerError({ message, onRetry }) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><span>{message}</span>{onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Coba lagi</Button>}</div>;
}
