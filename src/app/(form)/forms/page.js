"use client";
import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { MessageCircle, Plus } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaMoneyBillWave } from 'react-icons/fa';

export default function Dashboard() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchForms = useCallback(async () => {
        try {
            if (!session?.user?.sessionToken) {
                throw new Error('No session token available');
            }
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-form-customer`, {
                headers: {
                    Authorization: `Bearer ${session.user.sessionToken}`,
                },
            });

            const formData = response.data.form || [];
            const formattedForms = Array.isArray(formData)
                ? formData.map(form => ({
                      ...form,
                      slug: form.linkUndangan
                          ? form.linkUndangan
                          : `${process.env.NEXT_PUBLIC_LINK_UNDANGAN}/${form.slug || ''}`,
                  }))
                : [];
            setForms(formattedForms);
            setError(null);
        } catch (error) {
            console.error('Error fetching forms:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            setError(error.response?.data?.message || 'Failed to load forms');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        const loadData = async () => {
            if (status === "authenticated") {
                try {
                    const { email, sessionToken } = session.user;
                    const userKey = `user-registered-${email}`;
                    const isUserRegistered = localStorage.getItem(userKey);

                    if (!isUserRegistered) {
                        // Mark user as registered after successful sign-in
                        localStorage.setItem(userKey, 'true');
                    } else {
                        // Check user existence
                        const checkRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/check-user`, {
                            headers: {
                                Authorization: `Bearer ${sessionToken}`,
                            },
                            validateStatus: () => true,
                        });

                        if (checkRes.status === 404) {
                            console.error('User check failed: User not found');
                            setError('User not found');
                            await signOut({ redirect: false });
                            router.push("/");
                            setLoading(false);
                            return;
                        } else if (checkRes.status !== 200) {
                            console.error('User check failed:', checkRes.data);
                            setError(`User check failed: ${checkRes.data.message || 'Unknown error'}`);
                            await signOut({ redirect: false });
                            router.push("/");
                            setLoading(false);
                            return;
                        }
                    }

                    await fetchForms();
                } catch (err) {
                    console.error('Error in loadData:', {
                        message: err.message,
                        status: err.response?.status,
                        data: err.response?.data,
                    });
                    setError(err.response?.data?.message || 'An unexpected error occurred');
                    await signOut({ redirect: false });
                    router.push("/");
                    setLoading(false);
                }
            } else if (status === "unauthenticated") {
                router.push("/");
                setLoading(false);
            }
        };

        loadData();
    }, [status, session, router, fetchForms]);

    useEffect(() => {
        if (!loading) {
            console.log("Forms data:", forms);
        }
    }, [forms, loading]);

    if (loading) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            <div className="fixed inset-0 bg-gray-100" />
            <div className="relative z-10 flex flex-col items-center justify-start min-h-screen py-8">
                <div className="w-full max-w-md bg-white rounded-lg shadow-sm">
                    <header className="border-b bg-background p-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-xl font-bold">Undangan Saya</h1>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={session?.user?.image || undefined} />
                                            <AvatarFallback>
                                                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {session?.user?.name || 'User'}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {session?.user?.email || ''}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile">Profile</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => signOut()}>
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>
                    <main className="p-4">
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                                {error}
                            </div>
                        )}
                        <Button className="w-full mb-6" asChild>
                            <Link href="/forms/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Undangan Baru
                            </Link>
                        </Button>
                        <div className="space-y-4">
                            {forms.length > 0 ? (
                                forms.map((form) => (
                                    <Card key={form.id} className="relative hover:shadow-md transition-shadow">
                                        {form.isPaid === 1 && (
                                            <FaMoneyBillWave className="absolute top-2 right-2 text-green-500 text-xl" />
                                        )}
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg">
                                                <Link
                                                    href={`${form.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-black hover:text-blue-600 transition-colors duration-200 underline"
                                                >
                                                    {form.namaPanggilanPria && form.namaPanggilanWanita
                                                        ? `${form.namaPanggilanPria} & ${form.namaPanggilanWanita}`
                                                        : 'Undangan Pernikahan'}
                                                </Link>
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                {form.pilihanTema && `Tema: ${form.pilihanTema}`}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Dibuat: {new Date(form.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex items-center text-muted-foreground">
                                                <MessageCircle className="h-4 w-4 mr-2" />
                                                <span>{form.commentCount || 0} komentar</span>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-between bg-muted/50 p-4">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/forms/${form.id}/${form.nomorWa}/comments`}>Lihat Komentar</Link>
                                            </Button>
                                            <Button variant="default" size="sm" asChild>
                                                <Link href={`/forms/${form.id}/${form.nomorWa}/atur-foto/success/result`}>Edit</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">Belum ada undangan yang dibuat</p>
                                    <Button variant="link" asChild>
                                        <Link href="/forms/new">Buat undangan pertama Anda</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}