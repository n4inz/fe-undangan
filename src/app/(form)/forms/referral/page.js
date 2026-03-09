"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReferralDashboard from "@/components/ReferralDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ReferralPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-6">
            <div className="mb-6">
                <Button variant="ghost" asChild className="pl-0 hover:pl-2 transition-all">
                    <Link href="/forms">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Undangan Saya
                    </Link>
                </Button>
            </div>

            <ReferralDashboard />
        </div>
    );
}
