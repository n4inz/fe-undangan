'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { numericOrderId, resellerContactUrl } from '@/lib/resellerBrand';

export default function ResellerPaymentModal({ brand, orderId, title, buttonClassName, isPaid }) {
  if (Number(isPaid) === 1) return <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Undangan Anda sudah aktif.</p>;
  const id = numericOrderId(orderId);
  const contactUrl = resellerContactUrl(brand?.contact, title, id);
  return (
    <Dialog>
      <DialogTrigger asChild><Button className={buttonClassName}><MessageCircle className="mr-2 h-4 w-4" />Hubungi Admin</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{brand?.brandName || 'Aktivasi Undangan'}</DialogTitle>
          <DialogDescription>Silakan hubungi admin untuk mengaktifkan undangan Anda.</DialogDescription>
        </DialogHeader>
        {id && <p className="text-sm">ID pesanan: <strong>{id}</strong></p>}
        {contactUrl ? <Button asChild><a href={contactUrl} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Hubungi Admin</a></Button> : <p className="text-sm text-muted-foreground">Kontak admin belum tersedia. Hubungi admin melalui kontak yang memberikan link form ini.</p>}
      </DialogContent>
    </Dialog>
  );
}
