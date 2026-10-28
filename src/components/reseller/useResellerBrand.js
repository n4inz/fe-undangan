'use client';

import axios from 'axios';
import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { normalizeWhatsAppPhone, numericOrderId, paymentDestinationPhone, readBrandQuery, readPhoneQuery, storedWhatsAppPhone } from '@/lib/resellerBrand';

const swrOptions = { errorRetryCount: 1, keepPreviousData: false };
const paymentSwrOptions = { ...swrOptions, revalidateOnMount: true, dedupingInterval: 0 };

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
    ? 'Brand tidak tersedia. Periksa kembali link dari admin Anda.'
    : 'Informasi brand gagal dimuat. Silakan coba lagi.') : null)
    || (key && !isLoading && !brand ? 'Informasi brand tidak valid. Silakan coba lagi.' : null);
  return {
    brand, brandSlug: brand?.brandSlug || '', isReseller: Boolean(brand),
    loading: redirecting || Boolean(key && isLoading), error: redirecting ? null : message, reload: () => mutate(),
  };
}

export function useOrderBrand({ type, formId, enabled = true, fresh = false }) {
  const { data: session, status } = useSession();
  const numericId = /^\d+$/.test(String(formId || ''));
  const waitingForSession = enabled && numericId && status === 'loading';
  const token = numericId ? session?.user?.sessionToken || '' : '';
  const validType = ['wedding', 'aqiqah-khitan'].includes(type);
  const key = enabled && validType && formId && !waitingForSession
    ? [`/form-brand/${type}/${encodeURIComponent(formId)}`, token, numericId] : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetchBrand, fresh ? paymentSwrOptions : swrOptions);
  const orderId = numericOrderId(data?.orderId);
  const validResponse = data && typeof data.isReseller === 'boolean' && orderId !== null;
  return {
    brand: validResponse && data.isReseller ? data.brand : null,
    orderId: validResponse ? orderId : null,
    adminPhone: validResponse ? storedWhatsAppPhone(data.adminPhone) : null,
    paymentToken: token,
    paymentCredentials: numericId,
    isReseller: validResponse ? data.isReseller : false,
    loading: Boolean(waitingForSession || (key && (isLoading || (fresh && isValidating)))),
    error: enabled && (error || (key && !isLoading && !validResponse) || !validType || !formId)
      ? 'Informasi undangan gagal dimuat. Silakan coba lagi.' : null,
    reload: () => mutate(),
  };
}

// URL contact routing is separate from saved order ownership. Never substitute
// the saved owner's contact for a different or unavailable requested brand.
export function usePaymentDestination({ type, formId }) {
  const searchParams = useSearchParams();
  const query = readBrandQuery(searchParams);
  const phones = searchParams?.getAll('phone') || [];
  const urlPhone = phones.length === 1 ? phones[0] : null;
  const paymentParams = new URLSearchParams();
  for (const [key, value] of searchParams?.entries() || []) {
    if (key === 'brand' || key === 'phone') paymentParams.append(key, value);
  }
  const order = useOrderBrand({ type, formId, fresh: true });
  const key = query.slug ? [`/brands/${encodeURIComponent(query.slug)}`, '', false] : null;
  const lookup = useSWR(key, fetchBrand, paymentSwrOptions);
  const queryBrand = lookup.error?.response?.status !== 404 && lookup.data?.brand?.brandSlug === query.slug ? lookup.data.brand : null;
  // Keep old order links functional when neither routing parameter was given.
  const brand = query.requested ? queryBrand : phones.length ? null : order.brand;
  const phone = paymentDestinationPhone(brand, urlPhone, order.adminPhone);
  const phoneSource = normalizeWhatsAppPhone(brand?.contact) ? 'brand' : readPhoneQuery(searchParams) ? 'url' : phone ? 'saved' : null;
  const savedContact = phoneSource === 'saved' || phoneSource === 'url' && !query.requested && Boolean(order.adminPhone);
  const resolutionKey = JSON.stringify([type, formId, paymentParams.toString()]);
  const resolved = useRef(null);
  const fetching = order.loading || Boolean(key && (lookup.isLoading || lookup.isValidating));
  const lookupError = key && lookup.error && lookup.error.response?.status !== 404
    ? 'Informasi brand gagal dimuat. Silakan coba lagi.' : null;
  const blockingError = order.error || lookupError;
  const hasResolution = resolved.current === resolutionKey;
  if (!fetching && !blockingError) resolved.current = resolutionKey;
  return {
    brand,
    orderId: order.orderId,
    adminPhone: order.adminPhone,
    phone,
    phoneSource,
    contactLabel: savedContact ? 'Hubungi Admin' : 'Bayar Sekarang',
    paymentQuery: paymentParams.toString(),
    paymentToken: order.paymentToken,
    paymentCredentials: order.paymentCredentials,
    // Background refresh must not unmount a payment draft (e.g. on tab focus).
    loading: fetching && resolved.current !== resolutionKey,
    error: hasResolution && order.orderId !== null ? null : blockingError,
    reload: () => Promise.all([order.reload(), lookup.mutate()]),
  };
}
