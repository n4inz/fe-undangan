"use client"
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftIcon, PhoneIcon } from '@heroicons/react/24/solid';
// import { useRouter } from 'next/router'; // Import useRouter

export default function Success({params}) {
  
  const contactUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER}?text=Halo,%0ASaya%20ingin%20memesan%20undangan%20dengan%20kode%20id%20:%20${params.formId}`; // Use formId in the URL

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="h-screen justify-center bg-white p-8 rounded-lg shadow-lg max-w-lg w-full flex items-center flex-col relative">
        <Link href={'/'} type='button' className="absolute top-4 left-4">
        <ArrowLeftIcon className="h-8 w-8" />
        </Link>
        
        <div className='text-center'>
          <p className='text-lg font-semibold'>Terima Kasih Telah Mengisi Form SewaUndangan Pesanan Anda Akan Segera Kami Proses 🙏</p>
        </div>
        <Image src="/images/success-form.gif"
          alt="Success"
          width={100}
          height={100}
          className=''
        />
        <div className='flex mt-4 items-center'>

          <Link type="button" href={contactUrl} target='_blank' className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full flex items-center">
            <PhoneIcon className="h-6 w-6 mr-2" />
            Hubungi Admin
          </Link>
        </div>
      </div>

    </div>
  );
}