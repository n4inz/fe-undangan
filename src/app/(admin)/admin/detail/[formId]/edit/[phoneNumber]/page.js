"use client"
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { BiLeftArrowAlt, BiX } from "react-icons/bi";
import DataPhotoTable from '@/components/DataPhotoTable';


const EditDetailPhoto = ({ params }) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const idFromQuery = searchParams.get("id"); // id asli dari query jika pakai uuid
    const realId = idFromQuery || params.formId; // fallback ke params jika tidak ada

    const [uploading, setUploading] = useState(false);
    const [mounted, setMounted] = useState(false); // Track if component is mounted

    useEffect(() => {
        setMounted(true); // Indicate that the component has mounted
    }, []);

    if (!mounted) {
        return <div>Loading...</div>;
    }



    return (
        <>
            <div className="h-10 bg-white border-b w-full"></div>
            <div className="flex min-h-screen mx-4">
                {/* Sidebar */}
                <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden">
                    {/* <Sidebar /> */}
                </div>

                {/* Main Content */}
                <div className="flex flex-col flex-grow w-full md:pl-24">
                    <div className="flex">
                        <Button
                            onClick={() => {
                                router.push(`/admin/detail/${realId}`);
                            }}
                            className="text-center cursor-pointer bg-white" // Add bg-white class
                        >
                            <BiLeftArrowAlt className='w-4 h-4 text-black' />
                        </Button>
                        <div className="p-2">
                            EDIT Detail Photo : ID {realId}
                        </div>
                    </div>

                    <DataPhotoTable params={params} setUploading={setUploading} />
                </div >

            </div >
            </>

    );


}

export default EditDetailPhoto;