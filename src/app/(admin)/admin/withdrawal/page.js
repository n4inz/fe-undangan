"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WithdrawalManagement() {
    const { data: session } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null); // ID of request being updated

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
                    fetchWithdrawals();
                }
            } catch (error) {
                console.error("Error verifying admin status:", error);
                router.push("/login");
            }
        };

        if (session?.user?.sessionToken) {
            verifyAdmin();
        }
    }, [session, router]);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/referral/withdrawal/all`, {
                headers: { Authorization: `Bearer ${session.user.sessionToken}` },
                withCredentials: true
            });
            setWithdrawals(res.data);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
            toast({
                variant: "destructive",
                title: "Gagal memuat data",
                description: "Terjadi kesalahan saat mengambil riwayat penarikan.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status, currentStatus) => {
        if (status === currentStatus) return;
        if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${status}?`)) return;

        setUpdating(id);
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/referral/withdrawal/update-status`,
                { id, status },
                {
                    headers: { Authorization: `Bearer ${session.user.sessionToken}` },
                    withCredentials: true
                }
            );

            toast({
                title: "Berhasil",
                description: `Penarikan telah ${status === "APPROVED" ? "disetujui" : "ditolak"}.`,
            });

            fetchWithdrawals();
        } catch (error) {
            console.error("Error updating withdrawal status:", error);
            toast({
                variant: "destructive",
                title: "Gagal",
                description: error.response?.data?.message || "Terjadi kesalahan saat mengupdate status.",
            });
        } finally {
            setUpdating(null);
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
            {/* Sidebar Offset */}
            <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden" />

            {/* Main Content */}
            <div className="flex flex-col flex-grow w-full md:pl-24">
                <div className="container max-w-6xl mx-auto py-8 px-4">
                    <div className="flex justify-between items-center mb-6">
                        <p className="font-bold tracking-tight">Manajemen Penarikan</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Permintaan Penarikan</CardTitle>
                            <CardDescription>
                                Kelola permintaan pencairan komisi referral dari user.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : withdrawals.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Belum ada permintaan penarikan.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Jumlah</TableHead>
                                            <TableHead>Metode</TableHead>
                                            <TableHead>Detail Rekening</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {withdrawals.map((w, index) => (
                                            <TableRow key={w.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    {new Date(w.createdAt).toLocaleDateString("id-ID", {
                                                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{w.user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{w.user.email}</div>
                                                </TableCell>
                                                <TableCell className="font-bold">{formatCurrency(w.amount)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{w.method}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium">{w.accountNumber}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {w.accountName} {w.bankName ? `(${w.bankName})` : ""}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        defaultValue={w.status}
                                                        onValueChange={(value) => handleUpdateStatus(w.id, value, w.status)}
                                                        disabled={updating === w.id}
                                                    >
                                                        <SelectTrigger className="w-[130px]">
                                                            <SelectValue>
                                                                <Badge variant={
                                                                    w.status === "APPROVED" ? "success" :
                                                                        w.status === "REJECTED" ? "destructive" : "warning"
                                                                }>
                                                                    {w.status}
                                                                </Badge>
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="PENDING">PENDING</SelectItem>
                                                            <SelectItem value="APPROVED">APPROVED</SelectItem>
                                                            <SelectItem value="REJECTED">REJECTED</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {updating === w.id && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
