"use client";

import ReferralDashboard from "@/components/ReferralDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReferralPage() {
    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
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
