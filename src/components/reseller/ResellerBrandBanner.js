'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { brandLogoUrl } from '@/lib/resellerBrand';

export default function ResellerBrandBanner({ brand, loading, error }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (loading) return <div role="status" className="mb-5 flex items-center gap-2 rounded-lg border bg-white p-4 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Memuat informasi brand...</div>;
  if (error) {
    const normalQuery = new URLSearchParams(searchParams?.toString());
    normalQuery.delete('brand');
    const normalUrl = `${pathname}${normalQuery.size ? `?${normalQuery}` : ''}`;
    return <div role="alert" className="mb-5 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p>{error}</p>{pathname.endsWith('/new') && <Link href={normalUrl} className="font-medium underline">Buka form biasa</Link>}</div>;
  }
  if (!brand) return null;
  const logo = brandLogoUrl(brand.brandLogo);
  return <div className="mb-5 flex items-center gap-3 rounded-lg border bg-white p-4">{logo && <Image src={logo} alt={`Logo ${brand.brandName}`} width={56} height={56} unoptimized className="h-14 w-14 object-contain" />}<span className="font-semibold text-gray-900">{brand.brandName}</span></div>;
}
