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

    // Handle session and fetch forms data
    const fetchForms = useCallback(async (token) => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-form-customer`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const formData = response.data.form || [];
            setForms(
                Array.isArray(formData)
                    ? formData.map(form => ({
                        ...form,
                        slug: form.linkUndangan
                            ? form.linkUndangan
                            : `${process.env.NEXT_PUBLIC_LINK_UNDANGAN}/${form.slug || ''}`
                    }))
                    : []
            );
        } catch (error) {
            console.error('Error fetching forms:', error);
            router.push("/");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (status === "authenticated") {
            const { name, email, image: avatar } = session.user;
            const { accessToken } = session;

            axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/login-customer`,
                { name, email, avatar },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    validateStatus: () => true, // allow handling all status codes
                }
            )
                .then(async (res) => {
                    if (res.status !== 200) {
                        // Remove next-auth cookies and redirect
                        await signOut({ redirect: false });
                        router.push("/");
                    } else {
                        fetchForms(accessToken);
                    }
                })
                .catch(async (err) => {
                    console.error("Gagal simpan user:", err);
                    await signOut({ redirect: false });
                    router.push("/");
                    setLoading(false);
                });
        } else if (status === "unauthenticated") {
            router.push("/");
        }
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
            {/* Background Container */}
            <div className="fixed inset-0 bg-gray-100" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-start min-h-screen py-8">
                {/* Container with max-width */}
                <div className="w-full max-w-md bg-white rounded-lg shadow-sm">
                    {/* Top Bar */}
                    <header className="border-b bg-background p-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-xl font-bold">Undangan Saya</h1>

                            {/* Avatar Dropdown */}
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

                    {/* Main Content */}
                    <main className="p-4">
                        {/* Create Invitation Button */}
                        <Button className="w-full mb-6" asChild>
                            <Link href="/forms/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Undangan Baru
                            </Link>
                        </Button>

                        {/* Single Column Card List */}
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