'use client'

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipLoader } from 'react-spinners';
import { getCompanyProfile } from '@/lib/company';

export default function LoginPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [company, setCompany] = useState(null); // Initialize as null for a single object
    const [error, setError] = useState(null); // Add error state
    const [profileLoading, setProfileLoading] = useState(true); // Add loading state for profile

    useEffect(() => {
        if (session) router.push('/forms');
    }, [session, router]);

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn('google');
        } catch (error) {
            setIsLoading(false);
        }
    };

    const fetchCompanyProfile = async () => {
        setProfileLoading(true);
        setError(null);
        try {
            const data = await getCompanyProfile();
            setCompany(data.data); // Set the company data (object or array, based on API)
        } catch (error) {
            setError('Failed to load company profile');
            setCompany(null); // Reset on error
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyProfile();
    }, []);

    // Construct the full logo URL using the environment variable
    const logoUrl = company?.logo
        ? `${process.env.NEXT_PUBLIC_API_URL}/asset/${company.logo}`
        : null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md">
                {/* Logo Perusahaan */}
                <div className="flex justify-center mb-6">
                    <div className="bg-white p-3 rounded-full shadow-md">
                        {profileLoading ? (
                            <ClipLoader size={20} color="#000000" />
                        ) : company && logoUrl ? (
                            <img
                                src={logoUrl}
                                alt="Company Logo"
                                className="w-16 h-16 object-contain"
                            />
                        ) : (
                            <svg
                                className="w-16 h-16 text-primary"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                            </svg>
                        )}
                    </div>
                </div>

                <Card className="shadow-lg border-0">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">
                            {profileLoading ? 'Loading...' : company?.name || 'Selamat Datang'}
                        </CardTitle>
                        <CardDescription>
                            {error ? error : 'Masuk untuk mengelola undangan digital Anda'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4 pt-4 pb-6">
                        {/* Login dengan Google */}
                        <Button
                            variant="outline"
                            className="w-full py-6 flex items-center justify-center gap-3"
                            onClick={handleSignIn}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <ClipLoader size={20} color="#000000" />
                                    <span>Memproses...</span>
                                </div>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                                            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                                        </g>
                                    </svg>
                                    <span className="font-medium">Masuk dengan Google</span>
                                </>
                            )}
                        </Button>
                        <p className="text-sm text-center text-muted-foreground mt-2">
                            Buat undangan digital dengan mudah dan cepat
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}