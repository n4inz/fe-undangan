"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Loader2, DollarSign, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import WithdrawalModal from "./WithdrawalModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReferralDashboard() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [referralData, setReferralData] = useState({
        code: "",
        link: "",
        totalCommission: 0,
        totalTransactions: 0,
    });
    const [commissions, setCommissions] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [withdrawals, setWithdrawals] = useState([]);
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

    useEffect(() => {
        if (session?.user?.sessionToken) {
            fetchReferralData();
            fetchCommissions(1);
            fetchWithdrawalHistory();
        }
    }, [session]);

    const fetchWithdrawalHistory = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/referral/withdrawal/my`, {
                headers: { Authorization: `Bearer ${session.user.sessionToken}` },
            });
            setWithdrawals(res.data);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
        }
    };

    const fetchReferralData = async () => {
        try {
            const [codeRes, totalRes] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/referral/my-code`, {
                    headers: { Authorization: `Bearer ${session.user.sessionToken}` },
                }),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/referral/my-total`, {
                    headers: { Authorization: `Bearer ${session.user.sessionToken}` },
                }),
            ]);

            setReferralData({
                code: codeRes.data.referralCode,
                link: codeRes.data.referralLink,
                totalCommission: totalRes.data.totalCommission,
                totalTransactions: totalRes.data.totalTransactions,
            });
        } catch (error) {
            console.error("Error fetching referral data:", error);
            toast({
                variant: "destructive",
                title: "Gagal memuat data referral",
                description: error.response?.data?.message || "Terjadi kesalahan pada server.",
            });
        }
    };

    const fetchCommissions = async (pageNum) => {
        try {
            setLoading(true);
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/referral/my-commissions?page=${pageNum}&limit=10`, {
                headers: { Authorization: `Bearer ${session.user.sessionToken}` },
            });

            setCommissions(res.data.data);
            setPage(res.data.page);
            setTotalPages(res.data.pageCount);
        } catch (error) {
            console.error("Error fetching commissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (referralData.link) {
            navigator.clipboard.writeText(referralData.link);
            toast({
                title: "Link disalin!",
                description: "Bagikan link ini ke teman Anda.",
            });
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleGenerateCode = async () => {
        setGenerating(true);
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/referral/generate`,
                {},
                { headers: { Authorization: `Bearer ${session.user.sessionToken}` } }
            );

            setReferralData((prev) => ({
                ...prev,
                code: res.data.referralCode,
                link: res.data.referralLink,
            }));

            toast({
                title: "Berhasil!",
                description: "Kode referral Anda telah dibuat.",
            });

            // Update localStorage so form creation knows about it
            localStorage.setItem('referralCode', res.data.referralCode);
        } catch (error) {
            console.error("Error generating code:", error);
            toast({
                variant: "destructive",
                title: "Gagal membuat kode",
                description: error.response?.data?.message || "Terjadi kesalahan.",
            });
        } finally {
            setGenerating(false);
        }
    };

    if (!session) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Referral Dashboard</h2>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Referral Link Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Link Referral Anda</CardTitle>
                        <Copy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {referralData.link ? (
                            <div className="flex flex-col space-y-3">
                                <div className="bg-muted p-2 rounded-md border">
                                    <code className="block font-mono text-xs font-semibold break-all whitespace-pre-wrap">
                                        {referralData.link}
                                    </code>
                                </div>
                                <Button size="sm" onClick={copyToClipboard} className="w-full">
                                    <Copy className="mr-2 h-4 w-4" />
                                    Salin Link
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Anda belum memiliki kode referral. Klik tombol di bawah untuk membuatnya.
                                </p>
                                <Button size="sm" onClick={handleGenerateCode} disabled={generating} className="w-full">
                                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                                    Generate Kode Referral
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Total Commission Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Tersedia</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(referralData.totalCommission)}</div>
                        <div className="flex flex-col mt-2 gap-2">
                            <p className="text-xs text-muted-foreground">
                                Dari {referralData.totalTransactions} transaksi berhasil
                            </p>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="w-full"
                                disabled={referralData.totalCommission < 20000}
                                onClick={() => setIsWithdrawalModalOpen(true)}
                            >
                                Tarik Komisi
                            </Button>
                            {referralData.totalCommission < 20000 && (
                                <p className="text-[10px] text-red-500 italic text-center">
                                    Minimal penarikan Rp 20.000
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status Akun</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Aktif</div>
                        <p className="text-xs text-muted-foreground">
                            Referral Code: <span className="font-mono font-bold">{referralData.code}</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* History Tabs */}
            <Tabs defaultValue="commissions" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="commissions">Riwayat Komisi</TabsTrigger>
                    <TabsTrigger value="withdrawals">Riwayat Penarikan</TabsTrigger>
                </TabsList>

                <TabsContent value="commissions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Riwayat Komisi</CardTitle>
                            <CardDescription>Daftar komisi yang Anda dapatkan dari undangan yang berhasil.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : commissions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Belum ada riwayat komisi.</div>
                            ) : (
                                <div className="overflow-x-auto -mx-2 sm:mx-0">
                                    <div className="min-w-[600px] p-2 sm:p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tanggal</TableHead>
                                                    <TableHead>Dari Undangan</TableHead>
                                                    <TableHead>Komisi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {commissions.map((comm) => (
                                                    <TableRow key={comm.id}>
                                                        <TableCell className="whitespace-nowrap">
                                                            {new Date(comm.createdAt).toLocaleDateString("id-ID", {
                                                                day: "numeric", month: "long", year: "numeric"
                                                            })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">{comm.form.namaPanggilanPria} & {comm.form.namaPanggilanWanita}</div>
                                                            <div className="text-xs text-muted-foreground">{comm.form.name}</div>
                                                        </TableCell>
                                                        <TableCell className="font-bold text-green-600 whitespace-nowrap">
                                                            +{formatCurrency(comm.amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
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
                </TabsContent>

                <TabsContent value="withdrawals">
                    <Card>
                        <CardHeader>
                            <CardTitle>Riwayat Penarikan</CardTitle>
                            <CardDescription>Daftar permintaan penarikan komisi Anda.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {withdrawals.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Belum ada riwayat penarikan.</div>
                            ) : (
                                <div className="overflow-x-auto -mx-2 sm:mx-0">
                                    <div className="min-w-[800px] p-2 sm:p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tanggal</TableHead>
                                                    <TableHead>Jumlah</TableHead>
                                                    <TableHead>Metode</TableHead>
                                                    <TableHead>Detail Akun</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {withdrawals.map((w) => (
                                                    <TableRow key={w.id}>
                                                        <TableCell className="whitespace-nowrap">
                                                            {new Date(w.createdAt).toLocaleDateString("id-ID", {
                                                                day: "numeric", month: "long", year: "numeric"
                                                            })}
                                                        </TableCell>
                                                        <TableCell className="font-bold whitespace-nowrap">{formatCurrency(w.amount)}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{w.method === "BANK" ? "Bank" : "E-Wallet"}</TableCell>
                                                        <TableCell>
                                                            <div className="text-sm font-medium">{w.accountNumber}</div>
                                                            <div className="text-xs text-muted-foreground">{w.accountName} {w.bankName ? `(${w.bankName})` : ""}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={
                                                                w.status === "APPROVED" ? "success" :
                                                                    w.status === "REJECTED" ? "destructive" : "warning"
                                                            }>
                                                                {w.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <WithdrawalModal
                isOpen={isWithdrawalModalOpen}
                onClose={() => setIsWithdrawalModalOpen(false)}
                balance={referralData.totalCommission}
                sessionToken={session.user.sessionToken}
                onRefresh={() => {
                    fetchReferralData();
                    fetchWithdrawalHistory();
                }}
            />
            <Toaster />
        </div>
    );
}
