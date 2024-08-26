'use client';
import React, { useState, useEffect } from "react";
import Image from 'next/image';
// import { z } from 'zod';
// import LoadingSpinner from '../components/LoadingSpinner'; // Adjust the path as needed
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import axios from "axios";

// import { BiX } from "react-icons/bi";

const Detail = ({params}) => {

    const [formData, setFormData] = useState({});
    const [listImages, setListImages] = useState([]);
  
    
    const fetchData = async () => {
      try {
        const response = await axios.get(process.env.NEXT_PUBLIC_API_URL+`/forms/${params.formId}`);
        setFormData(response.data.form);
        

        // console.log(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const fetchImage = async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/image-order/${params.formId}`);
      setListImages(response.data.images);
      
      
    };
    
    useEffect(() => {
      fetchData();
      fetchImage()
    }, []);

    useEffect(() => {
      console.log("ListImages:", listImages)
    }, [listImages]);

    return (
        <>
            <div className="h-10 z-50 bg-white border-b w-full"></div>
            <div className="flex min-h-screen mx-4">
                {/* Sidebar */}
                <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden">
                    {/* <Sidebar /> */}
                </div>
                
                {/* Main Content */}
                <div className="flex flex-col flex-grow w-full md:pl-24">
                    <div className="p-4">
                        Detail : ID {params.formId}
                    </div>
                    <div className="mb-4">
            <label className="block text-gray-700">Nomor Whatsapp Anda<span className='text-red-500'>*</span></label>
            <Input
              type="text"
              name="nomorWa"
              value={formData.nomorWa}
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
              inputMode="numeric"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Nama Anda <span className='text-red-500'>*</span></label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          {/* Mempelai Pria */}
          <div className="mb-4">
            <label className="block text-gray-700">Nama Lengkap Mempelai Pria
              <span className='text-red-500'>*</span></label>
            <Input
              type="text"
              name="namaLengkapPria"
              value={formData.namaLengkapPria}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Nama Panggilan Mempelai Pria
              <span className='text-red-500'>*</span></label>
            <Input
              type="text"
              name="namaPanggilanPria"
              value={formData.namaPanggilanPria}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Nama Orang Tua Mempelai Pria<span className='text-red-500'>*</span>
              <br></br>Ex: Bapak Rozan Dan Ibu Marlina
            </label>
            <Input
              type="text"
              name="namaOrtuPria"
              value={formData.namaOrtuPria}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Tempat Lahir Mempelai Pria
              <span className='text-red-500'>*</span></label>
            <Input
              type="text"
              name="tempatLahirPria"
              value={formData.tempatLahirPria}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Tanggal Lahir Mempelai Pria <span className='text-red-500'>*</span></label>
            <input
              type="date"
              name="tglLahirPria"
              value={formData.tglLahirPria}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          {/* Mempelai Wanita */}
          <div className="mb-4">
            <label className="block text-gray-700">Nama Lengkap Mempelai Wanita
              <span className='text-red-500'>*</span></label>
            <Input
              type="text"
              name="namaLengkapWanita"
              value={formData.namaLengkapWanita}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Nama Panggilan Mempelai Wanita
              <span className='text-red-500'>*</span></label>
            <Input
              type="text"
              name="namaPanggilanWanita"
              value={formData.namaPanggilanWanita}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Nama Orang Tua Mempelai Wanita<span className='text-red-500'>*</span>
              <br></br>Ex: Bapak Rozan Dan Ibu Marlina
            </label>
            <Input
              type="text"
              name="namaOrtuWanita"
              value={formData.namaOrtuWanita}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Tempat Lahir Mempelai Wanita
              <span className='text-red-500'>*</span></label>
            <Input
              type="text"
              name="tempatLahirWanita"
              value={formData.tempatLahirWanita}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Tanggal Lahir Mempelai Wanita <span className='text-red-500'>*</span></label>
            <input
              type="date"
              name="tglLahirWanita"
              value={formData.tglLahirWanita}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          {/* Acara */}
          <div className="mb-4">
            <label className="block text-gray-700">
              Tanggal dan Jam Acara (Akad / Pemberkatan )
              <span className='text-red-500'>*</span>
            </label>
            <input
              type="datetime-local"
              name="datetimeAkad"
              value={formData.datetimeAkad}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Tanggal dan Jam Acara Resepsi
              <span className='text-red-500'>*</span>
            </label>
            <input
              type="datetime-local"
              name="datetimeResepsi"
              value={formData.datetimeResepsi}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Alamat Acara Akad/Pemberkatan (Alamat)<span className='text-red-500'>*</span>
              <br></br>
              Ex: Jl Jambu  Selatan No 123
            </label>
            <Input
              type="text"
              name="alamatAkad"
              value={formData.alamatAkad}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Alamat Acara Resepsi (Alamat)<span className='text-red-500'>*</span>
              <br></br>
              Ex: Jl Jambu  Selatan No 123
            </label>
            <Input
              type="text"
              name="alamatResepsi"
              value={formData.alamatResepsi}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Tempat Acara Akad/Pemberkatan
              <span className='text-red-500'>*</span>
            </label>

            <Input
              type="text"
              name="linkSherlokAkad"
              value={formData.alamatAkad}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />

            {/* {errors.alamatResepsi && <p className="text-red-500 text-sm mt-1">{errors.alamatResepsi}</p>} */}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">
              Tempat Acara Resepsi
              <span className='text-red-500'>*</span>
            </label>

            <Input
              type="text"
              name="linkSherlokAkad"
              value={formData.alamatResepsi}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
            {/* {errors.alamatResepsi && <p className="text-red-500 text-sm mt-1">{errors.alamatResepsi}</p>} */}
          </div>

          {/* OPTIONAL */}
          <div className="mb-4">
            <label className="block text-gray-700">
              Link Live streaming (YT)
            </label>
            <Input
              type="text"
              name="liveYt"
              value={formData.liveYt}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />

          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Username Instagram (Pria & Wanita)
            </label>
            <Input
              type="text"
              name="usernameIg"
              value={formData.usernameIg}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Nomor Rekening Jika ada tamu ingin kirim hadiah (Nama Bank Dan atas nama rekening)
            </label>
            <Input
              type="text"
              name="noRek"
              value={formData.noRek}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Alamat Rumah Jika ada Pengiriman Hadiah Dari tamu Undangan
            </label>
            <Input
              type="text"
              name="alamatHadiah"
              value={formData.alamatHadiah}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Ceritakan awal bertemu</label>
            <Textarea
              name="ceritaAwal"
              value={formData.ceritaAwal}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Ceritakan awal jadian</label>
            <Textarea
              name="ceritaJadian"
              value={formData.ceritaJadian}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Ceritakan awal lamaran</label>
            <Textarea
              name="ceritaLamaran"
              value={formData.ceritaLamaran}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Link Maps / Sharelok lokasi acara (Akad/Pemberkatan)
            </label>
            <Input
              type="text"
              name="linkSherlokAkad"
              value={formData.linkSherlokAkad}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Link Maps / Sharelok lokasi acara Resepsi
            </label>
            <Input
              type="text"
              name="linkSherlokResepsi"
              value={formData.linkSherlokResepsi}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Posisi Nama Penempatan Tulisan Untuk Mempelai
              <span className='text-red-500'>*</span>
            </label>

            <Input
              type="text"
              name="penempatanTulisan"
              value={formData.penempatanTulisan}
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />

          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Pilihan Thema Ceknya di{' '}
              <a href='https://sewaundangan.com/#chat_me' target='_blank' rel='noopener noreferrer' className="text-blue-500 hover:underline">
                Sewaundangan.com
              </a>
              <span className='text-red-500'>*</span>
            </label>

            <Input
              type="text"
              name="pilihanTema"
              value={formData.pilihanTema}
              
              className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
            />

            {/* {errors.alamatResepsi && <p className="text-red-500 text-sm mt-1">{errors.alamatResepsi}</p>} */}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Upload Foto Yang Ingin Di Tampilkan (1)</label>

          </div>
         <div className="flex flex-wrap gap-2 mb-4">
            {listImages.map((src, index) => (
              <div key={index} className="relative h-56 max-w-xs w-full">
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}/images/${src.images.fileImage}`}
                  alt={`Image ${index}`}
                  fill
                  className="rounded-lg border border-gray-300 object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
                </div>
            </div>
        </>
    );


}

export default Detail;