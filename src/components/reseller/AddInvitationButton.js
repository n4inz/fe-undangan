'use client';

import Link from 'next/link';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { readBrandQuery } from '@/lib/resellerBrand';
import { useResellerResource } from './api';

export default function AddInvitationButton() {
  const { data: brand, loading, error, reload } = useResellerResource('/brand');
  const query = readBrandQuery(new URLSearchParams({ brand: brand?.brandSlug || '' }));
  const configured = typeof brand?.brandName === 'string' && brand.brandName.trim() && !query.error;

  if (loading) return <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Tambah Undangan</Button>;
  if (error) return <div className="space-y-2"><Button variant="outline" onClick={reload}>Muat ulang brand</Button><p role="alert" className="text-xs text-destructive">Brand belum dapat dimuat.</p></div>;
  if (!configured) return (
    <div className="space-y-2">
      <Button asChild><Link href="/reseller/brand"><Plus className="mr-2 h-4 w-4" />Tambah Undangan</Link></Button>
      <p className="text-xs text-muted-foreground">Atur nama dan slug brand terlebih dahulu.</p>
    </div>
  );

  const brandQuery = `?brand=${encodeURIComponent(query.slug)}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Tambah Undangan<ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Pilih jenis undangan</DropdownMenuLabel>
        <DropdownMenuItem asChild><Link href={`/forms/new${brandQuery}`}>Wedding</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={`/forms/aqiqah-khitan/new${brandQuery}`}>Aqiqah / Khitan</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
