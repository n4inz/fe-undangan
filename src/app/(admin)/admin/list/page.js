'use client';
import { useState, useEffect } from 'react'
import { toast } from '@/components/ui/use-toast';

import DataTableForm from "@/components/DataTableForm";

const List = () => {

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
                <div
                    aria-hidden="true"
                    className="hidden h-full w-[300px] shrink-0 xl:block"
                >
                    {/* <Sidebar /> */}
                </div>
                {/* Main Content */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="min-w-0 p-4">
                        <div className="py-4">
                            List
                        </div>
                        {isClient ? <DataTableForm initialStatus={0} onDataUpdate={handleUpdate} /> : ''}
                    </div>
                </div>
            </div>
        </>
    );
}

export default List;


