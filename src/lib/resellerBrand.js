export function readBrandQuery(searchParams) {
  const values = searchParams?.getAll('brand') || [];
  if (!values.length) return { requested: false, slug: '', error: null };
  const slug = values[0].trim().toLowerCase();
  if (values.length !== 1 || slug.length < 3 || slug.length > 63 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { requested: true, slug: '', error: 'Link brand tidak valid. Periksa kembali link dari reseller Anda.' };
  }
  return { requested: true, slug, error: null };
}

export function brandLogoUrl(path) {
  if (typeof path !== 'string' || !path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/') || path.startsWith('//')) return '';
  return `${(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')}${path}`;
}

export function numericOrderId(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function resellerContactUrl(contact, title, orderId) {
  if (typeof contact !== 'string') return null;
  const value = contact.trim();
  if (!value) return null;
  const id = numericOrderId(orderId);
  const message = `Halo, saya ingin mengaktifkan undangan yang baru saya buat.${id ? ` ID pesanan: ${id}.` : ''}${title ? ` Judul undangan: ${title}.` : ''}`;
  if (/^\+?[\d\s().-]+$/.test(value)) {
    let phone = value.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;
    if (!/^[1-9]\d{7,14}$/.test(phone)) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
  if (/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) {
    return `mailto:${encodeURIComponent(value)}?subject=${encodeURIComponent('Aktivasi undangan')}&body=${encodeURIComponent(message)}`;
  }
  try {
    const url = new URL(/^(?:wa\.me|api\.whatsapp\.com)\//i.test(value) ? `https://${value}` : value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    if (['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(url.hostname.toLowerCase())) {
      url.searchParams.set('text', message);
    }
    return url.toString();
  } catch {
    return null;
  }
}
