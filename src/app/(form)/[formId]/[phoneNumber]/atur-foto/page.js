'use client'
import React, { useEffect, useState, useRef } from 'react'
import LoadingOverlay from 'react-loading-overlay-ts'
import MultiStepForm from '@/components/atur-foto/MultiStepForm'
import { checkForm } from '@/utils/checkForm'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BiArrowBack } from 'react-icons/bi'
import { Toaster } from '@/components/ui/toaster'

const AturFoto = ({ params }) => {
  const router = useRouter()

  const [isActive, setActive] = useState(true)
  const [isOverflow, setIsOverflow] = useState(false);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const checkHeight = () => {
    if (containerRef?.current) {
      setTimeout(() => {
        const containerHeight = containerRef.current?.scrollHeight || 0;
        const viewportHeight = window.innerHeight;
        setIsOverflow(containerHeight > viewportHeight);
      }, 100);
    }
  };

  useEffect(() => {
    setActive(false)
  }, [])

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
    <LoadingOverlay active={isActive} spinner text='Loading your content...'>
      <div className="flex flex-col items-center justify-center bg-gray-100 w-screen h-screen">
        <div
          ref={containerRef}
          className={`bg-white rounded-lg shadow-lg w-full max-w-full ${isOverflow ? "h-full overflow-y-auto" : "min-h-screen"} md:max-w-xl flex flex-col relative`}
        >
          {/* Back Button */}
          {/* <Button
            onClick={() => router.push(`/${params.formId}/${params.phoneNumber}/success`)}
            className="absolute top-4 left-4 p-2 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 focus:outline-none"
          >
            <BiArrowBack className="h-6 w-6" />
          </Button> */}
          <div className="p-4 text-center">
            <h1 className="text-3xl underline">Atur Foto</h1>
          </div>
          <Toaster className="z-50" />
          <MultiStepForm onFormChange={checkHeight} />
        </div>
      </div>
    </LoadingOverlay>
  )
}

export default AturFoto;
