"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Baby, Heart, Loader2, MessageCircle, Plus, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { getCompanyProfile, getBankAccounts } from '@/lib/company'; // Import getBankAccounts
import PaymentModal from './[formId]/[phoneNumber]/atur-foto/success/paymentModal';
import PaymentModalAk from './aqiqah-khitan/[formId]/atur-foto/success/PaymentModalAk';
import { BiCopyAlt, BiDotsVertical, BiShareAlt } from 'react-icons/bi';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/toaster';
import LoadingOverlay from 'react-loading-overlay-ts'

const FORM_PAGE_LIMIT = 5;

export default function Dashboard() {
    const router = useRouter();

    const searchParams = useSearchParams();
    const qs = searchParams?.toString() ?? '';
    const qsWithPrefix = qs ? `?${qs}` : '';

    const { data: session, status } = useSession();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [company, setCompany] = useState(null); // State for company profile
    const [bankAccounts, setBankAccounts] = useState([]); // State for bank accounts
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreTriggerRef = useRef(null);
    const isFetchingMoreRef = useRef(false);


    const fetchForms = useCallback(async (page = 1, { append = false } = {}) => {
        const isNextPage = page > 1;

        if (isNextPage) {
            if (isFetchingMoreRef.current) return;
            isFetchingMoreRef.current = true;
            setIsLoadingMore(true);
        }

        try {
            if (!session?.user?.sessionToken) {
                throw new Error('No session token available');
            }
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-form-customer`, {
                params: {
                    page,
                    limit: FORM_PAGE_LIMIT,
                },
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

            setForms((currentForms) => {
                if (!append) return formattedForms;

                const existingKeys = new Set(
                    currentForms.map(
                        (form) => `${form.invitationType || "wedding"}-${form.id}`
                    )
                );
                const newForms = formattedForms.filter(
                    (form) =>
                        !existingKeys.has(
                            `${form.invitationType || "wedding"}-${form.id}`
                        )
                );

                return [...currentForms, ...newForms];
            });

            const pagination = response.data.pagination;
            setCurrentPage(pagination?.page || page);
            setHasMore(
                typeof pagination?.hasMore === "boolean"
                    ? pagination.hasMore
                    : formattedForms.length === FORM_PAGE_LIMIT
            );
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
            if (isNextPage) {
                isFetchingMoreRef.current = false;
                setIsLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    }, [session]);

    const loadNextPage = useCallback(() => {
        if (!hasMore || isFetchingMoreRef.current) return;

        fetchForms(currentPage + 1, { append: true }).catch((loadError) => {
            console.error("Error loading more forms:", loadError);
        });
    }, [currentPage, fetchForms, hasMore]);

    useEffect(() => {
        const trigger = loadMoreTriggerRef.current;

        if (!trigger || !hasMore || loading) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    loadNextPage();
                }
            },
            {
                rootMargin: "300px 0px",
            }
        );

        observer.observe(trigger);

        return () => observer.disconnect();
    }, [hasMore, loadNextPage, loading]);

    const handleDuplicate = async (formId, phoneNumber) => {
        try {
            setIsDuplicating(true); // tampilkan overlay

            if (!session?.user?.sessionToken) {
                throw new Error("No session token available");
            }

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/forms/${formId}/${phoneNumber}/duplicate`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${session.user.sessionToken}`,
                    },
                }
            );

            toast({
                title: "Berhasil",
                description: "Undangan berhasil diduplikat.",
            });

            // Refresh daftar form
            await fetchForms(1);
        } catch (error) {
            console.error("Error duplicating form:", error.response?.data || error.message);
            toast({
                title: "Gagal",
                description: error.response?.data?.message || "Gagal menduplikat undangan.",
                variant: "destructive",
            });
        } finally {
            setIsDuplicating(false); // sembunyikan overlay
        }
    };

    const handleShare = (slug) => {
        // Encode slug untuk menghindari karakter khusus

        // Buat URL dengan parameter yang diencode
        const shareUrl = `/share?uri=${slug}`;

        // Navigasi ke halaman share
        router.push(shareUrl);
    };

    useEffect(() => {
        const loadData = async () => {
            if (status === "authenticated") {
                try {
                    const { email, sessionToken } = session.user;
                    const userKey = `user-registered-${email}`;
                    const isUserRegistered = localStorage.getItem(userKey);

                    if (!isUserRegistered) {
                        localStorage.setItem(userKey, 'true');
                    }

                    // Capture referral code if present in URL
                    const refCode = searchParams.get('ref');
                    if (refCode) {
                        localStorage.setItem('referralCode', refCode);
                    }

                    if (isUserRegistered) { // Check valid user only if registered
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

                    // Fetch company profile and bank accounts
                    try {
                        const [companyData, bankData] = await Promise.all([
                            getCompanyProfile(),
                            getBankAccounts(),
                        ]);
                        setCompany(companyData.data || null);
                        setBankAccounts(bankData.data || []);
                    } catch (error) {
                        toast({
                            title: 'Error',
                            description: 'Failed to load company profile or bank accounts.',
                            variant: 'destructive',
                        });
                        setCompany(null);
                        setBankAccounts([]);
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
    }, [status, session, router, fetchForms, searchParams]);

    // useEffect(() => {
    //     if (!loading) {
    //         console.log("Forms data:", forms);
    //         console.log("Company data:", company);
    //         console.log("Bank accounts:", bankAccounts);
    //     }
    // }, [forms, loading, company, bankAccounts]);

    if (loading) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const buttonContainerClasses = "absolute top-2 right-2 z-10";
    const linkButtonClasses = "flex items-center gap-1 px-2 py-1 text-xs h-7";

    return (
        <LoadingOverlay
            active={isDuplicating}
            spinner
            text="Sedang menduplikat undangan...">
            <div className="relative min-h-screen">
                <Toaster className="z-50" />
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-lg">
                        <DialogHeader>
                            <DialogTitle>Pilih Jenis Undangan</DialogTitle>
                            <DialogDescription>
                                Pilih jenis undangan yang ingin Anda buat.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="h-auto justify-start gap-3 whitespace-normal p-4 text-left"
                                asChild
                            >
                                <Link
                                    href={`/forms/new${qsWithPrefix}`}
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    <span className="rounded-full bg-rose-100 p-2 text-rose-700">
                                        <Heart className="h-5 w-5" />
                                    </span>
                                    <span>
                                        <span className="block font-semibold">
                                            Buat Undangan Pernikahan
                                        </span>
                                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                            Lanjutkan ke form undangan pernikahan.
                                        </span>
                                    </span>
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto justify-start gap-3 whitespace-normal p-4 text-left"
                                asChild
                            >
                                <Link
                                    href={`/forms/aqiqah-khitan/new${qsWithPrefix}`}
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    <span className="rounded-full bg-sky-100 p-2 text-sky-700">
                                        <Baby className="h-5 w-5" />
                                    </span>
                                    <span>
                                        <span className="block font-semibold">
                                            Buat Undangan Aqiqah / Khitan
                                        </span>
                                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                            Lanjutkan ke form acara Aqiqah atau Khitan.
                                        </span>
                                    </span>
                                </Link>
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
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
                                            <Link href="/forms/referral" className="cursor-pointer w-full">
                                                Referral
                                            </Link>
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
                            <Button
                                className="w-full mb-6"
                                onClick={() => setIsCreateDialogOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Undangan Baru
                            </Button>
                            <div className="space-y-4">
                                {forms.length > 0 ? (
                                    forms.map((form) => {
                                        const isAqiqahKhitan = form.invitationType === "aqiqah-khitan";
                                        const formTitle = isAqiqahKhitan
                                            ? [form.namaAcara, form.namaPanggilanAnak].filter(Boolean).join(" - ") ||
                                              "Undangan Aqiqah / Khitan"
                                            : form.namaPanggilanPria && form.namaPanggilanWanita
                                              ? `${form.namaPanggilanPria} & ${form.namaPanggilanWanita}`
                                              : "Undangan Pernikahan";
                                        const photoPath = isAqiqahKhitan
                                            ? `/forms/aqiqah-khitan/${form.id}/atur-foto`
                                            : `/forms/${form.id}/${form.nomorWa || ""}/atur-foto`;
                                        const resultPath = isAqiqahKhitan
                                            ? `/forms/aqiqah-khitan/${form.id}/atur-foto/success/result`
                                            : `/forms/${form.id}/${form.nomorWa || ""}/atur-foto/success/result`;

                                        return (
                                            <Card
                                                key={`${form.invitationType || "wedding"}-${form.id}`}
                                                className="relative hover:shadow-md transition-shadow"
                                            >
                                                {form.isPaid === 1 ? (
                                                    <div className="absolute top-2 right-2 z-10">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <BiDotsVertical className="h-5 w-5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {!isAqiqahKhitan && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDuplicate(form.id, form.nomorWa)}
                                                                    >
                                                                        <BiCopyAlt className="mr-2" /> Duplikat Undangan
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem onClick={() => handleShare(form.slug)}>
                                                                    <BiShareAlt className="mr-2" /> Bagikan Undangan
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                ) : (
                                                    <div className="absolute top-2 right-2 z-10">
                                                        {isAqiqahKhitan ? (
                                                            <PaymentModalAk
                                                                formId={form.id}
                                                                isPaid={form.isPaid}
                                                                buttonClassName="text-xs"
                                                            />
                                                        ) : (
                                                            <PaymentModal
                                                                formId={form.id}
                                                                phoneNumber={form.nomorWa || ""}
                                                                buttonClassName="text-xs"
                                                                company={company}
                                                                bankAccounts={bankAccounts}
                                                            />
                                                        )}
                                                    </div>
                                                )}

                                                <CardHeader className="pb-2">
                                                    <CardTitle className="flex flex-wrap items-center gap-2 pr-20 text-base font-semibold">
                                                        <Link
                                                            href={form.slug}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-black underline transition-colors hover:text-blue-600"
                                                        >
                                                            {formTitle}
                                                        </Link>
                                                        {form.isPaid === 1 && (
                                                            <Badge className="bg-green-500">Lunas</Badge>
                                                        )}
                                                    </CardTitle>
                                                    {isAqiqahKhitan && (
                                                        <Badge variant="secondary" className="w-fit">
                                                            Aqiqah / Khitan
                                                        </Badge>
                                                    )}
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {form.pilihanTema && `Tema: ${form.pilihanTema}`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Dibuat:{" "}
                                                        {new Date(form.createdAt).toLocaleDateString("id-ID", {
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                        })}
                                                    </p>
                                                </CardHeader>

                                                <CardContent className="pt-0">
                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                        {isAqiqahKhitan ? (
                                                            <>
                                                                <Baby className="mr-2 h-4 w-4" />
                                                                <span>{form.namaAcara || "Aqiqah / Khitan"}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <MessageCircle className="mr-2 h-4 w-4" />
                                                                <span>{form.commentCount || 0} ucapan</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </CardContent>

                                                <CardFooter className="flex flex-wrap justify-between gap-2 bg-muted/50 p-4 sm:flex-nowrap">
                                                    {!isAqiqahKhitan && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="w-full sm:w-auto"
                                                        >
                                                            <Link href={`/forms/${form.id}/${form.nomorWa || ""}/comments`}>
                                                                <MessageCircle className="h-4 w-4" /> Lihat Ucapan
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <div className="flex w-full justify-end gap-2 sm:w-auto">
                                                        {form.isPaid === 1 && (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleShare(form.slug)}
                                                                className="flex items-center"
                                                            >
                                                                <BiShareAlt className="mr-1 h-4 w-4" />
                                                                Bagikan
                                                            </Button>
                                                        )}
                                                        <Button variant="secondary" size="sm" asChild>
                                                            <Link href={photoPath}>
                                                                <RefreshCw className="mr-1 h-4 w-4" />
                                                                Atur Foto
                                                            </Link>
                                                        </Button>
                                                        <Button variant="default" size="sm" asChild>
                                                            <Link href={resultPath}>Edit</Link>
                                                        </Button>
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">Belum ada undangan yang dibuat</p>
                                        <Button
                                            variant="link"
                                            onClick={() => setIsCreateDialogOpen(true)}
                                        >
                                            Buat undangan pertama Anda
                                        </Button>
                                    </div>
                                )}
                                {forms.length > 0 && hasMore && (
                                    <div
                                        ref={loadMoreTriggerRef}
                                        className="flex min-h-10 items-center justify-center py-2 text-sm text-muted-foreground"
                                        aria-live="polite"
                                    >
                                        {isLoadingMore && (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Memuat undangan berikutnya...
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </LoadingOverlay>
    );
}
