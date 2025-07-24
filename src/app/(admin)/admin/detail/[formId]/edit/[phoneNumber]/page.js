"use client"
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
// import { XMarkIcon } from '@heroicons/react/24/solid';
import { BiLeftArrowAlt, BiX } from "react-icons/bi";
import DataPhotoTable from '@/components/DataPhotoTable';


const EditDetailPhoto = ({ params }) => {

    const router = useRouter();


    const [mounted, setMounted] = useState(false); // Track if component is mounted


    // const handleRekeningChange = (e, index) => {
    //     const { name, value } = e.target;
    //     const updatedRekening = [...formData.rekening];
    //     updatedRekening[index] = { ...updatedRekening[index], [name]: value };
    //     setFormData({ ...formData, rekening: updatedRekening });
    // };

    // Add new rekening entry


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
                                router.push(`/admin/detail/${params.formId}`);
                            }}
                            className="text-center cursor-pointer bg-white" // Add bg-white class
                        >
                            <BiLeftArrowAlt className='w-4 h-4 text-black' />
                        </Button>
                        <div className="p-2">
                            EDIT Detail Photo : ID {params.formId}
                        </div>
                    </div>

                    <DataPhotoTable params={params} />
                </div >
                
            </div >
        </>
    );


}

export default EditDetailPhoto;