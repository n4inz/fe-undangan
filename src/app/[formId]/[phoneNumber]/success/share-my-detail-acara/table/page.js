"use client"
import { useEffect, useState } from 'react';
import Image from 'next/image';
// import { Button } from '@/components/ui/button';
import Link from 'next/link';
// import { ArrowLeftIcon, PhoneIcon } from '@heroicons/react/24/solid';
import { BiArrowBack, BiPhone, BiPhotoAlbum } from "react-icons/bi";
import { usePathname } from 'next/navigation'; // Add this import
import axios from 'axios';

const TableFoto = ({ params }) => {

  const pathname = usePathname()

  const [listImages, setListImages] = useState([]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/display-image/${params.formId}/${params.phoneNumber}`);
      setListImages(response.data.image);

      // console.log(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="h-full min-h-screen bg-white rounded-lg shadow-lg w-full flex items-center flex-col relative">
        <div className="grid grid-cols-2 gap-4 my-4">
          {listImages.map((file, index) => (
            <div
              key={index}
              className={`w-full max-w-xs rounded-lg border border-gray-300'}`} // Add gradient light to ring when active
              // onClick={() => handleImageClick(index, file.fileImage, file.id)}
            >
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/images/${file.fileImage}`}
                alt={`Image ${index}`}
                width={250}
                height={150}
                className="rounded-lg object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default TableFoto;