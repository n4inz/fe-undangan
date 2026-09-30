'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useResellerUser } from './ResellerProvider';

export function getResellerError(error, fallback = 'Data gagal dimuat. Silakan coba kembali.') {
  if (error.response?.status === 401 || error.response?.status === 403) {
    return 'Sesi atau akses reseller Anda sudah berubah. Silakan masuk kembali.';
  }
  const message = error.response?.data?.error || error.response?.data?.message;
  return typeof message === 'string' ? message : fallback;
}

export function useResellerRequest() {
  const user = useResellerUser();
  const token = user?.sessionToken;
  const request = useCallback((path, options = {}) => {
    return axios({
      ...options,
      url: `${process.env.NEXT_PUBLIC_API_URL}/reseller${path}`,
      withCredentials: true,
      headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  }, [token]);

  return { request, ready: Boolean(user) };
}

export function useResellerResource(path, params) {
  const { request, ready } = useResellerRequest();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const query = JSON.stringify(params || {});
  const reload = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!path) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (!ready) {
      setData(null);
      setError('Sesi tidak tersedia. Silakan masuk kembali.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    request(path, { params: JSON.parse(query), signal: controller.signal })
      .then(response => {
        if (!controller.signal.aborted) setData(response.data);
      })
      .catch(requestError => {
        if (!controller.signal.aborted) {
          setData(null);
          setError(getResellerError(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, query, ready, request, revision]);

  return { data, loading, error, reload };
}
