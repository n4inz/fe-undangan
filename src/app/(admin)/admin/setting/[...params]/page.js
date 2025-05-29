'use client';
import React, { useState, useEffect } from "react";
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { themeSchema } from '@/lib/validation';
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import CompanyProfileForm from "./companyProfile";
import BankAccountForm from "./bankAccount";

const EditSetting = ({ params }) => {
    const router = useRouter();
    const [formData, setFormData] = useState({
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    useEffect(() => {
        console.log(params); // ['edit', 'company']
    }
        , [params, router]);
    return (
        <>
            <div className="h-10 bg-white border-b w-full"></div>
            <div className="flex min-h-screen mx-4">
                <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden"></div>
                <div className="flex flex-col flex-grow w-full md:pl-24">
                    <h1 className="my-4">
                        {params?.params?.[1] === "company"
                            ? "Company Profile"
                            : "Rekening Saya"}
                    </h1>
                    {params?.params?.[1] === "company"
                        ? <CompanyProfileForm />
                        : <BankAccountForm />
                    }
                </div>
            </div>
        </>
    );
}

export default EditSetting;
