'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { BiChevronRight, BiChevronRightCircle, BiPlus } from 'react-icons/bi'
import RenderStepIndicator from '@/components/RenderStepIndicator'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import LoadingOverlay from 'react-loading-overlay-ts'
const DetailAcara = ({ params }) => {

  const pathname = usePathname()
  const router = useRouter()

  const [listImages, setListImages] = useState([]);
  const [count, setCount] = useState(10);
  const [step, setStep] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState([]);
  const [selectedImageSrc, setSelectedImageSrc] = useState([]); // State for image sources
  const [imageOrder, setImageOrder] = useState([]);
  const [disBtn, setDisBtn] = useState(true);
  const [isActive, setActive] = useState(true)

  const handleButtonClick = async () => {

  };

  const handleAddPhoto = (type) => {
    console.log(type)
  }

  useEffect(() => {
    setActive(false)
  }, [])


  return (
    <>
      <LoadingOverlay
        active={isActive}
        spinner
        text='Loading your content...'
      >
        <div className="flex flex-col items-center justify-center bg-gray-100 min-h-screen">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full flex flex-col relative">
            <div className="p-4 text-center"> {/* Align text to the left */}
              <h1 className="text-3xl underline">Atur Foto</h1>
            </div>

            {/* Titles aligned left */}
            <div className="p-4 text-left">
              <h2 className="text-xl font-semibold">Foto Wedding</h2>
              <div className="flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg my-4 w-full h-16" onClick={() => handleAddPhoto("wedding-photo")}>
                <BiPlus className="h-10 w-10 text-gray-500" />
              </div>

              <h2 className="text-xl font-semibold">Foto Background</h2>
              <div className="flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg my-4 w-full h-16" onClick={() => handleAddPhoto("bg-photo")}>
                <BiPlus className="h-10 w-10 text-gray-500" />
              </div>

              <h2 className="text-xl font-semibold">Galeri</h2>
              <div className="flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg my-4 w-full h-16" onClick={() => handleAddPhoto("gallery")}>
                <BiPlus className="h-10 w-10 text-gray-500" />
              </div>

              <h2 className="text-xl font-semibold">Foto Footer</h2>
              <div className="flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg my-4 w-full h-16" onClick={() => handleAddPhoto("footer")}>
                <BiPlus className="h-10 w-10 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-center">
              <Link href={pathname + '/table'} className='my-4 text-blue-600 underline'>Skip</Link>
            </div>
          </div>

          <Button
            className="fixed bottom-4 right-4 md:right-[30%] rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={disBtn}
            onClick={handleButtonClick}
          >
            <BiChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </LoadingOverlay>

    </>

  )
}

export default DetailAcara