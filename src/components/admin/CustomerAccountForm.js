'use client';

import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

const accountValues = customer => ({
  name: customer.name || '',
  email: customer.email || '',
  contact: customer.contact || '',
  role: customer.role || 'user',
  brandName: customer.brandName || '',
  brandSlug: customer.brandSlug || '',
});

export default function CustomerAccountForm({ customer, onSaved }) {
  const [values, setValues] = useState(() => accountValues(customer));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editable = customer.isAdmin === 0 && ['user', 'reseller'].includes(customer.role);

  const changeValue = (field, value) => {
    setValues(current => ({ ...current, [field]: value }));
    setError('');
  };

  const handleSave = async event => {
    event.preventDefault();
    if (saving || !editable) return;
    setSaving(true);
    setError('');

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/${customer.id}`,
        {
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          contact: values.contact.trim(),
          role: values.role,
          brandName: values.brandName.trim(),
          brandSlug: values.brandSlug.trim().toLowerCase(),
        },
        { withCredentials: true }
      );
      setValues(accountValues(response.data.customer));
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
                  <Input id="customer-brand-name" name="brandName" value={values.brandName} onChange={event => changeValue('brandName', event.target.value)} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-brand-slug">Slug Brand</Label>
                  <Input id="customer-brand-slug" name="brandSlug" value={values.brandSlug} onChange={event => changeValue('brandSlug', event.target.value.toLowerCase())} minLength={3} maxLength={63} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="contoh-brand" aria-describedby="customer-brand-slug-hint" />
                  <p id="customer-brand-slug-hint" className="text-xs text-muted-foreground">Slug harus unik, 3–63 karakter berupa huruf kecil, angka, atau tanda hubung di antara kata. Mengubah slug akan mengubah link form brand.</p>
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
              <Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
              <Button type="button" variant="outline" disabled={saving} onClick={() => { setValues(accountValues(customer)); setError(''); }}>Batal Perubahan</Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
