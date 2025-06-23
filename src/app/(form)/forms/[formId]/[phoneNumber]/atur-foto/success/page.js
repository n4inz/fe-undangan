"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BiArrowBack, BiEnvelope, BiPhone, BiPhotoAlbum } from "react-icons/bi";
import { usePathname, useRouter } from "next/navigation";
import { checkForm } from "@/utils/checkForm";
import PaymentModal from "./paymentModal";
import { Toaster } from "@/components/ui/toaster";

const Success = ({ params }) => {
  const { formId, phoneNumber } = params; // Destructure params for cleaner access
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // Initialize form as null

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await checkForm(formId, phoneNumber);

        if (error) {
          console.error("Error fetching form data:", error);
          router.replace("/"); // Redirect on error
          return; // Stop execution if there's an error
        }

        const formData = data.form || {};
        setForm({
          ...formData,
          slug: formData.linkUndangan
            ? formData.linkUndangan
            : `${process.env.NEXT_PUBLIC_LINK_UNDANGAN}/${formData.slug || ""}`,
        });
      } catch (e) {
        console.error("Failed to fetch form data:", e);
        router.replace("/");
      } finally {
        setLoading(false); // Ensure loading is set to false after fetch attempt
      }
    };

    fetchData();
  }, [formId, phoneNumber, router]); // Dependency array remains the same

  // --- Render Logic ---
  if (loading) {
    return null; // Or a loading spinner/component
  }

  // Handle case where form data might not be available after loading
  if (!form) {
    router.replace("/"); // Redirect if form data is unexpectedly empty
    return null;
  }

  // Original button classes from your code
  const buttonContainerClasses = "w-64 mt-4 flex items-center justify-center";
  const linkButtonClasses = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center w-full";
  const editButtonClasses = "bg-slate-500 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center w-full";


  return (
    <div className="flex items-center justify-center bg-gray-100">
      <Toaster className="z-50" />
      <div className="h-screen justify-center bg-white p-8 rounded-lg shadow-lg max-w-lg w-full flex items-center flex-col relative">
        {/* Back Button */}
        <Link href={`/forms/${formId}/${phoneNumber}/atur-foto`} className="absolute top-4 left-4">
          <BiArrowBack className="h-8 w-8" />
        </Link>

        {/* Success Message */}
        <div className="text-center">
          <p className="text-lg font-semibold">
            Terima Kasih Telah Mengisi Form SewaUndangan. Pesanan dengan ID {formId} Akan Segera Kami Proses setelah melakukan pembayaran 🙏
          </p>
        </div>

        {/* Success Image */}
        <Image
          src="/images/success-form.gif"
          alt="Success"
          width={100}
          height={100}
        />

        {/* Link Undangan Button */}
        {form.slug && (
          <div className={buttonContainerClasses}>
            <Link href={form.slug} target='_blank' className={linkButtonClasses}>
              <BiEnvelope className="h-6 w-6 mr-2" />
              Link Undangan
            </Link>
          </div>
        )}

        {/* Payment Modal Button */}
        <div className={buttonContainerClasses}>
          <PaymentModal
            formId={formId}
            phoneNumber={phoneNumber}
            // Pass a className to the button within PaymentModal if it renders one
            buttonClassName={linkButtonClasses}
          />
        </div>

        {/* Edit Data Button */}
        <div className={buttonContainerClasses}>
          <Link
            href={`${pathname}/result`}
            className={editButtonClasses}
          >
            <BiPhotoAlbum className="h-6 w-6 mr-2" />
            Edit Data
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Success;