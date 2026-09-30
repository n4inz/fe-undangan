'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

// Existing admin screens share axios. Google admins use their existing database
// session; password accounts continue using the existing API cookie.
export default function AdminSessionProvider({ sessionToken, children }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const interceptor = axios.interceptors.request.use((config) => {
            if (sessionToken && config.url?.startsWith(`${process.env.NEXT_PUBLIC_API_URL}/`)) {
                config.headers.Authorization = `Bearer ${sessionToken}`;
            }
            return config;
        });
        setReady(true);
        return () => axios.interceptors.request.eject(interceptor);
    }, [sessionToken]);

    if (!ready) return <p className="p-6 text-sm text-muted-foreground">Memuat panel...</p>;
    return children;
}
