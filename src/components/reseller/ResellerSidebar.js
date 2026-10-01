'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Home, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useResellerUser } from './ResellerProvider';
import { useResellerBrandSettings } from './api';
import { brandLogoUrl } from '@/lib/resellerBrand';
import logo from '../../../public/logo/Sewa.png';

const menuItems = [
  { name: 'Dashboard', href: '/reseller/dashboard', icon: Home },
  { name: 'Customer / Form Masuk', href: '/reseller/customer', icon: Users },
  { name: 'Pengaturan Brand', href: '/reseller/brand', icon: Settings },
];

export default function ResellerSidebar() {
  const pathname = usePathname();
  const user = useResellerUser();
  const { data: brand } = useResellerBrandSettings();
  const [failedLogo, setFailedLogo] = useState(null);
  const uploadedLogo = brandLogoUrl(brand?.brandLogo);
  const panelLogo = uploadedLogo && uploadedLogo !== failedLogo ? uploadedLogo : null;
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/logout`, { withCredentials: true });
      Cookies.remove('client_token');
      await signOut({ callbackUrl: '/' });
    } catch {
      toast({ variant: 'destructive', title: 'Gagal keluar', description: 'Silakan coba kembali.' });
      setLoggingOut(false);
    }
  };

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center gap-3 border-b bg-white px-4 xl:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} aria-controls="reseller-sidebar">
          {open ? <X /> : <Menu />}
        </Button>
        <span className="font-semibold">Panel Reseller</span>
      </div>
      {open && <button className="fixed inset-0 z-30 bg-black/50 xl:hidden" aria-label="Tutup menu" onClick={() => setOpen(false)} />}
      <aside id="reseller-sidebar" className={`fixed inset-y-0 left-0 z-40 flex w-[300px] flex-col border-r bg-white transition-transform ${open ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0`}>
        <div className="relative flex flex-col items-center gap-3 px-6 pb-8 pt-10">
          <Button className="absolute right-2 top-2 xl:hidden" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Tutup menu"><X /></Button>
          <Link href="/reseller/dashboard" onClick={() => setOpen(false)}>
            <Image src={panelLogo || logo} alt={panelLogo ? `Logo ${brand.brandName || 'brand reseller'}` : 'SewaUndangan'} width={100} height={100} unoptimized={Boolean(panelLogo)} className={`h-[100px] w-[100px] object-contain ${panelLogo ? '' : 'rounded-full'}`} onError={panelLogo ? () => setFailedLogo(panelLogo) : undefined} />
          </Link>
          <div className="text-center">
            <p className="font-semibold text-[#0F2542]">Panel Reseller</p>
            <p className="mt-1 max-w-[240px] truncate text-sm text-muted-foreground">{user?.name || user?.email}</p>
          </div>
        </div>
        <nav aria-label="Menu reseller" className="flex-1 space-y-1 overflow-y-auto px-3">
          {menuItems.map(({ name, href, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={pathname.startsWith(href) ? 'page' : undefined} className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm ${pathname.startsWith(href) ? 'bg-blue-50 font-medium text-blue-700' : 'text-[#0F2542] hover:bg-muted'}`}>
              <Icon className="h-5 w-5" />{name}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <Button variant="ghost" className="w-full justify-start" disabled={loggingOut} onClick={handleLogout}><LogOut />{loggingOut ? 'Keluar...' : 'Keluar'}</Button>
        </div>
      </aside>
    </>
  );
}
