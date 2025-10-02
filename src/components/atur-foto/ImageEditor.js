'use client'
import { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { FaTimes, FaCheck, FaUndoAlt, FaRedoAlt, FaCrop, FaArrowLeft } from 'react-icons/fa';
import { set } from 'date-fns';
import { Button } from '../ui/button';

const ImageEditor = ({ image, onSave, onCancel, idImage = null }) => {
  const [step, setStep] = useState('rotate');
  const [rotation, setRotation] = useState(0);
  const [rotatedImage, setRotatedImage] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [btnDone, setBtnDone] = useState(false);
  
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (step === 'crop' && rotatedImage) {
      setCrop({
        unit: '%',
        width: 100,
        height: 100,
        aspect: aspectRatio
      });
    }
  }, [step, rotatedImage, aspectRatio]);

  const aspectRatioPresets = [
    { value: null, label: 'Free' },
    { value: 0.5, label: '9:16' },
    { value: 0.75, label: '3:4' },
    { value: 1, label: '1:1' },
    { value: 1.33, label: '4:3' },
    { value: 1.5, label: '3:2' },
    { value: 1.77, label: '16:9' },
  ];

  const rotateLeft = () => setRotation((prev) => prev - 90);
  const rotateRight = () => setRotation((prev) => prev + 90);

  const handlePresetClick = (value) => {
    setAspectRatio(value);
    setCrop(prev => ({ ...prev, aspect: value }));
  };

  const applyRotation = async () => {
    return new Promise((resolve, reject) => {
      const imageObj = new Image();
      // Add crossOrigin attribute to handle CORS
      imageObj.crossOrigin = 'Anonymous';
      imageObj.src = image;
      
      imageObj.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Could not get canvas context');

          const angle = rotation % 360;
          const radians = (angle * Math.PI) / 180;
          const sin = Math.abs(Math.sin(radians));
          const cos = Math.abs(Math.cos(radians));
          const newWidth = imageObj.width * cos + imageObj.height * sin;
          const newHeight = imageObj.width * sin + imageObj.height * cos;

          canvas.width = newWidth;
          canvas.height = newHeight;

          ctx.translate(newWidth / 2, newHeight / 2);
          ctx.rotate(radians);
          ctx.drawImage(imageObj, -imageObj.width / 2, -imageObj.height / 2);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (error) {
          reject(error);
        }
      };
      imageObj.onerror = (err) => reject(err);
    });
  };

  const handleNext = async () => {
    try {
      const rotated = await applyRotation();
      setRotatedImage(rotated);
      setStep('crop');
    } catch (err) {
      console.error('Error applying rotation', err);
      // Fallback to original image if rotation fails
      setRotatedImage(image);
      setStep('crop');
    }
  };

  const onCropComplete = (crop) => {
    setCompletedCrop(crop);
  };

  const getCroppedImg = async () => {
    setBtnDone(true);
    try {
      if (!completedCrop || !imgRef.current || !canvasRef.current) {
        return;
      }

      const image = imgRef.current;
      const canvas = canvasRef.current;
      const crop = completedCrop;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      // Convert canvas to blob and then to data URL
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            onSave(reader.result);
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.9);
    } catch (e) {
      console.error('Error cropping image', e);
      // Fallback to original image if cropping fails
      onSave(rotatedImage || image);
      setBtnDone(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col" ref={containerRef}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-800/80 backdrop-blur-sm z-10">
        <button
          onClick={onCancel}
          className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Cancel"
        >
          <FaTimes className="w-6 h-6 lg:w-4 lg:h-4" />
        </button>
        {step === 'rotate' ? (
          <Button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FaCheck className="w-6 h-6 lg:w-4 lg:h-4" />
            <span>Next</span>
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button
              onClick={() => setStep('rotate')}
              className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Back"
            >
              <FaArrowLeft className="w-6 h-6 lg:w-4 lg:h-4" />
            </Button>
            <Button
              onClick={getCroppedImg}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center gap-2"
              disabled={btnDone}
            >
              <FaCheck className="w-6 h-6 lg:w-4 lg:h-4" />
              <span>Done</span>
            </Button>
          </div>
        )}
      </div>

      {step === 'rotate' && (
        <div className="relative flex-1 w-full flex flex-col items-center justify-center p-4">
          <div className="mb-24">
            <img
              src={image}
              alt="To rotate"
              style={{ transform: `rotate(${rotation}deg)` }}
              className="max-w-full max-h-[60vh] object-contain"
              crossOrigin="anonymous" // Add crossOrigin attribute
            />
          </div>
          <div className="absolute bottom-4 flex gap-6">
            <button
              onClick={rotateLeft}
              className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
              aria-label="Rotate left"
            >
              <FaUndoAlt className="w-6 h-6 lg:w-4 lg:h-4" />
            </button>
            <div className="w-12 h-12 flex items-center justify-center bg-gray-700 rounded-full text-white font-medium">
              {Math.abs(rotation % 360)}°
            </div>
            <button
              onClick={rotateRight}
              className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
              aria-label="Rotate right"
            >
              <FaRedoAlt className="w-6 h-6 lg:w-4 lg:h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'crop' && rotatedImage && (
        <>
          <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={onCropComplete}
              aspect={aspectRatio}
              className="max-h-full"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              <img
                ref={imgRef}
                src={rotatedImage}
                alt="To crop"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 200px)',
                  objectFit: 'contain' 
                }}
                crossOrigin="anonymous" // Add crossOrigin attribute
              />
            </ReactCrop>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm p-4">
            <div className="flex justify-center gap-2 mb-4">
              {aspectRatioPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset.value)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    (aspectRatio === preset.value) 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ImageEditor;