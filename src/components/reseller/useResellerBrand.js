'use client';

import axios from 'axios';
import { useEffect } from 'react';
import useSWR from 'swr';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { numericOrderId, readBrandQuery } from '@/lib/resellerBrand';

const swrOptions = { errorRetryCount: 1, keepPreviousData: false };

async function fetchBrand([path, token, credentials]) {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    withCredentials: credentials,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
}

export function useResellerBrand() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const query = readBrandQuery(searchParams);
  const key = query.slug ? [`/brands/${encodeURIComponent(query.slug)}`, '', false] : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetchBrand, swrOptions);
  const redirecting = query.requested && Boolean(query.error || error?.response?.status === 404);
  const brand = !redirecting && data?.brand?.brandSlug === query.slug ? data.brand : null;
  const normalQuery = new URLSearchParams(searchParams?.toString());
  normalQuery.delete('brand');
  const normalUrl = `${pathname}${normalQuery.size ? `?${normalQuery}` : ''}`;

  useEffect(() => {
    if (redirecting) router.replace(normalUrl, { scroll: false });
  }, [redirecting, normalUrl, router]);
  const message = query.error || (error ? (error.response?.status === 404
    ? 'Brand tidak tersedia. Periksa kembali link dari reseller Anda.'
    : 'Informasi brand gagal dimuat. Silakan coba lagi.') : null)
    || (key && !isLoading && !brand ? 'Informasi brand tidak valid. Silakan coba lagi.' : null);
  return {
    brand, brandSlug: brand?.brandSlug || '', isReseller: Boolean(brand),
    loading: redirecting || Boolean(key && isLoading), error: redirecting ? null : message, reload: () => mutate(),
  };
}

export function useOrderBrand({ type, formId, enabled = true }) {
  const { data: session, status } = useSession();
  const numericId = /^\d+$/.test(String(formId || ''));
  const waitingForSession = enabled && numericId && status === 'loading';
  const token = numericId ? session?.user?.sessionToken || '' : '';
  const validType = ['wedding', 'aqiqah-khitan'].includes(type);
  const key = enabled && validType && formId && !waitingForSession
    ? [`/form-brand/${type}/${encodeURIComponent(formId)}`, token, numericId] : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetchBrand, swrOptions);
  const orderId = numericOrderId(data?.orderId);
  const validResponse = data && typeof data.isReseller === 'boolean' && orderId !== null;
  return {
    brand: validResponse && data.isReseller ? data.brand : null,
    orderId: validResponse ? orderId : null,
    isReseller: validResponse ? data.isReseller : false,
    loading: Boolean(waitingForSession || (key && isLoading)),
    error: enabled && (error || (key && !isLoading && !validResponse) || !validType || !formId)
      ? 'Informasi undangan gagal dimuat. Silakan coba lagi.' : null,
    reload: () => mutate(),
  };
}
