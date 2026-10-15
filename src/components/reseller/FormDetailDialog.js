'use client';

import { Copy, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useResellerResource } from './api';
import { formatResellerDate, InvitationLink, ResellerError, ResellerStatus } from './ResellerShared';
import { toast } from '@/components/ui/use-toast';

export default function FormDetailDialog({ form, onClose }) {
  const { data, loading, error, reload } = useResellerResource(form ? `/forms/${encodeURIComponent(form.type)}/${encodeURIComponent(form.id)}` : null);
  const detail = data?.data;
  const copyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(detail.linkUndangan);
      toast({ title: 'Link undangan berhasil disalin' });
    } catch {
      toast({
        title: 'Link undangan gagal disalin',
        description: 'Silakan salin link yang ditampilkan secara manual.',
        variant: 'destructive',
      });
    }
  };
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
            <div>
              <dt className="text-muted-foreground">Link undangan</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-3">
                <InvitationLink href={detail.linkUndangan} />
                {detail.linkUndangan && /^https?:\/\//i.test(detail.linkUndangan) && (
                  <Button type="button" variant="outline" size="sm" onClick={copyInvitationLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Salin
                  </Button>
                )}
              </dd>
            </div>
          </dl>
        )}
        {detail && !loading && !error && <Button asChild><Link href={`/reseller/customer/${encodeURIComponent(detail.type)}/${encodeURIComponent(detail.id)}/edit`}>Edit Data Customer</Link></Button>}
      </DialogContent>
    </Dialog>
  );
}
