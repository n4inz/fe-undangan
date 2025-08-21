"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BiEnvelope, BiPhone, BiArrowBack, BiEdit, BiCrop } from "react-icons/bi";
import { useRouter } from 'next/navigation';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Button } from '@/components/ui/button';
import { DialogModalForm } from '@/components/DialogModalForm';
import { checkForm } from '@/utils/checkForm';
import ImageEditor from '@/components/atur-foto/ImageEditor';
import { FaTimes, FaWhatsapp } from 'react-icons/fa';
import DataPhotoTable from '@/components/DataPhotoTable';
import LoadingOverlay from 'react-loading-overlay-ts'; // Import LoadingOverlay

const Result = ({ params }) => {
    const router = useRouter();
    const contactUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER}?text=Halo,%0ASaya%20ingin%20memesan%20undangan%20dengan%20kode%20id%20:%20${params.formId}`;

    const [data, setData] = useState([]);
    const [form, setForm] = useState({});
    const [uploading, setUploading] = useState(false); // Add uploading state

    const handleBackButtonClick = () => {
        router.push(`/forms/${params.formId}/${params.phoneNumber}/atur-foto/success`);
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/get-photo-order/${params.formId}/${params.phoneNumber}`
            );
            setData(response.data.images || []);
            const formData = response.data.form || {};
            setForm({
                ...formData,
                slug: formData.linkUndangan
                    ? formData.linkUndangan
                    : `${process.env.NEXT_PUBLIC_LINK_UNDANGAN}/${formData.slug || ''}`
            });
            console.log('Form data:', response.data.form?.linkUndangan);
        } catch (error) {
            console.error('Error fetching data:', error);
            setData([]);
            setForm({});
        }
    };

    useEffect(() => {
        fetchData();
    }, [params.formId, params.phoneNumber]);

    return (
        <LoadingOverlay
            active={uploading}
            spinner
            text="Mengupload foto..."
            styles={{
                overlay: (base) => ({
                    ...base,
                    background: "rgba(0, 0, 0, 0.6)",
                    zIndex: 1000,
                }),
                content: (base) => ({
                    ...base,
                    color: "#fff",
                    fontSize: "1.2rem",
                }),
            }}
        >
            <div className="flex items-center justify-center bg-gray-100 mb-20 md:mb-0">
                <div className="h-full min-h-screen bg-white rounded-lg shadow-lg max-w-xl w-full flex items-center flex-col relative">

                    {/* Back Button */}
                    <Button
                        onClick={handleBackButtonClick}
                        className="absolute top-4 left-4 p-2 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 focus:outline-none"
                    >
                        <BiArrowBack className="h-6 w-6" />
                    </Button>

                    <div className="top-0 p-4 text-center">
                        <h1 className="text-3xl underline">Daftar Foto</h1>
                    </div>

                    {form.slug && (
                        <Link href={form.slug} target='_blank' className="bottom-4 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-3 my-2 text-sm">
                            <BiEnvelope className="h-5 w-5 mr-2 inline" />
                            Link Undangan
                        </Link>
                    )}
                    <Link type="button" href={contactUrl} target='_blank' className="bottom-4 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-3 my-2 text-sm">
                        <BiPhone className="h-5 w-5 mr-2 inline" />
                        Hubungi Admin
                    </Link>

                    <Link
                        href="result/edit"
                        className="rounded-full shadow-lg bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 p-3 my-2 text-sm"
                    >
                        <BiEdit className="h-5 w-5 mr-2 inline" />
                        Edit Undangan
                    </Link>

                    {/* Pass setUploading to DataPhotoTable */}
                    <DataPhotoTable params={params} setUploading={setUploading} />
                </div>
            </div>
        </LoadingOverlay>
    );
};

export default Result;