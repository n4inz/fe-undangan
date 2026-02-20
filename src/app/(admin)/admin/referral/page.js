"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function AdminReferral() {
    const { data: session } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        const verifyAdmin = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cek-role`, {
                    withCredentials: true,
                });

                if (res.data.isAdmin !== 1) {
                    toast({
                        variant: "destructive",
                        title: "Access Denied",
                        description: "You must be an admin to access this page.",
                    });
                    router.push("/forms");
                } else {
                    fetchCommissions(1);
                }
            } catch (error) {
                console.error("Error verifying admin status:", error);
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "Unable to verify your role. Please login again.",
                });
                router.push("/login");
            }
        };

        if (session?.user?.sessionToken) {
            verifyAdmin();
        }
    }, [session, router]);

    const fetchCommissions = async (pageNum) => {
        try {
            setLoading(true);
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/referral/all-commissions?page=${pageNum}&limit=10`, {
                withCredentials: true,
            });

            setCommissions(res.data.data);
            setPage(res.data.page);
            setTotalPages(res.data.pageCount);
            setTotalRecords(res.data.total);
        } catch (error) {
            console.error("Error fetching commissions:", error);
            toast({
                variant: "destructive",
                title: "Gagal memuat data",
                description: error.response?.data?.error || "Terjadi kesalahan.",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (!session) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex min-h-screen pt-10">
            {/* Sidebar Offset (Mirroring other admin pages) */}
            <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden" />

            {/* Main Content */}
            <div className="flex flex-col flex-grow w-full md:pl-24">
                <div className="container max-w-6xl mx-auto py-8 px-4">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold tracking-tight">Referral Commissions</h1>
                        {/* Placeholder for export button if needed */}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Komisi Referral</CardTitle>
                            <CardDescription>
                                Total {totalRecords} transaksi komisi tercatat.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : commissions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Belum ada data komisi.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Referrer</TableHead>
                                            <TableHead>Dari Undangan</TableHead>
                                            <TableHead>Nilai Form</TableHead>
                                            <TableHead>Persentase</TableHead>
                                            <TableHead className="text-right">Komisi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {commissions.map((comm, index) => (
                                            <TableRow key={comm.id}>
                                                <TableCell>{(page - 1) * 10 + index + 1}</TableCell>
                                                <TableCell>
                                                    {new Date(comm.createdAt).toLocaleDateString("id-ID", {
                                                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{comm.referrer.name}</div>
                                                    <div className="text-xs text-muted-foreground">{comm.referrer.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{comm.form.namaPanggilanPria} & {comm.form.namaPanggilanWanita}</div>
                                                    <div className="text-xs text-muted-foreground">{comm.form.name}</div>
                                                </TableCell>
                                                <TableCell>{formatCurrency(comm.formPaymentAmount)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{comm.referralPercentage}%</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-green-600">
                                                    {formatCurrency(comm.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-end space-x-2 py-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchCommissions(page - 1)}
                                        disabled={page <= 1}
                                    >
                                        Previous
                                    </Button>
                                    <div className="text-sm">
                                        Page {page} of {totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchCommissions(page + 1)}
                                        disabled={page >= totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
