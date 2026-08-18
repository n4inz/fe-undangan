"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { BiArrowBack } from "react-icons/bi";
import { CalendarDays, UserCheck, Users, UserX } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const getStatusDetails = (status) => {
    if (Number(status) === 1) {
        return {
            label: "Hadir",
            icon: UserCheck,
            className: "bg-green-100 text-green-800",
        };
    }

    return {
        label: "Tidak hadir",
        icon: UserX,
        className: "bg-red-100 text-red-800",
    };
};

const formatDate = (dateString) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

export default function RsvpPage({ params }) {
    const [rsvpEntries, setRsvpEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRsvp = async () => {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/rsvp/${params.formId}/${params.phoneNumber}`
                );
                setRsvpEntries(response.data.form?.rsvp || []);
            } catch (err) {
                setError(err.response?.data?.message || "Gagal mengambil data RSVP");
            } finally {
                setLoading(false);
            }
        };

        fetchRsvp();
    }, [params.formId, params.phoneNumber]);

    const summary = useMemo(() => {
        return rsvpEntries.reduce(
            (result, entry) => {
                if (Number(entry.status) === 1) {
                    result.attending += 1;
                    result.guests += entry.totalGuest;
                } else {
                    result.notAttending += 1;
                }

                return result;
            },
            { attending: 0, notAttending: 0, guests: 0 }
        );
    }, [rsvpEntries]);

    const resultUrl = `/forms/${params.formId}/${params.phoneNumber}/atur-foto/success/result`;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 py-8">
                <div className="mx-auto w-full max-w-xl px-4">
                    <Card>
                        <CardHeader className="space-y-3 border-b">
                            <Skeleton className="h-7 w-40" />
                            <Skeleton className="h-16 w-full" />
                        </CardHeader>
                        <CardContent className="space-y-4 p-4">
                            {[...Array(3)].map((_, index) => (
                                <Skeleton key={index} className="h-24 w-full" />
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center p-6 text-center">
                        <p className="mb-4 font-medium text-red-600">{error}</p>
                        <Link href={resultUrl} className="flex items-center gap-2 text-blue-600 hover:underline">
                            <BiArrowBack className="h-5 w-5" />
                            Kembali
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="mx-auto w-full max-w-xl px-4">
                <Card>
                    <CardHeader className="border-b">
                        <div className="mb-4 flex items-center">
                            <Link href={resultUrl} className="mr-4" aria-label="Kembali ke daftar foto">
                                <BiArrowBack className="h-8 w-8" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-semibold">Daftar RSVP</h1>
                                <p className="text-sm text-gray-500">{rsvpEntries.length} respons tamu</p>
                            </div>
                        </div>

                        {rsvpEntries.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                <div className="rounded-lg bg-green-50 p-3 text-green-800">
                                    <UserCheck className="mx-auto mb-1 h-5 w-5" />
                                    <div className="font-semibold">{summary.attending}</div>
                                    <div className="text-xs">Hadir</div>
                                </div>
                                <div className="rounded-lg bg-blue-50 p-3 text-blue-800">
                                    <Users className="mx-auto mb-1 h-5 w-5" />
                                    <div className="font-semibold">{summary.guests}</div>
                                    <div className="text-xs">Total tamu</div>
                                </div>
                                <div className="rounded-lg bg-red-50 p-3 text-red-800">
                                    <UserX className="mx-auto mb-1 h-5 w-5" />
                                    <div className="font-semibold">{summary.notAttending}</div>
                                    <div className="text-xs">Tidak hadir</div>
                                </div>
                            </div>
                        )}
                    </CardHeader>

                    <CardContent className="p-0">
                        {rsvpEntries.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">Belum ada data RSVP</div>
                        ) : (
                            <ul className="divide-y">
                                {rsvpEntries.map((entry) => {
                                    const status = getStatusDetails(entry.status);
                                    const StatusIcon = status.icon;

                                    return (
                                        <li key={entry.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <h2 className="truncate font-medium">{entry.name || "Tanpa nama"}</h2>
                                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            {entry.totalGuest} tamu
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="h-4 w-4" />
                                                            {formatDate(entry.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
