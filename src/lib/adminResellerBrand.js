export const BRAND_SLUG_PATTERN = '[a-z0-9]+(-[a-z0-9]+)*';

export function createBrandSlug(brandName) {
  return brandName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/g, '');
}

export function sanitizeBrandSlugInput(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .slice(0, 63);
}

export function hasCustomBrandSlug({ brandName, brandSlug, role }) {
  return Boolean(brandSlug) && (role === 'reseller' || brandSlug !== createBrandSlug(brandName || ''));
}

export function validateAdminResellerBrand({ brandName, brandSlug }) {
  if (!brandName.trim() || brandName.trim().length > 100) {
    return 'Nama brand wajib diisi dan maksimal 100 karakter.';
  }
  const slug = brandSlug.trim().toLowerCase();
  if (slug.length < 3 || slug.length > 63 || !new RegExp(`^${BRAND_SLUG_PATTERN}$`).test(slug)) {
    return 'Subdomain brand wajib terdiri dari 3–63 huruf kecil, angka, atau tanda hubung di antara kata.';
  }
  return '';
}
