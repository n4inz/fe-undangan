'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { BiChevronRight, BiChevronRightCircle } from 'react-icons/bi'
import RenderStepIndicator from '@/components/RenderStepIndicator'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'
import { Button } from '@/components/ui/button'
const DetailAcara = ({ params }) => {

  const pathname = usePathname()
  const router = useRouter()

  const [listImages, setListImages] = useState([]);
  const [count, setCount] = useState();
  const [step, setStep] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState([]);
  const [selectedImageSrc, setSelectedImageSrc] = useState([]); // State for image sources
  const [imageOrder, setImageOrder] = useState([]);
  const [disBtn, setDisBtn] = useState(true);

  const handleImageClick = (index, src, srcId) => {
    setSelectedImageIndex((prevIndexes) => {
      let updatedIndexes = [];
      let updatedSources = [];

      if (prevIndexes.includes(index)) {
        // If the image is already selected, remove it and its source
        updatedIndexes = prevIndexes.filter((i) => i !== index);
        updatedSources = selectedImageSrc.filter((s) => s !== src);
      } else {
        if (prevIndexes.length < 2) {
          // If fewer than 2 images are selected, add the new one and its source
          updatedIndexes = [...prevIndexes, index];
          updatedSources = [...selectedImageSrc, src];
        } else {
          // If 2 images are already selected, replace the oldest one and update sources
          updatedIndexes = [prevIndexes[1], index];
          updatedSources = [selectedImageSrc[1], src];
        }
      }

      // If only one image remains in listImages, enable the button with one selected image
      if (listImages.length === 1) {
        setDisBtn(updatedIndexes.length !== 1);
      } else {
        // Otherwise, enable the button only when 2 images are selected
        setDisBtn(updatedIndexes.length !== 2);
      }

      setSelectedImageSrc(updatedSources);
      return updatedIndexes;
    });
  };

  const handleButtonClick = async () => {
    setImageOrder((prevOrder) => [...prevOrder, ...selectedImageSrc.map((src, index) => ({ id: listImages[selectedImageIndex[index]].id, fileImage: src }))]); // Update to include id and fileImage

    setListImages((prevList) => prevList.filter(file => !selectedImageSrc.includes(file.fileImage))); // Remove selected images from listImages
    setDisBtn(true);
    setStep((prevStep) => prevStep + 1); // Increment step by 1
    setSelectedImageIndex([]);
    setSelectedImageSrc([]);

  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/display-image/${params.formId}/${params.phoneNumber}`);
      setListImages(response.data.image);
      setCount(response.data.count);
      console.log(response.data.image)

      // console.log(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (listImages.length === 0 && imageOrder.length > 0) {
      axios.post(`${process.env.NEXT_PUBLIC_API_URL}/image-order/${params.formId}`, {
        image: imageOrder
      })
      .then(() => router.push(pathname + '/table'))
      .catch(console.error); // Simplified error handling
    }
  }, [listImages, imageOrder]); // No need for the console.log here
  

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="h-full min-h-screen bg-white rounded-lg shadow-lg max-w-lg w-full flex items-center flex-col relative">
        <div className="top-0 p-4 text-center">
          <h1 className="text-3xl underline">Atur Foto</h1>

          <div className='text-center'>
            <RenderStepIndicator dataStep={step} dataAmount={count} />

          </div>
          <p className='mt-2 text-lg'>Pilih 2 Foto lalu tekan tombol <BiChevronRightCircle className='inline' /></p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {listImages.map((file, index) => (
            <div
              key={index}
              className={`w-full max-w-xs rounded-lg border border-gray-300 ${selectedImageIndex.includes(index) ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-blue-200 shadow-lg shadow-blue-500/50' : ''}`} // Add gradient light to ring when active
              onClick={() => handleImageClick(index, file.fileImage, file.id)}
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
      <Button
        className="fixed bottom-4 right-4 md:right-[30%] rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        disabled={disBtn}
        onClick={handleButtonClick}
      >
        <BiChevronRight className="h-8 w-8" />
      </Button>
    </div>


  )
}

export default DetailAcara