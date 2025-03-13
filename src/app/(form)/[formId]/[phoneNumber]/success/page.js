"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BiArrowBack, BiPhone, BiPhotoAlbum } from "react-icons/bi";
import { usePathname, useRouter } from "next/navigation";
import { checkForm } from "@/utils/checkForm";
import PaymentModal from "./paymentModal";
import { Toaster } from "@/components/ui/toaster";

const Success = ({ params }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const contactUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER}?text=Halo,%0ASaya%20ingin%20memesan%20undangan%20dengan%20kode%20id%20:%20${params.formId}`;

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await checkForm(params.formId, params.phoneNumber);

      if (error) {
        console.error(error);
        router.replace('/'); // Redirect on error
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.formId, params.phoneNumber, router]);

  if (loading) {
    return null; // Render nothing while loading
  }

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <Toaster className="z-50" /> {/* Tambahkan ini */}
      <div className="h-screen justify-center bg-white p-8 rounded-lg shadow-lg max-w-lg w-full flex items-center flex-col relative">
        {/* Back Button */}
        <Link href="/" className="absolute top-4 left-4">
          <BiArrowBack className="h-8 w-8" />
        </Link>

        {/* Success Message */}
        <div className="text-center">
          <p className="text-lg font-semibold">
            Terima Kasih Telah Mengisi Form SewaUndangan. Pesanan dengan ID {params.formId} Akan Segera Kami Proses setelah melakukan pembayaran 🙏
          </p>
        </div>

        {/* Success Image */}
        <Image
          src="/images/success-form.gif"
          alt="Success"
          width={100}
          height={100}
        />

        {/* Contact Admin Button */}
        <div className="flex mt-4 items-center">
          <Link
            href={contactUrl}
            target="_blank"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full flex items-center"
          >
            <BiPhone className="h-6 w-6 mr-2" />
            Hubungi Admin
          </Link>
        </div>

        <div className="flex mt-4 items-center">
          <PaymentModal
            formId={params.formId}
            phoneNumber={params.phoneNumber}
          />
        </div>

        {/* Atur Foto Button */}
        <div className="flex mt-4 items-center">
          <Link
            href={`${pathname}/atur-foto-v2`}
            className="bg-slate-500 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-full flex items-center"
          >
            <BiPhotoAlbum className="h-6 w-6 mr-2" />
            Atur Foto
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Success;