'use client'
import React, { useEffect, useState, useRef } from 'react'
import LoadingOverlay from 'react-loading-overlay-ts'
import MultiStepForm from '@/components/atur-foto/MultiStepForm'

const AturFoto = ({ params }) => {
  const [isActive, setActive] = useState(true)
  const [isOverflow, setIsOverflow] = useState(false);
  const containerRef = useRef(null);

  const checkHeight = () => {
    if (containerRef.current) {
      setTimeout(() => {
        const containerHeight = containerRef.current.scrollHeight;
        const viewportHeight = window.innerHeight;
        setIsOverflow(containerHeight > viewportHeight);
      }, 100);
    }
  };

  useEffect(() => {
    setActive(false)
  }, [])

  return (
    <LoadingOverlay active={isActive} spinner text='Loading your content...'>
      <div className="flex flex-col items-center justify-center bg-gray-100 w-screen h-screen">
        <div
          ref={containerRef}
          className={`bg-white rounded-lg shadow-lg w-full max-w-full ${isOverflow ? "h-full overflow-y-auto" : "min-h-screen"} md:max-w-xl flex flex-col relative`}
        >
          <div className="p-4 text-center">
            <h1 className="text-3xl underline">Atur Foto</h1>
          </div>
          <MultiStepForm onFormChange={checkHeight} />
        </div>
      </div>
    </LoadingOverlay>
  )
}

export default AturFoto;
