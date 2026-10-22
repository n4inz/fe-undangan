'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { BRAND_SLUG_PATTERN, createBrandSlug, hasCustomBrandSlug, sanitizeBrandSlugInput, validateAdminResellerBrand } from '@/lib/adminResellerBrand';
import { brandLogoUrl, brandSubdomainUrl } from '@/lib/resellerBrand';

const allowedLogoTypes = ['image/jpeg', 'image/png', 'image/webp'];

const accountValues = customer => ({
  name: customer.name || '',
  email: customer.email || '',
  contact: customer.contact || '',
  role: customer.role || 'user',
  brandName: customer.brandName || '',
  brandSlug: customer.brandSlug || '',
  brandLogo: customer.brandLogo || '',
});

export default function CustomerAccountForm({ customer, onSaved }) {
  const [values, setValues] = useState(() => accountValues(customer));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slugEdited, setSlugEdited] = useState(() => hasCustomBrandSlug(customer));
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState('');
  const fileInput = useRef(null);
  const editable = customer.isAdmin === 0 && ['user', 'reseller'].includes(customer.role);
  const brandError = values.role === 'reseller' ? validateAdminResellerBrand(values) : '';
  const subdomainUrl = brandSubdomainUrl(values.brandSlug);
  const displayedLogo = preview || brandLogoUrl(values.brandLogo);

  useEffect(() => {
    if (!logo) {
      setPreview('');
      return;
    }
    const objectUrl = URL.createObjectURL(logo);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logo]);

  const clearLogo = () => {
    setLogo(null);
    setPreview('');
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleLogo = event => {
    const file = event.target.files?.[0];
    if (file && (!allowedLogoTypes.includes(file.type) || file.size > 5 * 1024 * 1024)) {
      event.target.value = '';
      clearLogo();
      toast({ variant: 'destructive', title: 'Logo tidak valid', description: 'Gunakan gambar JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.' });
      return;
    }
    setLogo(file || null);
    setError('');
  };

  const changeValue = (field, value) => {
    if (field === 'role' && value !== 'reseller') clearLogo();
    if (field === 'brandSlug') {
      value = sanitizeBrandSlugInput(value);
      if (value === values.brandSlug) return;
      setSlugEdited(Boolean(value));
      value = value || createBrandSlug(values.brandName);
    }
    setValues(current => ({
      ...current,
      [field]: value,
      ...(field === 'brandName' && !slugEdited ? { brandSlug: createBrandSlug(value) } : {}),
      ...(field === 'role' && value === 'reseller' && !slugEdited && !current.brandSlug
        ? { brandSlug: createBrandSlug(current.brandName) }
        : {}),
    }));
    setError('');
  };

  const handleSave = async event => {
    event.preventDefault();
    if (saving || !editable) return;
    if (brandError) {
      setError(brandError);
      return;
    }
    setSaving(true);
    setError('');

    try {
      const profile = {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        contact: values.contact.trim(),
        role: values.role,
        brandName: values.brandName.trim(),
        brandSlug: values.brandSlug.trim().toLowerCase(),
      };
      let payload = profile;
      if (logo && values.role === 'reseller') {
        payload = new FormData();
        Object.entries(profile).forEach(([key, value]) => payload.append(key, value));
        payload.append('brandLogo', logo);
      }
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/${customer.id}`,
        payload,
        { withCredentials: true }
      );
      setValues(accountValues(response.data.customer));
      setSlugEdited(hasCustomBrandSlug(response.data.customer));
      clearLogo();
      onSaved(response.data.customer);
      toast({ title: response.data.message || 'Data customer berhasil disimpan.' });
    } catch (error) {
      setError(error.response?.data?.message || 'Gagal menyimpan data customer. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Data Akun</CardTitle>
        <CardDescription>
          {editable ? 'Perbarui data customer dan akses Panel Reseller.' : 'Akun Admin hanya dapat dilihat dari menu Customer.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5">
          <fieldset disabled={saving || !editable} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nama Customer</Label>
              <Input id="customer-name" name="name" value={values.name} onChange={event => changeValue('name', event.target.value)} maxLength={191} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input id="customer-email" name="email" type="email" value={values.email} onChange={event => changeValue('email', event.target.value)} maxLength={191} required aria-describedby="customer-email-hint" />
              <p id="customer-email-hint" className="text-xs text-muted-foreground">Email harus sesuai dengan email yang digunakan customer untuk masuk.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-contact">Kontak / WhatsApp</Label>
              <Input id="customer-contact" name="contact" value={values.contact} onChange={event => changeValue('contact', event.target.value)} maxLength={191} placeholder="Contoh: 081234567890" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-role">Role</Label>
              <Select value={values.role} onValueChange={value => changeValue('role', value)} disabled={saving || !editable}>
                <SelectTrigger id="customer-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="reseller">Reseller</SelectItem>
                  {!editable && values.role === 'admin' && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Reseller mendapat akses Panel Reseller. Aktivasi undangan tetap dilakukan oleh Admin.</p>
            </div>
            {values.role === 'reseller' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customer-brand-name">Nama Brand</Label>
                  <Input id="customer-brand-name" name="brandName" value={values.brandName} onChange={event => changeValue('brandName', event.target.value)} maxLength={100} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-brand-slug">Subdomain Brand</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex min-w-0 flex-1">
                      <Input id="customer-brand-slug" name="brandSlug" value={values.brandSlug} onChange={event => changeValue('brandSlug', event.target.value)} minLength={3} maxLength={63} pattern={BRAND_SLUG_PATTERN} autoCapitalize="none" autoCorrect="off" spellCheck={false} required placeholder="contoh-brand" className="min-w-0 rounded-r-none" aria-describedby="customer-brand-domain customer-brand-slug-hint" />
                      <span id="customer-brand-domain" className="inline-flex shrink-0 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">.sewaundangan.com</span>
                    </div>
                    {subdomainUrl && <Button asChild variant="outline" size="icon" className="shrink-0"><a href={subdomainUrl} target="_blank" rel="noopener noreferrer" aria-label="Buka subdomain brand" title={subdomainUrl}><ExternalLink className="h-4 w-4" aria-hidden="true" /></a></Button>}
                  </div>
                  <p id="customer-brand-slug-hint" className="text-xs text-muted-foreground">Digunakan sebagai alamat link brand.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customer-brand-logo">Logo Brand</Label>
                  {displayedLogo && <div className="w-fit rounded-lg border bg-white p-3"><Image src={displayedLogo} alt="Logo brand" width={128} height={128} unoptimized className="h-32 w-32 object-contain" /></div>}
                  <Input ref={fileInput} id="customer-brand-logo" name="brandLogo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogo} aria-describedby="customer-brand-logo-hint" />
                  <p id="customer-brand-logo-hint" className="text-xs text-muted-foreground">JPG, PNG, atau WebP. Maksimal 5 MB. Pilih gambar untuk menambah atau mengganti logo brand.</p>
                </div>
              </>
            )}
          </fieldset>
          {customer.role === 'reseller' && values.role === 'user' && (
            <p className="text-sm text-muted-foreground">Akses Panel Reseller akan dicabut. Data brand dan relasi undangan tetap tersimpan.</p>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {editable && (
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || Boolean(brandError)}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
              <Button type="button" variant="outline" disabled={saving} onClick={() => { setValues(accountValues(customer)); setSlugEdited(hasCustomBrandSlug(customer)); clearLogo(); setError(''); }}>Batal Perubahan</Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
