'use client';
import { useState, useEffect } from 'react'
import { toast } from '@/components/ui/use-toast';

import DataTableForm from "@/components/DataTableForm";

const MyList = () => {

    const [isClient, setIsClient] = useState(false)

    const handleUpdate = (msg) => {
        toast({
            description: msg,
        })
    }

    useEffect(() => {
        setIsClient(true)
    }, [])

    return (
        <>
            <div className="h-10 fixed bg-white border-b w-full"></div>
            <div className="flex min-h-screen pt-10">
                {/* Sidebar */}
                <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden">
                    {/* <Sidebar /> */}
                </div>

                {/* Main Content */}
                <div className="flex flex-col flex-grow w-full xl:pl-24">
                    <div className="p-4">
                        <div className="py-4">
                            My List
                        </div>
                        {isClient ? <DataTableForm initialStatus={1} onDataUpdate={handleUpdate} /> : ''}
                    </div>
                </div>
            </div>
        </>
    );
}

export default MyList;


