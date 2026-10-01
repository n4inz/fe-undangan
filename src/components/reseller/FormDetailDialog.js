'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useResellerResource } from './api';
import { formatResellerDate, InvitationLink, ResellerError, ResellerStatus } from './ResellerShared';

export default function FormDetailDialog({ form, onClose }) {
  const { data, loading, error, reload } = useResellerResource(form ? `/forms/${encodeURIComponent(form.type)}/${encodeURIComponent(form.id)}` : null);
  const detail = data?.data;
  const fields = detail ? [
    ['ID Pesanan', detail.id],
    ['Nama customer', detail.customerName || '-'],
    ['Email', detail.customerEmail || '-'],
    ['Kontak', detail.contact || '-'],
    ['Mempelai / judul', detail.title || '-'],
    ['Jenis undangan', detail.invitationType || (detail.type === 'wedding' ? 'Wedding' : 'Aqiqah / Khitan')],
    ['Tanggal dibuat', formatResellerDate(detail.createdAt)],
    ['Brand', detail.brandSlug || '-'],
  ] : [];

  return (
    <Dialog open={Boolean(form)} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Detail Form Masuk</DialogTitle><DialogDescription>Informasi customer dan status undangan. Aktivasi dilakukan oleh Admin.</DialogDescription></DialogHeader>
        {loading ? <div role="status" className="flex items-center justify-center gap-2 py-8 text-sm"><Loader2 className="h-5 w-5 animate-spin" />Memuat detail...</div> : error ? <ResellerError message={error} onRetry={reload} /> : detail && (
          <dl className="space-y-4 text-sm">
            {fields.map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}
            <div><dt className="text-muted-foreground">Status</dt><dd className="mt-1"><ResellerStatus status={detail.status} label={detail.statusLabel} /></dd></div>
            <div><dt className="text-muted-foreground">Link undangan</dt><dd className="mt-1"><InvitationLink href={detail.linkUndangan} /></dd></div>
          </dl>
        )}
        {detail && !loading && !error && <Button asChild><Link href={`/reseller/customer/${encodeURIComponent(detail.type)}/${encodeURIComponent(detail.id)}/edit`}>Edit Data Customer</Link></Button>}
      </DialogContent>
    </Dialog>
  );
}
