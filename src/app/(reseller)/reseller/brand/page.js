'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { getResellerError, useResellerRequest, useResellerBrandSettings } from '@/components/reseller/api';
import { ResellerError } from '@/components/reseller/ResellerShared';
import { brandLogoUrl } from '@/lib/resellerBrand';

const emptyBrand = { brandName: '', brandSlug: '', brandLogo: '', contact: '' };
const allowedLogoTypes = ['image/jpeg', 'image/png', 'image/webp'];

const normalizeBrand = data => Object.fromEntries(
  Object.keys(emptyBrand).map(key => [key, typeof data?.[key] === 'string' ? data[key] : ''])
);

export default function ResellerBrand() {
  const { data, loading, error, reload, updateBrand } = useResellerBrandSettings();
  const { request } = useResellerRequest();
  const [form, setForm] = useState(emptyBrand);
  const [savedBrand, setSavedBrand] = useState(emptyBrand);
  const [origin, setOrigin] = useState('');
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const fileInput = useRef(null);

  useEffect(() => {
    if (data) {
      setForm(normalizeBrand(data));
      setSavedBrand(normalizeBrand(data));
    }
  }, [data]);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    if (!logo) {
      setPreview('');
      return;
    }
    const objectUrl = URL.createObjectURL(logo);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logo]);

  const handleLogo = event => {
    const file = event.target.files?.[0];
    if (file && (!allowedLogoTypes.includes(file.type) || file.size > 5 * 1024 * 1024)) {
      event.target.value = '';
      setLogo(null);
      toast({ variant: 'destructive', title: 'Logo tidak valid', description: 'Gunakan gambar JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.' });
      return;
    }
    setLogo(file || null);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const payload = new FormData();
      payload.append('brandName', form.brandName.trim());
      payload.append('brandSlug', form.brandSlug.trim().toLowerCase());
      payload.append('contact', form.contact.trim());
      if (logo) payload.append('brandLogo', logo);
      const response = await request('/brand', { method: 'PUT', data: payload });
      await updateBrand(response.data);
      setForm(normalizeBrand(response.data));
      setSavedBrand(normalizeBrand(response.data));
      setLogo(null);
      if (fileInput.current) fileInput.current.value = '';
      toast({ title: 'Brand berhasil disimpan', description: 'Pengaturan brand Anda sudah diperbarui.' });
    } catch (requestError) {
      const message = getResellerError(requestError, 'Pengaturan brand gagal disimpan. Silakan coba kembali.');
      setSaveError(message);
      toast({ variant: 'destructive', title: 'Gagal menyimpan brand', description: message });
    } finally {
      setSaving(false);
    }
  };

  const displayedLogo = preview || brandLogoUrl(form.brandLogo);
  const shareLinks = savedBrand.brandSlug && savedBrand.brandName ? [
    { label: 'Wedding', url: `${origin}/forms/new?brand=${encodeURIComponent(savedBrand.brandSlug)}` },
    { label: 'Aqiqah / Khitan', url: `${origin}/forms/aqiqah-khitan/new?brand=${encodeURIComponent(savedBrand.brandSlug)}` },
  ] : [];

  const copyLink = async url => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link berhasil disalin' });
    } catch {
      toast({ variant: 'destructive', title: 'Link gagal disalin', description: 'Silakan salin link yang ditampilkan secara manual.' });
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-semibold">Pengaturan Brand</h1><p className="mt-2 text-sm text-muted-foreground">Atur identitas brand dan kontak reseller Anda.</p></div>
      {error && <ResellerError message={error} onRetry={reload} />}
      <Card>
        <CardHeader><CardTitle className="text-lg">Identitas Brand</CardTitle><CardDescription>Slug brand harus unik dan tidak dapat digunakan oleh reseller lain.</CardDescription></CardHeader>
        <CardContent>
          {loading ? <div className="space-y-5" role="status" aria-label="Memuat pengaturan brand"><Skeleton className="h-10 w-full" /><Skeleton className="h-28 w-28" /><Skeleton className="h-10 w-full" /></div> : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {saveError && <ResellerError message={saveError} />}
              <fieldset disabled={saving || Boolean(error)} className="space-y-6 disabled:opacity-60">
                <div className="space-y-2"><Label htmlFor="brand-name">Nama Brand</Label><Input id="brand-name" name="brandName" value={form.brandName || ''} onChange={event => setForm(current => ({ ...current, brandName: event.target.value }))} placeholder="WeddingKu" maxLength={100} required /></div>
                <div className="space-y-2">
                  <Label htmlFor="brand-logo">Logo Brand</Label>
                  {displayedLogo && <div className="w-fit rounded-lg border bg-white p-3"><Image src={displayedLogo} alt="Logo brand" width={128} height={128} unoptimized className="h-32 w-32 object-contain" /></div>}
                  <Input ref={fileInput} id="brand-logo" name="brandLogo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogo} aria-describedby="brand-logo-help" />
                  <p id="brand-logo-help" className="text-xs text-muted-foreground">JPG, PNG, atau WebP. Maksimal 5 MB.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand-slug">Slug Brand</Label>
                  <Input id="brand-slug" name="brandSlug" value={form.brandSlug || ''} onChange={event => setForm(current => ({ ...current, brandSlug: event.target.value.toLowerCase() }))} placeholder="weddingku" minLength={3} maxLength={63} pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Gunakan 3–63 huruf kecil, angka, atau tanda hubung tunggal di antara kata." required aria-describedby="brand-slug-help" />
                  <p id="brand-slug-help" className="text-xs text-muted-foreground">3–63 huruf kecil, angka, atau tanda hubung. Awal dan akhir harus huruf atau angka.</p>
                </div>
                <div className="space-y-2"><Label htmlFor="brand-contact">Kontak Reseller</Label><Input id="brand-contact" name="contact" value={form.contact || ''} onChange={event => setForm(current => ({ ...current, contact: event.target.value }))} placeholder="Nomor WhatsApp atau email" maxLength={191} /></div>
                <Button type="submit">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Menyimpan...' : 'Simpan Brand'}</Button>
              </fieldset>
            </form>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg">Link Form Reseller</CardTitle><CardDescription>Bagikan link berikut kepada customer. Link mengikuti pengaturan brand yang sudah disimpan.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {shareLinks.length ? shareLinks.map(link => <div key={link.label} className="space-y-2 rounded-lg border p-4"><p className="text-sm font-medium">{link.label}</p><a href={link.url} target="_blank" rel="noopener noreferrer" className="block break-all text-sm text-blue-700 hover:underline">{link.url}</a><Button type="button" variant="outline" size="sm" onClick={() => copyLink(link.url)}>Salin Link</Button></div>) : <p className="text-sm text-muted-foreground">Simpan nama dan slug brand untuk mendapatkan link form reseller.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
